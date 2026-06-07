"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { USD_PRICES, usdBookPrice, usdToNgn } from "@/lib/pricing";
import { defaultState } from "@/lib/seed";

const LAST_VIEW_KEY = "ascendance_last_view";
const LAST_CHAPTER_KEY = "ascendance_last_chapter";
const BRAND_ASSETS = {
  lockup: "/assets/brand/ascendance-lockup.png",
  wordmark: "/assets/brand/ascendance-wordmark.png",
  symbol: "/assets/brand/ascendance-symbol.png",
  appIcon: "/assets/brand/ascendance-app-icon.png",
  brandzilla: "/assets/brand/brandzilla-technologies.png",
  brandzillaIcon: "/assets/brand/brandzilla-icon.png"
};

const NAV_TABS = [
  ["community", "Community", "wallet"],
  ["books", "Store", "store"],
  ["home", "Home", "home"],
  ["notices", "Help", "help"],
  ["profile", "Profile", "profile"]
];

function ngnCurrency(amount) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0
  }).format(amount || 0);
}

function usdCurrency(amount) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(Number(amount || 0));
}

function ReaderPrice({ usdAmount, ngnAmount = usdToNgn(usdAmount) }) {
  return (
    <span className="reader-price" title={`Paystack checkout charge: ${ngnCurrency(ngnAmount)}`}>
      <strong>{usdCurrency(usdAmount)}</strong>
      <small>charged {ngnCurrency(ngnAmount)}</small>
    </span>
  );
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

function NavIcon({ type }) {
  const icons = {
    wallet: (
      <>
        <path d="M4 7.5h16a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-10a2 2 0 0 1 2-2Z" />
        <path d="M16.5 12.5H22v4h-5.5a2 2 0 0 1 0-4Z" />
        <path d="M7 7.5 15.5 4 18 7.5" />
      </>
    ),
    store: (
      <>
        <path d="M4 10h16l-1.2-5.2A2 2 0 0 0 16.9 3H7.1a2 2 0 0 0-1.9 1.8L4 10Z" />
        <path d="M5 10v9a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-9" />
        <path d="M9 21v-7h6v7" />
      </>
    ),
    home: (
      <>
        <path d="m3 11 9-8 9 8" />
        <path d="M5 10.5V21h14V10.5" />
        <path d="M10 21v-6h4v6" />
      </>
    ),
    help: (
      <>
        <path d="M4 5h10a4 4 0 0 1 4 4v9H8a4 4 0 0 1-4-4V5Z" />
        <path d="M9 9h5" />
        <path d="M9 13h7" />
        <path d="M18 11h2a2 2 0 0 1 2 2v6h-5" />
      </>
    ),
    profile: (
      <>
        <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" />
        <path d="M4 21a8 8 0 0 1 16 0" />
      </>
    )
  };
  return (
    <svg className="nav-glyph" viewBox="0 0 24 24" aria-hidden="true">
      {icons[type]}
    </svg>
  );
}

function HeartIcon() {
  return (
    <svg className="heart-icon" viewBox="0 0 48 44" aria-hidden="true">
      <path d="M24 41S4 29.4 4 15.1C4 7.5 9.8 3 16.1 3c3.7 0 6.4 1.6 7.9 4.1C25.5 4.6 28.2 3 31.9 3 38.2 3 44 7.5 44 15.1 44 29.4 24 41 24 41Z" />
    </svg>
  );
}

export default function Home() {
  const [ready, setReady] = useState(false);
  const [splashDone, setSplashDone] = useState(false);
  const [showTrailer, setShowTrailer] = useState(false);
  const [view, setView] = useState("auth");
  const [user, setUser] = useState(null);
  const [admin, setAdmin] = useState(null);
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
    let active = true;
    async function bootstrap() {
      localStorage.removeItem("ascendance_next_user");
      localStorage.removeItem("ascendance_next_admin");
      const savedView = localStorage.getItem(LAST_VIEW_KEY) || "home";
      const savedChapter = localStorage.getItem(LAST_CHAPTER_KEY);
      if (savedChapter) setActiveChapterId(savedChapter);

      try {
        const response = await fetch("/api/auth/session", { credentials: "same-origin" });
        const data = await response.json();
        if (!active) return;
        setUser(data.user || null);
        setAdmin(data.admin || null);
        await refreshState();
        if (!active) return;
        setReady(true);
        setTimeout(() => {
          if (!active) return;
          setSplashDone(true);
          if (data.user?.onboardingStep === "done") setView(savedView);
          else setShowTrailer(true);
        }, 1300);
      } catch {
        if (!active) return;
        setReady(true);
        setSplashDone(true);
        setShowTrailer(true);
      }
    }
    bootstrap();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (user && !isOnboarded) {
      setShowTrailer(false);
      setView("auth");
    }
    if (user && isOnboarded && view === "auth" && splashDone && !showTrailer) {
      setView(localStorage.getItem(LAST_VIEW_KEY) || "home");
    }
  }, [user, isOnboarded, view, splashDone, showTrailer]);

  useEffect(() => {
    if (user && isOnboarded && splashDone && view !== "auth") {
      localStorage.setItem(LAST_VIEW_KEY, view);
    }
  }, [user, isOnboarded, splashDone, view]);

  useEffect(() => {
    if (splashDone) window.scrollTo({ top: 0, behavior: "instant" });
  }, [view, splashDone]);

  useEffect(() => {
    if (activeChapterId) localStorage.setItem(LAST_CHAPTER_KEY, activeChapterId);
  }, [activeChapterId]);

  useEffect(() => {
    if (!ready || !user?.id || !isOnboarded) return;
    const params = new URLSearchParams(window.location.search);
    const reference = params.get("paystack_reference") || params.get("reference") || params.get("trxref");
    if (!reference) return;
    verifyPaystackPayment(reference);
    params.delete("paystack_reference");
    params.delete("reference");
    params.delete("trxref");
    const query = params.toString();
    window.history.replaceState({}, "", `${window.location.pathname}${query ? `?${query}` : ""}${window.location.hash}`);
  }, [ready, user?.id, isOnboarded]);

  async function refreshState() {
    const [booksResponse, postsResponse, stateResponse] = await Promise.all([
      fetch("/api/books"),
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
        fullName: formData.get("fullName"),
        password: formData.get("password")
      })
    });
    const data = await response.json();
    if (!data.ok) return notify(data.error);
    setShowTrailer(false);
    setUser(data.user);
    if (data.resent) notify(data.delivery?.provider === "console" ? "Account found. New code logged on the server." : "Account found. New verification code sent.");
    else notify(data.delivery?.provider === "console" ? "Verification code logged on the server." : "Verification code sent to your email.");
  }

  async function login(formData) {
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        email: formData.get("email"),
        password: formData.get("password")
      })
    });
    const data = await response.json();
    if (!data.ok) return notify(data.error);
    setShowTrailer(false);
    setUser(data.user);
    notify("Welcome back.");
    await refreshState();
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

  async function resendVerificationCode() {
    if (!user?.email) return;
    const response = await fetch("/api/auth/resend-code", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: user.email })
    });
    const data = await response.json();
    if (!data.ok) return notify(data.error);
    notify(data.delivery?.provider === "console" ? "New verification code logged on the server." : "New verification code sent.");
  }

  async function updateProfile(formData) {
    const response = await fetch("/api/users/me", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
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
    const response = await fetch("/api/payments/paystack/initialize", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        productType,
        bookId: productType === "book" ? book?.id : null
      })
    });
    const data = await response.json();
    if (!data.ok) return notify(data.error);
    notify("Opening Paystack checkout.");
    window.location.href = data.authorizationUrl;
  }

  async function verifyPaystackPayment(reference) {
    notify("Verifying payment...");
    const response = await fetch("/api/payments/paystack/verify", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ reference })
    });
    const data = await response.json();
    if (!data.ok) return notify(data.error);
    notify(data.gift ? `Gift sent. Access code: ${data.gift.accessCode}` : "Payment verified. Content unlocked.");
    await refreshState();
  }

  async function openChapter(item) {
    const response = await fetch(`/api/chapters/${item.chapter.id}`);
    if (response.status === 403) {
      notify("This chapter is locked. Unlock the book or trilogy.");
      return;
    }
    setActiveChapterId(item.chapter.id);
    localStorage.setItem(LAST_VIEW_KEY, "reader");
    localStorage.setItem(LAST_CHAPTER_KEY, item.chapter.id);
    setView("reader");
  }

  async function saveProgress(chapterItem, percentage = 25) {
    if (!user || !chapterItem) return;
    await fetch("/api/progress", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        bookId: chapterItem.book.id,
        sectionId: chapterItem.section.id,
        chapterId: chapterItem.chapter.id,
        scrollPosition: window.scrollY,
        percentage,
        deviceType: /Mobi|Android/i.test(navigator.userAgent) ? "mobile" : "desktop"
      })
    });
    await refreshState();
  }

  async function createPost(formData) {
    const response = await fetch("/api/community/posts", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ content: formData.get("content"), bookId: "book-1" })
    });
    const data = await response.json();
    if (!data.ok) return notify(data.error);
    notify("Review posted.");
    await refreshState();
  }

  async function communityAction(payload) {
    const response = await fetch("/api/community/posts", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload)
    });
    const data = await response.json();
    if (!data.ok) return notify(data.error);
    await refreshState();
    return data;
  }

  async function likePost(postId) {
    await communityAction({ action: "like", postId });
  }

  async function commentOnPost(postId, comment, parentId = null) {
    if (!comment.trim()) return;
    await communityAction({ action: "comment", postId, comment, parentId });
    notify("Comment posted.");
  }

  async function reportPost(postId) {
    await communityAction({ action: "report", postId, reason: "Reader report" });
    notify("Post reported for moderation.");
  }

  async function moderatePost(postId, status) {
    await communityAction({ action: "moderate", postId, status });
    notify(`Post marked ${status}.`);
  }

  async function adminReply(postId, comment) {
    if (!comment.trim()) return;
    await communityAction({ action: "admin-reply", postId, comment });
    notify("Admin reply posted.");
  }

  async function sharePost(post, platform = "native") {
    const text = `"${post.content}" - ${post.username} on Ascendance`;
    const url = window.location.origin;
    if (platform === "native" && navigator.share) {
      await navigator.share({ title: "Ascendance review", text, url });
      return;
    }
    const encodedText = encodeURIComponent(`${text} ${url}`);
    const encodedUrl = encodeURIComponent(url);
    const targets = {
      whatsapp: `https://wa.me/?text=${encodedText}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      x: `https://twitter.com/intent/tweet?text=${encodedText}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`
    };
    window.open(targets[platform] || targets.x, "_blank", "noopener,noreferrer");
  }

  async function sendGift(formData) {
    const response = await fetch("/api/payments/paystack/initialize", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        productType: "gift-trilogy",
        recipientEmail: formData.get("recipientEmail")
      })
    });
    const data = await response.json();
    if (!data.ok) return notify(data.error);
    notify("Opening Paystack checkout.");
    window.location.href = data.authorizationUrl;
  }

  async function adminLogin(formData) {
    const response = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        email: formData.get("email"),
        password: formData.get("password")
      })
    });
    const data = await response.json();
    if (!data.ok) return notify(data.error);
    setAdmin(data.admin);
    notify("Admin login successful.");
    await refreshState();
  }

  async function adminLogout() {
    await fetch("/api/admin/logout", { method: "POST" });
    setAdmin(null);
    await refreshState();
    notify("Admin logged out.");
  }

  async function readerLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    setView("auth");
    await refreshState();
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
      <Splash hidden={splashDone} />
      {showTrailer && (!user || !isOnboarded) ? (
        <TrailerIntro onEnter={() => { setShowTrailer(false); setView("auth"); }} />
      ) : !user || !isOnboarded ? (
        <AuthView user={user} onSignup={signup} onLogin={login} onVerify={verifyEmail} onResendCode={resendVerificationCode} onProfile={updateProfile} />
      ) : (
        <AppShell view={view} setView={setView}>
          {view === "home" && (
            <HomeView
              books={books}
              purchases={purchases}
              user={user}
              posts={posts}
              progress={progress}
              onViewBooks={() => setView("books")}
              onViewCommunity={() => setView("community")}
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
          {view === "community" && (
            <CommunityView
              posts={posts}
              user={user}
              onPost={createPost}
              onLike={likePost}
              onComment={commentOnPost}
              onReport={reportPost}
              onShare={sharePost}
            />
          )}
          {view === "notices" && <NoticesView gifts={gifts} onGift={sendGift} />}
          {view === "profile" && <ProfileView user={user} progress={progress} purchases={purchases} onProfile={updateProfile} onLogout={readerLogout} />}
          {view === "admin" && (
            <AdminGate
              admin={admin}
              books={books}
              posts={posts}
              purchases={purchases}
              gifts={gifts}
              onLogin={adminLogin}
              onLogout={adminLogout}
              onModeratePost={moderatePost}
              onAdminReply={adminReply}
            />
          )}
        </AppShell>
      )}
      <Toast message={toast} />
    </>
  );
}

function Splash({ hidden = false }) {
  return (
    <div className={`splash ${hidden ? "is-hidden" : ""}`}>
      <div className="splash-inner">
        <img className="splash-logo" src={BRAND_ASSETS.lockup} alt="Ascendance The Trilogy" />
        <div className="splash-presenter">
          <span className="presented-by">Presented by</span>
          <img src={BRAND_ASSETS.brandzilla} alt="BrandZilla Technologies" />
        </div>
      </div>
    </div>
  );
}

function TrailerIntro({ onEnter }) {
  const [videoReady, setVideoReady] = useState(false);

  return (
    <main className="trailer-page">
      <section className="trailer-stage" aria-label="Autoplaying Ascendance trailer">
        <video
          className={`trailer-video ${videoReady ? "is-ready" : ""}`}
          autoPlay
          muted
          loop
          playsInline
          poster="/assets/cover-book-1.svg"
          onCanPlay={() => setVideoReady(true)}
          onError={() => setVideoReady(false)}
        >
          <source src="/assets/ascendance-trailer.webm" type="video/webm" />
          <source src="/assets/ascendance-trailer.mp4" type="video/mp4" />
        </video>
        <div className="trailer-copy">
          <h1>Play Trailer Video</h1>
          <p>Ascendance</p>
          <button className="trailer-login-btn" onClick={onEnter}>Login</button>
        </div>
      </section>
    </main>
  );
}

function AuthView({ user, onSignup, onLogin, onVerify, onResendCode, onProfile }) {
  const step = user?.onboardingStep || "signin";
  const [mode, setMode] = useState("login");

  return (
    <main className="auth-page">
      <section className="auth-panel">
        <img className="auth-logo" src={BRAND_ASSETS.wordmark} alt="Ascendance The Trilogy" />
        <div className="auth-heading">
          <h1>{step === "verify" ? "Confirm Email" : step === "phone" ? "Add Telephone" : step === "profile" ? "Reader Profile" : mode === "login" ? "Login" : "Create Profile"}</h1>
        </div>
        {step === "signin" && (
          <>
            {mode === "signup" ? (
              <form onSubmit={(event) => { event.preventDefault(); onSignup(new FormData(event.currentTarget)); }} className="form-grid">
                <label>Email<input name="email" type="email" placeholder="reader@example.com" autoComplete="email" required /></label>
                <label>Full name<input name="fullName" placeholder="Your name" autoComplete="name" required /></label>
                <label>Password<input name="password" type="password" placeholder="Minimum 8 characters" autoComplete="new-password" minLength={8} required /></label>
                <button className="auth-alt-link" type="button" onClick={() => setMode("login")}>Already have an account? Login</button>
                <button className="primary-btn auth-submit">Submit</button>
              </form>
            ) : (
              <form onSubmit={(event) => { event.preventDefault(); onLogin(new FormData(event.currentTarget)); }} className="form-grid">
                <label>Email<input name="email" type="email" placeholder="reader@example.com" autoComplete="email" required /></label>
                <label>Password<input name="password" type="password" placeholder="Your password" autoComplete="current-password" required /></label>
                <button className="auth-alt-link" type="button" onClick={() => setMode("signup")}>Create a Reader Profile</button>
                <button className="primary-btn auth-submit">Submit</button>
              </form>
            )}
          </>
        )}
        {step === "verify" && (
          <form onSubmit={(event) => { event.preventDefault(); onVerify(new FormData(event.currentTarget)); }} className="form-grid">
            <label>Verification code<input name="code" inputMode="numeric" placeholder="6-digit code" maxLength={6} required /></label>
            <button className="primary-btn auth-submit">Submit</button>
            <button type="button" className="ghost-btn" onClick={onResendCode}>Resend Code</button>
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
            <button className="primary-btn auth-submit">Submit</button>
          </form>
        )}
      </section>
    </main>
  );
}

function AppShell({ children, view, setView }) {
  return (
    <div className="shell">
      <header className="topbar">
        <div className="brand-lockup">
          <img src={BRAND_ASSETS.wordmark} alt="Ascendance The Trilogy" />
        </div>
        <div className="top-actions">
          <button className="ghost-btn" onClick={() => setView("admin")}>Admin</button>
        </div>
      </header>
      <nav className="nav-tabs">
        {NAV_TABS.map(([key, label, icon]) => (
          <button key={key} className={`nav-link ${view === key ? "is-active" : ""}`} onClick={() => setView(key)}>
            <NavIcon type={icon} />{label}
          </button>
        ))}
      </nav>
      <main className="main">{children}</main>
    </div>
  );
}

function getCommunityLeaders(posts) {
  const fallbackLeaders = [
    { name: "Stanley Ohanugo", points: 380, country: "NG" },
    { name: "AdaReads", points: 350, country: "NG" },
    { name: "Miriam A.", points: 280, country: "GH" },
    { name: "Tolu Grace", points: 250, country: "UK" }
  ];
  const communityLeaders = posts.reduce((leaderMap, post) => {
    const name = post.username || "Ascendance Reader";
    const key = name.toLocaleLowerCase();
    const current = leaderMap.get(key) || {
      name,
      points: 175,
      country: post.country,
      avatar: post.avatar
    };

    current.points += 25 + (post.likes || 0) * 10 + (post.comments?.length || 0) * 20;
    current.country ||= post.country;
    current.avatar ||= post.avatar;
    leaderMap.set(key, current);
    return leaderMap;
  }, new Map());

  fallbackLeaders.forEach((leader) => {
    const key = leader.name.toLocaleLowerCase();
    if (!communityLeaders.has(key)) communityLeaders.set(key, leader);
  });

  return [...communityLeaders.values()].sort((a, b) => b.points - a.points);
}

function LeaderList({ leaders }) {
  return (
    <div className="leader-list">
      {leaders.map((leader, index) => (
        <article className={`leader-card rank-${index + 1}`} key={`${leader.name}-${leader.points}`}>
          <span className="leader-rank" aria-label={`Rank ${index + 1}`}>{index + 1}</span>
          <div className="leader-avatar" aria-hidden="true">
            {leader.avatar || leader.name.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase()}
          </div>
          <div className="leader-identity">
            <strong>{leader.name}</strong>
            <span>{leader.country || "Reader"}</span>
          </div>
          <div className="leader-score">
            <strong>{leader.points}</strong>
            <span>points</span>
          </div>
        </article>
      ))}
    </div>
  );
}

function HomeView({ books, purchases, user, posts, progress, onViewBooks, onViewCommunity, onRead, onPurchase }) {
  const first = books[0];
  const firstChapter = flattenChapters([first])[0];
  const firstProgress = Object.values(progress).filter((item) => item?.bookId === first.id).at(-1);
  const continueChapter = flattenChapters([first]).find((item) => item.chapter.id === firstProgress?.chapterId) || firstChapter;
  const leaders = getCommunityLeaders(posts).slice(0, 4);

  return (
    <div className="home-screen">
      <section className="leader-section" aria-label="Community leaders">
        <div className="leader-title">
          <HeartIcon />
          <div className="leader-title-copy">
            <h1>Community Leaders</h1>
            <p>Readers making the biggest contribution this week</p>
          </div>
          <span className="info-dot" title="Points reward reviews, likes, and helpful comments" aria-label="How community points work">i</span>
        </div>
        <LeaderList leaders={leaders} />
        <button className="leaders-link" onClick={onViewCommunity}>View full leaderboard</button>
      </section>

      <section className="featured-book">
        <img className="featured-cover" src={first.cover} alt={`${first.title} cover`} />
        <div className="featured-actions">
          <button className="ghost-btn summary-btn" onClick={onViewBooks}>Book Summary</button>
          <button className="primary-btn continue-btn" onClick={() => onRead(continueChapter)}>Continue Reading</button>
        </div>
      </section>

      <section className="reader-home-list">
        {books.map((book) => (
          <BookCard key={book.id} book={book} user={user} purchases={purchases} progress={progress} onRead={onRead} onPurchase={onPurchase} />
        ))}
      </section>
    </div>
  );
}

function BookCard({ book, user, purchases, progress, onRead, onPurchase }) {
  const first = flattenChapters([book])[0];
  const owned = ownsBook(user.id, purchases, book.id);
  const preview = first?.chapter.isPreview;
  const bookProgress = Object.values(progress).filter((item) => item?.bookId === book.id).at(-1);
  const continueChapter = flattenChapters([book]).find((item) => item.chapter.id === bookProgress?.chapterId) || first;
  const percent = bookProgress?.percentage || 0;
  const primaryLabel = owned && percent > 0 ? "Continue Reading" : owned ? "Read" : preview ? "Read Preview" : "Unlock Book";
  return (
    <article className="book-card reader-home-card">
      <img src={book.cover} alt={`${book.title} cover`} />
      <div className="book-card-body">
        <div className="chapter-meta">
          <span>{book.subtitle}</span>
          <span>{owned ? "Unlocked" : preview ? "Preview" : "Locked"}</span>
          <ReaderPrice usdAmount={usdBookPrice(book)} />
        </div>
        <h3>{book.title}</h3>
        <p>{book.blurb}</p>
        <div className="progress-track"><div className="progress-fill" style={{ width: `${percent}%` }} /></div>
        <p>{percent}% complete</p>
        <div className="inline-actions">
          <button className="primary-btn" onClick={() => (owned || preview ? onRead(continueChapter) : onPurchase(book))}>{primaryLabel}</button>
          {!owned && <button className="ghost-btn" onClick={() => onPurchase(book)}>Buy Book</button>}
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
      <section className="bundle-offer">
        <div>
          <p className="eyebrow">Best value</p>
          <h2>Unlock all three books</h2>
          <p>One discounted payment unlocks the complete Ascendance trilogy.</p>
        </div>
        <ReaderPrice usdAmount={USD_PRICES.trilogy} />
        <button className="primary-btn" onClick={() => onPurchase(null, "trilogy")}>Unlock Trilogy</button>
      </section>
      {books.map((book) => (
        <section className="admin-panel" key={book.id}>
          <div className="section-heading">
            <div>
              <p className="eyebrow">{book.subtitle}</p>
              <h2>{book.title}</h2>
              <p>{book.blurb}</p>
            </div>
            <div className="store-book-aside">
              <ReaderPrice usdAmount={usdBookPrice(book)} />
              <img src={book.cover} alt={`${book.title} cover`} className="mini-cover" />
            </div>
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

function CommunityView({ posts, user, onPost, onLike, onComment, onReport, onShare }) {
  const [sort, setSort] = useState("recent");
  const [replyTo, setReplyTo] = useState(null);
  const leaders = getCommunityLeaders(posts);
  const sortedPosts = [...posts].sort((a, b) => {
    if (sort === "popular") return (b.comments?.length || 0) + (b.likes || 0) - ((a.comments?.length || 0) + (a.likes || 0));
    if (sort === "liked") return (b.likes || 0) - (a.likes || 0);
    return new Date(b.createdAt) - new Date(a.createdAt);
  });

  return (
    <div className="content-stack">
      <section className="community-leaderboard" aria-labelledby="full-leaderboard-title">
        <div className="section-heading">
          <div>
            <h2 id="full-leaderboard-title">Reader Leaderboard</h2>
            <p>Ranked by reviews, likes, and helpful discussion.</p>
          </div>
        </div>
        <LeaderList leaders={leaders} />
      </section>
      <section className="form-panel">
        <div className="section-heading">
          <div>
            <h2>Community</h2>
            <p>Reader reviews, replies, sharing, and moderation signals.</p>
          </div>
        </div>
        <form onSubmit={(event) => { event.preventDefault(); onPost(new FormData(event.currentTarget)); event.currentTarget.reset(); }} className="form-grid">
          <label>Your review<textarea name="content" placeholder="Write your review" required /></label>
          <button className="primary-btn">Post Review</button>
        </form>
      </section>
      <div className="segmented">
        {[
          ["recent", "Recent"],
          ["popular", "Popular"],
          ["liked", "Most liked"]
        ].map(([key, label]) => (
          <button key={key} className={`pill-btn ${sort === key ? "is-active" : ""}`} onClick={() => setSort(key)}>{label}</button>
        ))}
      </div>
      {sortedPosts.map((post) => {
        const liked = post.likedBy?.includes(user.id);
        const comments = post.comments || [];
        const rootComments = comments.filter((comment) => !comment.parentId);
        return (
          <article className={`post-card community-post ${post.reported ? "is-reported" : ""}`} key={post.id}>
            <div className="post-author">
              <div className="avatar">{post.avatar || post.username?.slice(0, 1) || "A"}</div>
              <div>
                <div className="chapter-meta">
                  <span>{post.pinned ? "Pinned review" : "Reader review"}</span>
                  <span>{post.country}</span>
                  <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                  {post.reported && <span>Reported</span>}
                </div>
                <h3>{post.username}</h3>
              </div>
            </div>
            <p>{post.content}</p>
            <div className="inline-actions action-wrap">
              <button className="ghost-btn" onClick={() => onLike(post.id)}>{liked ? "Unlike" : "Like"} {post.likes || 0}</button>
              <button className="ghost-btn" onClick={() => setReplyTo(replyTo === post.id ? null : post.id)}>Comment {comments.length}</button>
              <button className="ghost-btn" onClick={() => onShare(post, "native")}>Share</button>
              <button className="ghost-btn" onClick={() => onReport(post.id)}>Report</button>
            </div>
            <div className="share-row">
              {["whatsapp", "facebook", "x", "linkedin"].map((platform) => (
                <button key={platform} className="pill-btn" onClick={() => onShare(post, platform)}>{platform}</button>
              ))}
            </div>
            {replyTo === post.id && <CommentForm label="Add comment" onSubmit={(text) => { onComment(post.id, text); setReplyTo(null); }} />}
            {rootComments.length > 0 && (
              <div className="comment-list">
                {rootComments.map((comment) => (
                  <CommunityComment
                    key={comment.id || comment.text}
                    comment={comment}
                    replies={comments.filter((reply) => reply.parentId === comment.id)}
                    onReply={(text) => onComment(post.id, text, comment.id)}
                  />
                ))}
              </div>
            )}
          </article>
        );
      })}
    </div>
  );
}

function CommentForm({ label, onSubmit }) {
  return (
    <form onSubmit={(event) => {
      event.preventDefault();
      onSubmit(new FormData(event.currentTarget).get("comment") || "");
      event.currentTarget.reset();
    }} className="comment-form">
      <input name="comment" placeholder={label} required />
      <button className="primary-btn">Send</button>
    </form>
  );
}

function CommunityComment({ comment, replies, onReply }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`comment-item ${comment.isAdmin ? "is-admin" : ""}`}>
      <div className="post-author">
        <div className="avatar">{comment.avatar || comment.user?.slice(0, 1) || "A"}</div>
        <div>
          <div className="chapter-meta"><span>{comment.isAdmin ? "Admin reply" : "Reader comment"}</span><span>{comment.country}</span></div>
          <strong>{comment.user}</strong>
        </div>
      </div>
      <p>{comment.text}</p>
      <button className="ghost-btn" onClick={() => setOpen(!open)}>Reply</button>
      {open && <CommentForm label="Write a reply" onSubmit={(text) => { onReply(text); setOpen(false); }} />}
      {replies.map((reply) => (
        <div className={`comment-item nested ${reply.isAdmin ? "is-admin" : ""}`} key={reply.id || reply.text}>
          <div className="chapter-meta"><span>{reply.isAdmin ? "Admin reply" : "Reply"}</span><span>{reply.country}</span></div>
          <strong>{reply.user}</strong>
          <p>{reply.text}</p>
        </div>
      ))}
    </div>
  );
}

function NoticesView({ gifts, onGift }) {
  return (
    <div className="content-stack">
      <section className="form-panel">
        <h2>Send Gift</h2>
        <div className="gift-price">
          <span>Ascendance Trilogy gift</span>
          <ReaderPrice usdAmount={USD_PRICES.giftTrilogy} />
        </div>
        <form onSubmit={(event) => { event.preventDefault(); onGift(new FormData(event.currentTarget)); event.currentTarget.reset(); }} className="form-grid">
          <label>Recipient email<input name="recipientEmail" type="email" placeholder="friend@example.com" required /></label>
          <button className="primary-btn">Pay &amp; Send Gift</button>
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

function AdminGate({ admin, books, posts, purchases, gifts, onLogin, onLogout, onModeratePost, onAdminReply }) {
  if (!admin) {
    return (
      <div className="content-stack">
        <section className="admin-login-panel">
          <p className="eyebrow">Admin backend</p>
          <h1>Admin Login</h1>
          <form onSubmit={(event) => { event.preventDefault(); onLogin(new FormData(event.currentTarget)); }} className="form-grid">
            <label>Email<input name="email" type="email" placeholder="admin@example.com" autoComplete="email" required /></label>
            <label>Password<input name="password" type="password" placeholder="Admin password" autoComplete="current-password" required /></label>
            <button className="primary-btn">Open Dashboard</button>
          </form>
        </section>
      </div>
    );
  }

  return (
    <AdminView
      admin={admin}
      books={books}
      posts={posts}
      purchases={purchases}
      gifts={gifts}
      onLogout={onLogout}
      onModeratePost={onModeratePost}
      onAdminReply={onAdminReply}
    />
  );
}

function AdminView({ admin, books, posts, purchases, gifts, onLogout, onModeratePost, onAdminReply }) {
  const revenue = purchases.reduce((sum, purchase) => sum + Number(purchase.amount || 0), 0);
  return (
    <div className="content-stack">
      <div className="admin-heading">
        <p className="eyebrow">Admin backend</p>
        <h1>Dashboard</h1>
        <div className="admin-session">
          <span>{admin.name} · {admin.role}</span>
          <button className="ghost-btn" onClick={onLogout}>Admin Logout</button>
        </div>
      </div>
      <div className="grid dashboard-grid">
        <article className="stat-card"><strong>{books.length}</strong><span>Books</span></article>
        <article className="stat-card"><strong>{purchases.length}</strong><span>Purchases</span></article>
        <article className="stat-card"><strong>{ngnCurrency(revenue)}</strong><span>Revenue</span></article>
        <article className="stat-card"><strong>{gifts.length}</strong><span>Gifts</span></article>
        <article className="stat-card"><strong>{posts.length}</strong><span>Posts</span></article>
      </div>
      <section className="admin-panel">
        <h2>Manage Books</h2>
        {books.map((book) => <p key={book.id}>{book.subtitle}: {book.title} · {ngnCurrency(book.price)} · {book.status}</p>)}
      </section>
      <section className="admin-panel">
        <div className="section-heading">
          <div>
            <h2>Community Management</h2>
            <p>Moderate reader reviews, answer publicly, and watch reported posts.</p>
          </div>
        </div>
        <div className="content-stack">
          {posts.map((post) => (
            <article className={`moderation-card ${post.reported ? "is-reported" : ""}`} key={post.id}>
              <div>
                <div className="chapter-meta">
                  <span>{post.status}</span>
                  <span>{post.country}</span>
                  <span>{post.likes || 0} likes</span>
                  <span>{post.comments?.length || 0} comments</span>
                  {post.reported && <span>{post.reports?.length || 1} report</span>}
                </div>
                <h3>{post.username}</h3>
                <p>{post.content}</p>
              </div>
              <form onSubmit={(event) => {
                event.preventDefault();
                onAdminReply(post.id, new FormData(event.currentTarget).get("comment") || "");
                event.currentTarget.reset();
              }} className="comment-form">
                <input name="comment" placeholder="Reply as admin" />
                <button className="primary-btn">Reply</button>
              </form>
              <div className="inline-actions action-wrap">
                <button className="ghost-btn" onClick={() => onModeratePost(post.id, "Visible")}>Approve</button>
                <button className="ghost-btn" onClick={() => onModeratePost(post.id, "Hidden")}>Hide</button>
                <button className="danger-btn" onClick={() => onModeratePost(post.id, "Deleted")}>Delete</button>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
