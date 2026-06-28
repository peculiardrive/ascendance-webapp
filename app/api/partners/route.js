import { json, readJson, readState, writeState, uid } from "@/lib/store";
import { assertSameOrigin } from "@/lib/session";

const CIRCLE_ORDER = {
  "Regent": 1,
  "Collectors": 2,
  "Ivory": 3,
  "Scholars": 4,
  "Vision Partner": 5
};

export async function GET(request) {
  try {
    const state = await readState();
    const partners = state.partners || [];
    
    // Sort partners: Regent Circle > Collectors > Ivory > Scholars > Vision Partner
    // For same circle, sort by createdAt (newest first)
    const sorted = [...partners].sort((a, b) => {
      const orderA = CIRCLE_ORDER[a.circle] || 99;
      const orderB = CIRCLE_ORDER[b.circle] || 99;
      if (orderA !== orderB) {
        return orderA - orderB;
      }
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

    return json({ ok: true, partners: sorted });
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

      const partner = {
        id: uid("partner"),
        email,
        name: fullName,
        country: country || "NG",
        circle,
        amount: Number(amount),
        currency: currency || "NGN",
        remark: null,
        createdAt: new Date().toISOString()
      };

      state.partners.unshift(partner);
      await writeState(state);
      return json({ ok: true, partner });
    }

    if (payload.action === "remark") {
      const { partnerId, title, content } = payload;
      if (!partnerId) {
        return json({ ok: false, error: "Missing partnerId" }, { status: 400 });
      }

      const partner = state.partners.find(p => p.id === partnerId);
      if (!partner) {
        return json({ ok: false, error: "Partner not found" }, { status: 404 });
      }

      partner.remark = {
        id: uid("remark"),
        title: title || "Partner Reflection",
        content: content || "",
        likes: 0,
        likedBy: [],
        comments: [],
        createdAt: new Date().toISOString()
      };

      await writeState(state);
      return json({ ok: true, partner });
    }

    if (payload.action === "like") {
      const { partnerId, visitorId } = payload;
      if (!partnerId) {
        return json({ ok: false, error: "Missing partnerId" }, { status: 400 });
      }

      const partner = state.partners.find(p => p.id === partnerId);
      if (!partner || !partner.remark) {
        return json({ ok: false, error: "Remark not found" }, { status: 404 });
      }

      const activeUser = visitorId || "visitor-anonymous";
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

      const partner = state.partners.find(p => p.id === partnerId);
      if (!partner || !partner.remark) {
        return json({ ok: false, error: "Remark not found" }, { status: 404 });
      }

      const comment = {
        id: uid("comment"),
        user: userName?.trim() || "Visitor",
        country: countryCode?.trim().toUpperCase() || "NG",
        avatar: (userName?.trim() || "V").slice(0, 2).toUpperCase(),
        text: text.trim().slice(0, 1000),
        createdAt: new Date().toISOString()
      };

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
      state.partners = (state.partners || []).filter(p => p.id !== partnerId);
      await writeState(state);
      return json({ ok: true });
    }

    return json({ ok: false, error: "Invalid action" }, { status: 400 });
  } catch (error) {
    return json({ ok: false, error: error.message }, { status: 500 });
  }
}
