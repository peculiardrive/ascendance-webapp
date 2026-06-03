import { json, readJson, readState, requireFields, uid, userIdFrom, writeState } from "@/lib/store";

export async function GET() {
  const state = await readState();
  return json({ ok: true, posts: state.posts.filter((post) => !["Hidden", "Deleted"].includes(post.status)) });
}

export async function POST(request) {
  try {
    const state = await readState();
    const userId = userIdFrom(request);
    const payload = await readJson(request);

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
      const user = state.users.find((item) => item.id === userId);
      if (!user) return json({ ok: false, error: "User not found." }, { status: 404 });
      post.comments = post.comments || [];
      post.comments.push({
        id: uid("comment"),
        userId,
        user: user.username || user.fullName,
        country: user.country || "NG",
        avatar: user.avatar || "A",
        text: payload.comment,
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

    if (payload.action === "moderate") {
      requireFields(payload, ["postId", "status"]);
      const post = state.posts.find((item) => item.id === payload.postId);
      if (!post) return json({ ok: false, error: "Post not found." }, { status: 404 });
      post.status = payload.status;
      await writeState(state);
      return json({ ok: true, post });
    }

    if (payload.action === "admin-reply") {
      requireFields(payload, ["postId", "comment"]);
      const post = state.posts.find((item) => item.id === payload.postId);
      if (!post) return json({ ok: false, error: "Post not found." }, { status: 404 });
      post.comments = post.comments || [];
      post.comments.push({
        id: uid("comment"),
        user: "Admin",
        country: "HQ",
        avatar: "A",
        text: payload.comment,
        parentId: payload.parentId || null,
        isAdmin: true,
        createdAt: new Date().toISOString()
      });
      await writeState(state);
      return json({ ok: true, post });
    }

    requireFields(payload, ["content"]);
    const user = state.users.find((item) => item.id === userId);
    if (!user) return json({ ok: false, error: "User not found." }, { status: 404 });

    const post = {
      id: uid("post"),
      userId,
      username: user.username || user.fullName,
      country: user.country || "NG",
      bookId: payload.bookId || null,
      content: payload.content,
      image: payload.image || null,
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
    return json({ ok: false, error: error.message }, { status: 400 });
  }
}
