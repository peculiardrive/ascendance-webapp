import { json, readJson, readState, requireFields, uid, userIdFrom, writeState } from "@/lib/store";

export async function GET() {
  const state = await readState();
  return json({ ok: true, posts: state.posts.filter((post) => post.status !== "Hidden") });
}

export async function POST(request) {
  try {
    const state = await readState();
    const userId = userIdFrom(request);
    const payload = await readJson(request);
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
