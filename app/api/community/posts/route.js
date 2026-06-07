import { prisma } from "@/lib/prisma";
import { adminSessionFrom, assertSameOrigin, readerSessionFrom } from "@/lib/session";
import { json, readJson, readState, requireFields, uid, writeState } from "@/lib/store";

function postForReader(post) {
  const { likedBy, reports, ...safePost } = post;
  return {
    ...safePost,
    reported: false,
    likes: Array.isArray(likedBy) ? likedBy.length : Number(post.likes || 0)
  };
}

export async function GET(request) {
  const state = await readState();
  const adminSession = adminSessionFrom(request);
  const admin = adminSession
    ? await prisma.adminUser.findUnique({ where: { id: adminSession.sub }, select: { id: true } })
    : null;
  const posts = admin
    ? state.posts
    : state.posts
        .filter((post) => !["Hidden", "Deleted", "Pending"].includes(post.status))
        .map(postForReader);
  return json({ ok: true, posts });
}

export async function POST(request) {
  try {
    assertSameOrigin(request);
    const state = await readState();
    const payload = await readJson(request);

    if (payload.action === "moderate" || payload.action === "admin-reply") {
      const adminSession = adminSessionFrom(request);
      const admin = adminSession
        ? await prisma.adminUser.findUnique({ where: { id: adminSession.sub } })
        : null;
      if (!admin) return json({ ok: false, error: "Admin authorization required." }, { status: 403 });

      requireFields(payload, ["postId"]);
      const post = state.posts.find((item) => item.id === payload.postId);
      if (!post) return json({ ok: false, error: "Post not found." }, { status: 404 });

      if (payload.action === "moderate") {
        const allowedStatuses = new Set(["Visible", "Hidden", "Deleted", "Pending"]);
        if (!allowedStatuses.has(payload.status)) {
          return json({ ok: false, error: "Invalid moderation status." }, { status: 400 });
        }
        post.status = payload.status;
      } else {
        const comment = String(payload.comment || "").trim().slice(0, 1000);
        if (!comment) return json({ ok: false, error: "Comment is required." }, { status: 400 });
        post.comments = post.comments || [];
        post.comments.push({
          id: uid("comment"),
          user: admin.name,
          country: "HQ",
          avatar: "A",
          text: comment,
          parentId: payload.parentId || null,
          isAdmin: true,
          createdAt: new Date().toISOString()
        });
      }

      await writeState(state);
      return json({ ok: true, post });
    }

    const userId = readerSessionFrom(request)?.sub;
    if (!userId) return json({ ok: false, error: "Reader login required." }, { status: 401 });
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return json({ ok: false, error: "Reader session is no longer valid." }, { status: 401 });

    if (payload.action === "like") {
      requireFields(payload, ["postId"]);
      const post = state.posts.find((item) => item.id === payload.postId);
      if (!post) return json({ ok: false, error: "Post not found." }, { status: 404 });
      post.likedBy = post.likedBy || [];
      if (post.likedBy.includes(userId)) post.likedBy = post.likedBy.filter((id) => id !== userId);
      else post.likedBy.push(userId);
      post.likes = post.likedBy.length;
      await writeState(state);
      return json({ ok: true, post });
    }

    if (payload.action === "comment") {
      requireFields(payload, ["postId", "comment"]);
      const post = state.posts.find((item) => item.id === payload.postId);
      if (!post) return json({ ok: false, error: "Post not found." }, { status: 404 });
      const comment = String(payload.comment).trim().slice(0, 1000);
      if (!comment) return json({ ok: false, error: "Comment is required." }, { status: 400 });
      post.comments = post.comments || [];
      post.comments.push({
        id: uid("comment"),
        userId,
        user: user.username || user.fullName,
        country: user.countryCode || "NG",
        avatar: user.avatar || "A",
        text: comment,
        parentId: payload.parentId || null,
        isAdmin: false,
        createdAt: new Date().toISOString()
      });
      await writeState(state);
      return json({ ok: true, post });
    }

    if (payload.action === "report") {
      requireFields(payload, ["postId"]);
      const post = state.posts.find((item) => item.id === payload.postId);
      if (!post) return json({ ok: false, error: "Post not found." }, { status: 404 });
      post.reports = post.reports || [];
      post.reports.push({ userId, reason: payload.reason || "Reader report", createdAt: new Date().toISOString() });
      post.reported = true;
      await writeState(state);
      return json({ ok: true, post });
    }

    requireFields(payload, ["content"]);
    const content = String(payload.content).trim().slice(0, 2000);
    if (!content) return json({ ok: false, error: "Review content is required." }, { status: 400 });

    const post = {
      id: uid("post"),
      userId,
      username: user.username || user.fullName,
      country: user.countryCode || "NG",
      bookId: payload.bookId || null,
      content,
      image: null,
      likes: 0,
      likedBy: [],
      comments: [],
      status: state.settings.autoApprovePosts === false ? "Pending" : "Visible",
      pinned: false,
      createdAt: new Date().toISOString()
    };

    state.posts.unshift(post);
    await writeState(state);
    return json({ ok: true, post }, { status: 201 });
  } catch (error) {
    return json({ ok: false, error: error.message }, { status: error.status || 400 });
  }
}
