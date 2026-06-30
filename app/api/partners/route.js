import { json, readJson, readState, writeState, uid } from "@/lib/store";
import { assertSameOrigin } from "@/lib/session";
import { prisma } from "@/lib/prisma";

const CIRCLE_ORDER = {
  "Regent": 1,
  "Collectors": 2,
  "Ivory": 3,
  "Remnant": 4,
  "Vision Partner": 5
};

export async function GET(request) {
  try {
    const state = await readState();
    const partners = state.partners || [];
    
    const dbDonations = await prisma.userActivity.findMany({
      where: { action: "PARTNER_DONATION" },
      orderBy: { createdAt: "desc" }
    });

    const dbPartners = dbDonations.map(a => {
      const details = typeof a.details === 'object' && a.details !== null ? a.details : {};
      return {
        id: a.id,
        email: a.email || "Guest",
        name: details.donorName || details.fullName || "Guest Reader",
        country: details.country || "NG",
        circle: details.circle || "Vision Partner",
        amount: Number(details.amount || 0),
        currency: details.currency || "NGN",
        remark: details.remark || null,
        createdAt: a.createdAt,
        device: a.device || "—"
      };
    });

    const allPartners = [...partners, ...dbPartners];

    // Sort partners: Regent Circle > Collectors > Ivory > Remnant > Vision Partner
    // For same circle, sort by createdAt (newest first)
    const sorted = allPartners.sort((a, b) => {
      const orderA = CIRCLE_ORDER[a.circle] || 99;
      const orderB = CIRCLE_ORDER[b.circle] || 99;
      if (orderA !== orderB) {
        return orderA - orderB;
      }
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

    // Filter public partners to only show entries with remarks/reflections
    const publicPartners = sorted.filter(p => p.remark && p.remark.content && p.remark.content.trim() !== "");

    return json({
      ok: true,
      partners: publicPartners,
      donationLogs: sorted
    });
  } catch (error) {
    return json({ ok: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    assertSameOrigin(request);
    const state = await readState();
    const payload = await readJson(request);

    if (!state.partners) {
      state.partners = [];
    }

    if (payload.action === "donate") {
      const { email, fullName, country, circle, amount, currency } = payload;
      if (!email || !fullName || !circle || !amount) {
        return json({ ok: false, error: "Missing required fields" }, { status: 400 });
      }

      // Log the activity to database as a persistent record
      let activity;
      try {
        const userAgent = request.headers.get("user-agent") || "";
        const isMobile = /mobile|android|iphone|ipad|phone/i.test(userAgent);
        const device = isMobile ? "Mobile" : "Desktop";
        activity = await prisma.userActivity.create({
          data: {
            action: "PARTNER_DONATION",
            email: email.trim().toLowerCase(),
            device,
            details: {
              donorName: fullName.trim(),
              circle,
              amount: Number(amount),
              currency: currency || "NGN",
              country: country || "NG",
              remark: null
            }
          }
        });
      } catch (logErr) {
        console.error("Failed to log partner donation activity to db:", logErr);
      }

      const partner = {
        id: activity ? activity.id : uid("partner"),
        email,
        name: fullName,
        country: country || "NG",
        circle,
        amount: Number(amount),
        currency: currency || "NGN",
        remark: null,
        createdAt: activity ? activity.createdAt : new Date().toISOString()
      };

      // Only write to state file as local memory backup
      state.partners.unshift(partner);
      await writeState(state);

      return json({ ok: true, partner });
    }

    if (payload.action === "remark") {
      const { partnerId, title, content } = payload;
      if (!partnerId) {
        return json({ ok: false, error: "Missing partnerId" }, { status: 400 });
      }

      // Find in database
      const activity = await prisma.userActivity.findFirst({
        where: {
          id: partnerId,
          action: "PARTNER_DONATION"
        }
      });

      const remark = {
        id: uid("remark"),
        title: title || "Partner Reflection",
        content: content || "",
        likes: 0,
        likedBy: [],
        comments: [],
        createdAt: new Date().toISOString()
      };

      if (activity) {
        const currentDetails = typeof activity.details === 'object' && activity.details !== null ? activity.details : {};
        const updatedActivity = await prisma.userActivity.update({
          where: { id: partnerId },
          data: {
            details: {
              ...currentDetails,
              remark
            }
          }
        });

        const partner = {
          id: updatedActivity.id,
          email: updatedActivity.email || "Guest",
          name: currentDetails.donorName || currentDetails.fullName || "Guest Reader",
          country: currentDetails.country || "NG",
          circle: currentDetails.circle || "Vision Partner",
          amount: Number(currentDetails.amount || 0),
          currency: currentDetails.currency || "NGN",
          remark,
          createdAt: updatedActivity.createdAt
        };
        return json({ ok: true, partner });
      }

      // Fallback to legacy state.partners
      const partner = state.partners.find(p => p.id === partnerId);
      if (!partner) {
        return json({ ok: false, error: "Partner not found" }, { status: 404 });
      }

      partner.remark = remark;
      await writeState(state);
      return json({ ok: true, partner });
    }

    if (payload.action === "like") {
      const { partnerId, visitorId } = payload;
      if (!partnerId) {
        return json({ ok: false, error: "Missing partnerId" }, { status: 400 });
      }

      const activeUser = visitorId || "visitor-anonymous";

      // Find in database
      const activity = await prisma.userActivity.findFirst({
        where: {
          id: partnerId,
          action: "PARTNER_DONATION"
        }
      });

      if (activity) {
        const currentDetails = typeof activity.details === 'object' && activity.details !== null ? activity.details : {};
        if (!currentDetails.remark) {
          return json({ ok: false, error: "Remark not found" }, { status: 404 });
        }

        let likedBy = currentDetails.remark.likedBy || [];
        if (likedBy.includes(activeUser)) {
          likedBy = likedBy.filter(id => id !== activeUser);
        } else {
          likedBy.push(activeUser);
        }

        const remark = {
          ...currentDetails.remark,
          likedBy,
          likes: likedBy.length
        };

        const updatedActivity = await prisma.userActivity.update({
          where: { id: partnerId },
          data: {
            details: {
              ...currentDetails,
              remark
            }
          }
        });

        const partner = {
          id: updatedActivity.id,
          email: updatedActivity.email || "Guest",
          name: currentDetails.donorName || currentDetails.fullName || "Guest Reader",
          country: currentDetails.country || "NG",
          circle: currentDetails.circle || "Vision Partner",
          amount: Number(currentDetails.amount || 0),
          currency: currentDetails.currency || "NGN",
          remark,
          createdAt: updatedActivity.createdAt
        };
        return json({ ok: true, partner });
      }

      // Fallback to legacy state.partners
      const partner = state.partners.find(p => p.id === partnerId);
      if (!partner || !partner.remark) {
        return json({ ok: false, error: "Remark not found" }, { status: 404 });
      }

      partner.remark.likedBy = partner.remark.likedBy || [];
      if (partner.remark.likedBy.includes(activeUser)) {
        partner.remark.likedBy = partner.remark.likedBy.filter(id => id !== activeUser);
      } else {
        partner.remark.likedBy.push(activeUser);
      }
      partner.remark.likes = partner.remark.likedBy.length;

      await writeState(state);
      return json({ ok: true, partner });
    }

    if (payload.action === "comment") {
      const { partnerId, text, userName, countryCode } = payload;
      if (!partnerId || !text) {
        return json({ ok: false, error: "Missing partnerId or text" }, { status: 400 });
      }

      const comment = {
        id: uid("comment"),
        user: userName?.trim() || "Visitor",
        country: countryCode?.trim().toUpperCase() || "NG",
        avatar: (userName?.trim() || "V").slice(0, 2).toUpperCase(),
        text: text.trim().slice(0, 1000),
        createdAt: new Date().toISOString()
      };

      // Find in database
      const activity = await prisma.userActivity.findFirst({
        where: {
          id: partnerId,
          action: "PARTNER_DONATION"
        }
      });

      if (activity) {
        const currentDetails = typeof activity.details === 'object' && activity.details !== null ? activity.details : {};
        if (!currentDetails.remark) {
          return json({ ok: false, error: "Remark not found" }, { status: 404 });
        }

        let comments = currentDetails.remark.comments || [];
        comments.push(comment);

        const remark = {
          ...currentDetails.remark,
          comments
        };

        const updatedActivity = await prisma.userActivity.update({
          where: { id: partnerId },
          data: {
            details: {
              ...currentDetails,
              remark
            }
          }
        });

        const partner = {
          id: updatedActivity.id,
          email: updatedActivity.email || "Guest",
          name: currentDetails.donorName || currentDetails.fullName || "Guest Reader",
          country: currentDetails.country || "NG",
          circle: currentDetails.circle || "Vision Partner",
          amount: Number(currentDetails.amount || 0),
          currency: currentDetails.currency || "NGN",
          remark,
          createdAt: updatedActivity.createdAt
        };
        return json({ ok: true, partner });
      }

      // Fallback to legacy state.partners
      const partner = state.partners.find(p => p.id === partnerId);
      if (!partner || !partner.remark) {
        return json({ ok: false, error: "Remark not found" }, { status: 404 });
      }

      partner.remark.comments = partner.remark.comments || [];
      partner.remark.comments.push(comment);

      await writeState(state);
      return json({ ok: true, partner });
    }

    if (payload.action === "delete") {
      const { partnerId } = payload;
      if (!partnerId) {
        return json({ ok: false, error: "Missing partnerId" }, { status: 400 });
      }

      const activity = await prisma.userActivity.findFirst({
        where: {
          id: partnerId,
          action: "PARTNER_DONATION"
        }
      });

      if (activity) {
        await prisma.userActivity.delete({
          where: { id: partnerId }
        });
      }

      state.partners = (state.partners || []).filter(p => p.id !== partnerId);
      await writeState(state);
      return json({ ok: true });
    }

    return json({ ok: false, error: "Invalid action" }, { status: 400 });
  } catch (error) {
    return json({ ok: false, error: error.message }, { status: 500 });
  }
}
