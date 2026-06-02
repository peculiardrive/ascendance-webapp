"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { defaultState } from "@/lib/seed";

const STORAGE_KEY = "ascendance_next_user";

function currency(amount) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0
  }).format(amount || 0);
}

function flattenChapters(books) {
  return books.flatMap((book) =>
    (book.sections || []).flatMap((section) =>
      (section.chapters || []).map((chapter) => ({ book, section, chapter }))
    )
  );
}

function ownsBook(userId, purchases, bookId) {
  return purchases.some(
    (purchase) =>
      purchase.userId === userId &&
      purchase.status === "Successful" &&
      (purchase.productType === "trilogy" || purchase.productType === "gift-trilogy" || purchase.bookId === bookId)
  );
}

function Toast({ message }) {
  return message ? <div className="toast">{message}</div> : null;
}

export default function Home() {
  const [ready, setReady] = useState(false);
  const [view, setView] = useState("auth");
  const [user, setUser] = useState(null);
  const [books, setBooks] = useState(defaultState.books);
  const [posts, setPosts] = useState(defaultState.posts);
  const [purchases, setPurchases] = useState([]);
  const [gifts, setGifts] = useState([]);
  const [progress, setProgress] = useState({});
  const [settings, setSettings] = useState(defaultState.settings);
  const [activeChapterId, setActiveChapterId] = useState("b1-c1");
  const [toast, setToast] = useState("");
  const [readerSettings, setReaderSettings] = useState({
    font: "Georgia",
    size: 19,
    line: 1.72,
    theme: "light",
    align: "left",
    scrollSpeed: 2
  });
  const autoScrollRef = useRef(null);

  const chapters = useMemo(() => flattenChapters(books), [books]);
  const activeChapter = chapters.find((item) => item.chapter.id === activeChapterId) || chapters[0];
  const isOnboarded = user?.onboardingStep === "done";

  useEffect(() => {
    const savedUser = localStorage.getItem(STORAGE_KEY);
    if (savedUser) setUser(JSON.parse(savedUser));
    refreshState(savedUser ? JSON.parse(savedUser).id : null).finally(() => {
      setReady(true);
      setTimeout(() => document.querySelector(".splash")?.classList.add("is-hidden"), 1100);
    });
  }, []);

  useEffect(() => {
    if (user) localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    if (user && !isOnboarded) setView("auth");
    if (user && isOnboarded && view === "auth") setView("home");
  }, [user, isOnboarded, view]);

  async function refreshState(userId = user?.id) {
    const [booksResponse, postsResponse, stateResponse] = await Promise.all([
      fetch("/api/books", { headers: userId ? { "x-user-id": userId } : {} }),
      fetch("/api/community/posts"),
      fetch("/api/state")
    ]);
    const booksData = await booksResponse.json();
    const postsData = await postsResponse.json();
    const stateData = await stateResponse.json();
    setBooks(booksData.books || defaultState.books);
    setPosts(postsData.posts || defaultState.posts);
    setPurchases(stateData.state?.purchases || []);
    setGifts(stateData.state?.gifts || []);
    setProgress(stateData.state?.progress || {});
    setSettings({ ...defaultState.settings, ...(stateData.state?.settings || {}) });
  }

  function notify(message) {
    setToast(message);
    window.clearTimeout(window.__ascendanceToast);
    window.__ascendanceToast = window.setTimeout(() => setToast(""), 2600);
  }

  async function signup(formData) {
    const response = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        email: formData.get("email"),
        fullName: formData.get("fullName")
      })
    });
    const data = await response.json();
    if (!data.ok) return notify(data.error);
    setUser(data.user);
    notify("Verification code: 123456");
  }

  async function verifyEmail(formData) {
    const response = await fetch("/api/auth/verify-email", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: user.email, code: formData.get("code") })
    });
    const data = await response.json();
    if (!data.ok) return notify(data.error);
    setUser(data.user);
  }

  async function updateProfile(formData) {
    const response = await fetch("/api/users/me", {
      method: "PATCH",
      headers: { "content-type": "application/json", "x-user-id": user.id },
      body: JSON.stringify({
        phone: formData.get("phone") || user.phone,
        username: formData.get("username") || user.username,
        country: formData.get("country") || user.country,
        fullName: formData.get("fullName") || user.fullName
      })
    });
    const data = await response.json();
    if (!data.ok) return notify(data.error);
    setUser(data.user);
    notify("Profile saved.");
  }

  async function purchase(book, productType = "book") {
    const response = await fetch("/api/purchases", {
      method: "POST",
      headers: { "content-type": "application/json", "x-user-id": user.id },
      body: JSON.stringify({
        productType,
        bookId: productType === "book" ? book?.id : null,
        amount: productType === "trilogy" ? settings.trilogyPrice : book.price,
        product: productType === "trilogy" ? "Full Trilogy" : book.title
      })
    });
    const data = await response.json();
    if (!data.ok) return notify(data.error);
    notify("Payment successful. Content unlocked.");
    await refreshState(user.id);
  }

  async function openChapter(item) {
    const response = await fetch(`/api/chapters/${item.chapter.id}`, {
      headers: user ? { "x-user-id": user.id } : {}
    });
    if (response.status === 403) {
      notify("This chapter is locked. Unlock the book or trilogy.");
      return;
    }
    setActiveChapterId(item.chapter.id);
    setView("reader");
  }

  async function saveProgress(chapterItem, percentage = 25) {
    if (!user || !chapterItem) return;
    await fetch("/api/progress", {
      method: "PUT",
      headers: { "content-type": "application/json", "x-user-id": user.id },
      body: JSON.stringify({
        bookId: chapterItem.book.id,
        sectionId: chapterItem.section.id,
        chapterId: chapterItem.chapter.id,
        scrollPosition: window.scrollY,
        percentage,
        deviceType: /Mobi|Android/i.test(navigator.userAgent) ? "mobile" : "desktop"
      })
    });
    await refreshState(user.id);
  }

  async function createPost(formData) {
    const response = await fetch("/api/community/posts", {
      method: "POST",
      headers: { "content-type": "application/json", "x-user-id": user.id },
      body: JSON.stringify({ content: formData.get("content"), bookId: "book-1" })
    });
    const data = await response.json();
    if (!data.ok) return notify(data.error);
    notify("Review posted.");
    await refreshState(user.id);
  }

  async function sendGift(formData) {
    const response = await fetch("/api/gifts", {
      method: "POST",
      headers: { "content-type": "application/json", "x-user-id": user.id },
      body: JSON.stringify({ recipientEmail: formData.get("recipientEmail") })
    });
    const data = await response.json();
    if (!data.ok) return notify(data.error);
    notify(`Gift code generated: ${data.gift.accessCode}`);
    await refreshState(user.id);
  }

  function toggleAutoScroll() {
    if (autoScrollRef.current) {
      clearInterval(autoScrollRef.current);
      autoScrollRef.current = null;
      notify("Auto-scroll paused.");
      return;
    }
    autoScrollRef.current = setInterval(() => {
      window.scrollBy({ top: readerSettings.scrollSpeed, behavior: "smooth" });
    }, 55);
    notify("Auto-scroll started.");
  }

  function speakActiveChapter() {
    if (!("speechSynthesis" in window)) return notify("Text-to-speech is not supported here.");
    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
      return;
    }
    const utterance = new SpeechSynthesisUtterance(activeChapter.chapter.content.join(" "));
    utterance.rate = 1;
    window.speechSynthesis.speak(utterance);
  }

  if (!ready) {
    return <Splash />;
  }

  return (
    <>
      <Splash />
      {!user || !isOnboarded ? (
        <AuthView user={user} onSignup={signup} onVerify={verifyEmail} onProfile={updateProfile} />
      ) : (
        <AppShell view={view} setView={setView}>
          {view === "home" && (
            <HomeView
              books={books}
              purchases={purchases}
              user={user}
              progress={progress}
              onViewBooks={() => setView("books")}
              onRead={openChapter}
              onPurchase={purchase}
            />
          )}
          {view === "books" && (
            <BooksView books={books} purchases={purchases} user={user} progress={progress} onRead={openChapter} onPurchase={purchase} />
          )}
          {view === "reader" && (
            <ReaderView
              activeChapter={activeChapter}
              chapters={chapters}
              settings={readerSettings}
              setSettings={setReaderSettings}
              onBack={() => setView("books")}
              onAutoScroll={toggleAutoScroll}
              onSpeak={speakActiveChapter}
              onSave={() => saveProgress(activeChapter, 45)}
              onRead={openChapter}
            />
          )}
          {view === "community" && <CommunityView posts={posts} onPost={createPost} />}
          {view === "notices" && <NoticesView gifts={gifts} onGift={sendGift} />}
          {view === "profile" && <ProfileView user={user} progress={progress} purchases={purchases} onProfile={updateProfile} onLogout={() => { localStorage.removeItem(STORAGE_KEY); setUser(null); setView("auth"); }} />}
          {view === "admin" && <AdminView books={books} posts={posts} purchases={purchases} gifts={gifts} />}
        </AppShell>
      )}
      <Toast message={toast} />
    </>
  );
}

function Splash() {
  return (
    <div className="splash">
      <div className="splash-mark">A</div>
      <h1>Ascendance</h1>
      <p>The Trilogy</p>
      <span>By BrandZilla Technologies</span>
    </div>
  );
}

function AuthView({ user, onSignup, onVerify, onProfile }) {
  const step = user?.onboardingStep || "signin";
  return (
    <main className="auth-page">
      <section className="auth-panel">
        <p className="eyebrow">Ascendance WebApp</p>
        <h1>{step === "verify" ? "Confirm Email" : step === "phone" ? "Add Telephone" : step === "profile" ? "Community Identity" : "Enter Ascendance"}</h1>
        <p>{step === "signin" ? "Create your account or continue reading." : "Complete this step to continue into the trilogy."}</p>
        {step === "signin" && (
          <form onSubmit={(event) => { event.preventDefault(); onSignup(new FormData(event.currentTarget)); }} className="form-grid">
            <label>Email<input name="email" type="email" placeholder="reader@example.com" required /></label>
            <label>Full name<input name="fullName" placeholder="Your name" required /></label>
            <button className="primary-btn">Continue with Email</button>
          </form>
        )}
        {step === "verify" && (
          <form onSubmit={(event) => { event.preventDefault(); onVerify(new FormData(event.currentTarget)); }} className="form-grid">
            <label>Verification code<input name="code" inputMode="numeric" placeholder="123456" required /></label>
            <button className="primary-btn">Verify</button>
          </form>
        )}
        {(step === "phone" || step === "profile") && (
          <form onSubmit={(event) => { event.preventDefault(); onProfile(new FormData(event.currentTarget)); }} className="form-grid">
            {step === "phone" && <label>Telephone<input name="phone" type="tel" placeholder="+234 800 000 0000" required /></label>}
            {step === "profile" && (
              <>
                <label>Community username<input name="username" placeholder="AdaReads" required /></label>
                <label>Country code<input name="country" defaultValue="NG" required /></label>
              </>
            )}
            <button className="primary-btn">{step === "phone" ? "Continue" : "Start Reading"}</button>
          </form>
        )}
      </section>
    </main>
  );
}

function AppShell({ children, view, setView }) {
  const tabs = [
    ["home", "Home", "⌂"],
    ["books", "Books", "▤"],
    ["community", "Community", "◌"],
    ["notices", "Notices", "◇"],
    ["profile", "Profile", "◎"]
  ];
  return (
    <div className="shell">
      <header className="topbar">
        <div className="brand-lockup">
          <strong>Ascendance</strong>
          <span>Next.js App Router</span>
        </div>
        <div className="top-actions">
          <button className="ghost-btn" onClick={() => setView("admin")}>Admin</button>
        </div>
      </header>
      <nav className="nav-tabs">
        {tabs.map(([key, label, icon]) => (
          <button key={key} className={`nav-link ${view === key ? "is-active" : ""}`} onClick={() => setView(key)}>
            <span>{icon}</span>{label}
          </button>
        ))}
      </nav>
      <main className="main">{children}</main>
    </div>
  );
}

function HomeView({ books, purchases, user, progress, onViewBooks, onRead, onPurchase }) {
  const first = books[0];
  const firstChapter = flattenChapters([first])[0];
  return (
    <>
      <section className="hero-band">
        <div className="hero-copy">
          <p className="eyebrow">Premium digital trilogy</p>
          <h1>Ascendance</h1>
          <p>{first.blurb}</p>
          <div className="inline-actions">
            <button className="primary-btn" onClick={() => onRead(firstChapter)}>Start Preview</button>
            <button className="ghost-btn" onClick={onViewBooks}>Contents</button>
          </div>
        </div>
      </section>
      <section className="content-stack">
        <div className="section-heading">
          <div>
            <h2>The Trilogy</h2>
            <p>Unlock, read, gift, and return to your saved place.</p>
          </div>
        </div>
        <div className="grid book-grid">
          {books.map((book) => (
            <BookCard key={book.id} book={book} user={user} purchases={purchases} progress={progress} onRead={onRead} onPurchase={onPurchase} />
          ))}
        </div>
      </section>
    </>
  );
}

function BookCard({ book, user, purchases, progress, onRead, onPurchase }) {
  const first = flattenChapters([book])[0];
  const owned = ownsBook(user.id, purchases, book.id);
  const preview = first?.chapter.isPreview;
  const percent = Object.values(progress).filter((item) => item?.bookId === book.id).at(-1)?.percentage || 0;
  return (
    <article className="book-card">
      <img src={book.cover} alt={`${book.title} cover`} />
      <div className="book-card-body">
        <div className="chapter-meta"><span>{book.subtitle}</span><span>{owned ? "Unlocked" : preview ? "Preview" : "Locked"}</span><span>{currency(book.price)}</span></div>
        <h3>{book.title}</h3>
        <p>{book.blurb}</p>
        <div className="progress-track"><div className="progress-fill" style={{ width: `${percent}%` }} /></div>
        <p>{percent}% complete</p>
        <div className="inline-actions">
          <button className="primary-btn" onClick={() => (owned || preview ? onRead(first) : onPurchase(book))}>{owned ? "Open" : preview ? "Start Preview" : "Unlock"}</button>
          {!owned && <button className="ghost-btn" onClick={() => onPurchase(book)}>Buy</button>}
        </div>
      </div>
    </article>
  );
}

function BooksView({ books, user, purchases, progress, onRead, onPurchase }) {
  return (
    <div className="content-stack">
      <div className="section-heading">
        <div>
          <h2>Contents</h2>
          <p>Server-side API checks protect locked chapters.</p>
        </div>
      </div>
      {books.map((book) => (
        <section className="admin-panel" key={book.id}>
          <div className="section-heading">
            <div>
              <p className="eyebrow">{book.subtitle}</p>
              <h2>{book.title}</h2>
              <p>{book.blurb}</p>
            </div>
            <img src={book.cover} alt={`${book.title} cover`} className="mini-cover" />
          </div>
          <div className="grid">
            {book.sections.map((section) => (
              <div className="form-panel" key={section.id}>
                <h2>{section.title}</h2>
                <p>{section.subtitle} · TTS {section.tts ? "On" : "Off"} · {section.voice} voice</p>
                {section.chapters.map((chapter) => {
                  const item = { book, section, chapter };
                  const locked = !chapter.isPreview && !ownsBook(user.id, purchases, book.id);
                  const percent = progress[chapter.id]?.percentage || 0;
                  return (
                    <article className="chapter-row" key={chapter.id}>
                      <div>
                        <div className="chapter-meta"><span>{chapter.isPreview ? "Preview" : locked ? "Locked" : "Unlocked"}</span><span>{percent}%</span></div>
                        <h3>{chapter.title}: {chapter.subtitle}</h3>
                        <p>{chapter.content?.[0] || "Unlock to read this chapter."}</p>
                      </div>
                      <button className={locked ? "ghost-btn" : "primary-btn"} onClick={() => (locked ? onPurchase(book) : onRead(item))}>{locked ? "Unlock" : "Read"}</button>
                    </article>
                  );
                })}
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function ReaderView({ activeChapter, chapters, settings, setSettings, onBack, onAutoScroll, onSpeak, onSave, onRead }) {
  const index = chapters.findIndex((item) => item.chapter.id === activeChapter.chapter.id);
  const prev = chapters[index - 1];
  const next = chapters[index + 1];
  return (
    <div className={`reader-shell ${settings.theme}`}>
      <header className="reader-topbar">
        <div className="reader-title">
          <button className="ghost-btn" onClick={onBack}>Back</button>
          <h1>{activeChapter.chapter.title}: {activeChapter.chapter.subtitle}</h1>
          <span>{activeChapter.book.title} · {activeChapter.section.title}</span>
        </div>
        <div className="reader-actions">
          <button className="ghost-btn" onClick={onSpeak}>TTS</button>
          <button className="ghost-btn" onClick={onSave}>Save</button>
        </div>
      </header>
      <div className="settings-drawer is-open">
        <div className="two-col">
          <label>Font size<input type="range" min="16" max="28" value={settings.size} onChange={(event) => setSettings({ ...settings, size: Number(event.target.value) })} /></label>
          <label>Theme<select value={settings.theme} onChange={(event) => setSettings({ ...settings, theme: event.target.value })}><option>light</option><option>sepia</option><option>dark</option></select></label>
          <label>Auto-scroll speed<input type="range" min="1" max="6" value={settings.scrollSpeed} onChange={(event) => setSettings({ ...settings, scrollSpeed: Number(event.target.value) })} /></label>
        </div>
      </div>
      <article className="reader-body" style={{ fontFamily: settings.font, fontSize: settings.size, lineHeight: settings.line, textAlign: settings.align }}>
        <h2>{activeChapter.chapter.subtitle}</h2>
        {activeChapter.chapter.content.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
      </article>
      <div className="reader-controls">
        {prev && <button className="ghost-btn" onClick={() => onRead(prev)}>Previous</button>}
        <button className="primary-btn" onClick={onAutoScroll}>Auto-scroll</button>
        {next && <button className="ghost-btn" onClick={() => onRead(next)}>Next</button>}
      </div>
    </div>
  );
}

function CommunityView({ posts, onPost }) {
  return (
    <div className="content-stack">
      <section className="form-panel">
        <h2>Community</h2>
        <form onSubmit={(event) => { event.preventDefault(); onPost(new FormData(event.currentTarget)); event.currentTarget.reset(); }} className="form-grid">
          <label>Your review<textarea name="content" placeholder="Write your review" required /></label>
          <button className="primary-btn">Post Review</button>
        </form>
      </section>
      {posts.map((post) => (
        <article className="post-card" key={post.id}>
          <div className="chapter-meta"><span>{post.pinned ? "Pinned" : "Review"}</span><span>{post.country}</span></div>
          <h3>{post.username}</h3>
          <p>{post.content}</p>
          <div className="inline-actions"><button className="ghost-btn">Like {post.likes}</button><button className="ghost-btn">Share</button></div>
        </article>
      ))}
    </div>
  );
}

function NoticesView({ gifts, onGift }) {
  return (
    <div className="content-stack">
      <section className="form-panel">
        <h2>Send Gift</h2>
        <form onSubmit={(event) => { event.preventDefault(); onGift(new FormData(event.currentTarget)); event.currentTarget.reset(); }} className="form-grid">
          <label>Recipient email<input name="recipientEmail" type="email" placeholder="friend@example.com" required /></label>
          <button className="primary-btn">Generate Gift Code</button>
        </form>
      </section>
      {gifts.length ? gifts.map((gift) => <article className="notice-card" key={gift.id}><h3>{gift.recipientEmail}</h3><p>{gift.status} · {gift.accessCode}</p></article>) : <div className="empty-state">No gift activity yet.</div>}
    </div>
  );
}

function ProfileView({ user, progress, purchases, onProfile, onLogout }) {
  return (
    <div className="content-stack">
      <section className="profile-summary">
        <div className="section-heading">
          <div>
            <p className="eyebrow">{user.country}</p>
            <h2>{user.username || user.fullName}</h2>
            <p>{user.email} · {user.phone}</p>
          </div>
          <button className="danger-btn" onClick={onLogout}>Logout</button>
        </div>
      </section>
      <section className="form-panel">
        <h2>Profile</h2>
        <form onSubmit={(event) => { event.preventDefault(); onProfile(new FormData(event.currentTarget)); }} className="two-col">
          <label>Full name<input name="fullName" defaultValue={user.fullName} /></label>
          <label>Username<input name="username" defaultValue={user.username} /></label>
          <label>Telephone<input name="phone" defaultValue={user.phone} /></label>
          <label>Country<input name="country" defaultValue={user.country} /></label>
          <button className="primary-btn">Save Profile</button>
        </form>
      </section>
      <div className="grid dashboard-grid">
        <article className="stat-card"><strong>{purchases.length}</strong><span>Purchases</span></article>
        <article className="stat-card"><strong>{Object.keys(progress).length}</strong><span>Saved chapters</span></article>
      </div>
    </div>
  );
}

function AdminView({ books, posts, purchases, gifts }) {
  const revenue = purchases.reduce((sum, purchase) => sum + Number(purchase.amount || 0), 0);
  return (
    <div className="content-stack">
      <div className="admin-heading">
        <p className="eyebrow">Admin backend</p>
        <h1>Dashboard</h1>
      </div>
      <div className="grid dashboard-grid">
        <article className="stat-card"><strong>{books.length}</strong><span>Books</span></article>
        <article className="stat-card"><strong>{purchases.length}</strong><span>Purchases</span></article>
        <article className="stat-card"><strong>{currency(revenue)}</strong><span>Revenue</span></article>
        <article className="stat-card"><strong>{gifts.length}</strong><span>Gifts</span></article>
        <article className="stat-card"><strong>{posts.length}</strong><span>Posts</span></article>
      </div>
      <section className="admin-panel">
        <h2>Manage Books</h2>
        {books.map((book) => <p key={book.id}>{book.subtitle}: {book.title} · {currency(book.price)} · {book.status}</p>)}
      </section>
    </div>
  );
}
