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

const BOOK_SECTION_LABELS = {
  "book-1": "Books One, Two & Three: The Formation, The Fall, The Fraternity",
  "book-2": "Books Four & Five: The Fulcrum, The Firstfruit",
  "book-3": "Book Six: The Fulfillment"
};

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

function splitPostContent(content = "") {
  const [first, ...rest] = content.split("\n");
  if (rest.length && first.length <= 30) return { title: first, body: rest.join("\n") };
  return { title: "Reader reflection", body: content };
}

function bookPurchaseState(book, userId, purchases) {
  const owned = ownsBook(userId, purchases, book.id);
  const previousId = book.order > 1 ? `book-${book.order - 1}` : null;
  const requiresPrevious = previousId && !ownsBook(userId, purchases, previousId);
  return { owned, requiresPrevious };
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
  const [adminTwoFactorPending, setAdminTwoFactorPending] = useState(false);
  const [books, setBooks] = useState(defaultState.books);
  const [posts, setPosts] = useState(defaultState.posts);
  const [purchases, setPurchases] = useState([]);
  const [gifts, setGifts] = useState([]);
  const [progress, setProgress] = useState({});
  const [settings, setSettings] = useState(defaultState.settings);
  const [activeChapterId, setActiveChapterId] = useState("b1-c1");
  const [toast, setToast] = useState("");
  const [adminRoute, setAdminRoute] = useState(false);
  const [installPrompt, setInstallPrompt] = useState(null);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [autoplayAudio, setAutoplayAudio] = useState(false);
  const [communityQuery, setCommunityQuery] = useState("");
  const [communitySurface, setCommunitySurface] = useState("feed");
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
      const onAdminRoute = window.location.pathname.startsWith("/admin");
      setAdminRoute(onAdminRoute);
      const previewView = process.env.NODE_ENV !== "production"
        ? new URLSearchParams(window.location.search).get("preview")
        : null;
      if (previewView && !onAdminRoute) {
        setUser({
          id: "reader-preview",
          fullName: "Stanley Ohanugo",
          username: "Stanley O.",
          email: "reader@example.com",
          phone: "+234 708 298 0403",
          country: "NG",
          onboardingStep: "done"
        });
        setReady(true);
        setSplashDone(true);
        setView(previewView);
        return;
      }
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
        setAdminTwoFactorPending(Boolean(data.adminChallengePending && !data.admin));
        await refreshState();
        if (!active) return;
        setReady(true);
        setTimeout(() => {
          if (!active) return;
          setSplashDone(true);
          if (onAdminRoute) setView("admin");
          else if (data.user?.onboardingStep === "done") setView(savedView);
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
    function captureInstallPrompt(event) {
      event.preventDefault();
      setInstallPrompt(event);
    }
    window.addEventListener("beforeinstallprompt", captureInstallPrompt);
    return () => window.removeEventListener("beforeinstallprompt", captureInstallPrompt);
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

  async function shareApp() {
    const text = "Discover Ascendance - The Trilogy, a guided digital reading experience.";
    const url = window.location.origin;
    if (navigator.share) {
      await navigator.share({ title: "Ascendance - The Trilogy", text, url });
      return;
    }
    await navigator.clipboard.writeText(`${text} ${url}`);
    notify("Ascendance link copied.");
  }

  async function installApp() {
    if (!installPrompt) return notify("Use your browser menu and choose Add to Home Screen.");
    await installPrompt.prompt();
    await installPrompt.userChoice;
    setInstallPrompt(null);
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
    if (data.requiresTwoFactor) {
      setAdminTwoFactorPending(true);
      notify("Authentication code sent to the admin email.");
      return;
    }
    notify("Admin authentication could not be started.");
  }

  async function verifyAdminTwoFactor(formData) {
    const response = await fetch("/api/admin/verify-2fa", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ code: formData.get("code") })
    });
    const data = await response.json();
    if (!data.ok) return notify(data.error);
    setAdmin(data.admin);
    setAdminTwoFactorPending(false);
    notify("Admin login successful.");
    await refreshState();
  }

  async function adminLogout() {
    await fetch("/api/admin/logout", { method: "POST" });
    setAdmin(null);
    setAdminTwoFactorPending(false);
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

  if (ready && adminRoute) {
    return (
      <>
        <AdminGate
          admin={admin}
          twoFactorPending={adminTwoFactorPending}
          books={books}
          posts={posts}
          purchases={purchases}
          gifts={gifts}
          onLogin={adminLogin}
          onVerifyTwoFactor={verifyAdminTwoFactor}
          onLogout={adminLogout}
          onModeratePost={moderatePost}
          onAdminReply={adminReply}
          onRefresh={refreshState}
        />
        <Toast message={toast} />
      </>
    );
  }

  return (
    <>
      {!splashDone ? <Splash /> : null}
      {showTrailer && (!user || !isOnboarded) ? (
        <TrailerIntro onEnter={(shouldPlay) => { setAutoplayAudio(shouldPlay); setShowTrailer(false); setView("auth"); }} />
      ) : !user || !isOnboarded ? (
        <AuthView autoplay={autoplayAudio} user={user} onSignup={signup} onLogin={login} onVerify={verifyEmail} onResendCode={resendVerificationCode} onProfile={updateProfile} />
      ) : (
        <AppShell view={view} setView={(v) => {
          if (v === "community") {
            setCommunityQuery("");
            setCommunitySurface("feed");
          }
          setView(v);
        }}>
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
              onSelectLeader={(leader) => {
                setCommunityQuery(leader.name);
                setCommunitySurface("feed");
                setView("community");
              }}
              onViewLeaderboard={() => {
                setCommunityQuery("");
                setCommunitySurface("leaderboard");
                setView("community");
              }}
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
              onPurchase={purchase}
              purchases={purchases}
              user={user}
              onViewNotices={() => setView("notices")}
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
              initialQuery={communityQuery}
              onQueryChange={setCommunityQuery}
              initialSurface={communitySurface}
              onSurfaceChange={setCommunitySurface}
            />
          )}
          {view === "notices" && <NoticesView gifts={gifts} onGift={sendGift} />}
          {view === "profile" && (
            <ProfileView
              user={user}
              progress={progress}
              purchases={purchases}
              gifts={gifts}
              onProfile={updateProfile}
              onLogout={readerLogout}
              onShareApp={() => setShareModalOpen(true)}
              onInstall={installApp}
              canInstall={Boolean(installPrompt)}
            />
          )}
          {view === "admin" && (
            <AdminGate
              admin={admin}
              twoFactorPending={adminTwoFactorPending}
              books={books}
              posts={posts}
              purchases={purchases}
              gifts={gifts}
              onLogin={adminLogin}
              onVerifyTwoFactor={verifyAdminTwoFactor}
              onLogout={adminLogout}
              onModeratePost={moderatePost}
              onAdminReply={adminReply}
              onRefresh={refreshState}
            />
          )}
        </AppShell>
      )}
      {shareModalOpen && (
        <div className="modal-backdrop" role="presentation" onMouseDown={() => setShareModalOpen(false)}>
          <div className="modal-card" role="dialog" aria-modal="true" onMouseDown={(event) => event.stopPropagation()} style={{ padding: "24px", display: "grid", gap: "16px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h2 style={{ margin: 0, fontSize: "1.4rem", color: "var(--brand)" }}>Share Ascendance</h2>
              <button className="modal-close" onClick={() => setShareModalOpen(false)} style={{ minHeight: "auto", padding: "4px 8px" }}>Close</button>
            </div>
            <p style={{ margin: 0, color: "var(--ink)", lineHeight: 1.6 }}>Invite someone to discover Ascendance and earn 50 contribution points!</p>
            <div className="share-actions" style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "8px" }}>
              {["native", "whatsapp", "facebook", "x"].map((platform) => (
                <button
                  key={platform}
                  className="ghost-btn"
                  onClick={async () => {
                    const text = "Discover Ascendance - The Trilogy, a guided digital reading experience.";
                    const url = window.location.origin;
                    if (platform === "native") {
                      if (navigator.share) {
                        try {
                          await navigator.share({ title: "Ascendance - The Trilogy", text, url });
                        } catch (e) {
                          // cancelled
                        }
                      } else {
                        await navigator.clipboard.writeText(`${text} ${url}`);
                        notify("Ascendance link copied.");
                      }
                    } else {
                      const encodedText = encodeURIComponent(`${text} ${url}`);
                      const encodedUrl = encodeURIComponent(url);
                      const targets = {
                        whatsapp: `https://wa.me/?text=${encodedText}`,
                        facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
                        x: `https://twitter.com/intent/tweet?text=${encodedText}`
                      };
                      window.open(targets[platform], "_blank", "noopener,noreferrer");
                    }
                    setShareModalOpen(false);
                    try {
                      const response = await fetch("/api/community/share-reward", { method: "POST" });
                      const resData = await response.json();
                      if (resData.ok) {
                        notify("Earned 50 points!");
                        setUser(resData.user);
                      }
                    } catch (e) {
                      console.error("Failed to reward points", e);
                    }
                  }}
                >
                  {platform === "native" ? "Share Link" : platform.toUpperCase()}
                </button>
              ))}
            </div>
            <button className="primary-btn" onClick={() => setShareModalOpen(false)}>Cancel</button>
          </div>
        </div>
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
        </div>
        <div className="trailer-actions-container">
          <button className="trailer-action-btn primary" onClick={() => onEnter(false)}>Login</button>
        </div>
      </section>
    </main>
  );
}

function AuthView({ autoplay, user, onSignup, onLogin, onVerify, onResendCode, onProfile }) {
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

function AudioPlayer({ autoplay }) {
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);

  useEffect(() => {
    if (autoplay && audioRef.current) {
      audioRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch((e) => console.log("Autoplay failed", e));
    }
  }, [autoplay]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch((e) => console.log("Playback failed", e));
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleSeek = (e) => {
    if (audioRef.current) {
      const time = Number(e.target.value);
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const handleVolumeChange = (e) => {
    const vol = Number(e.target.value);
    setVolume(vol);
    if (audioRef.current) {
      audioRef.current.volume = vol;
    }
  };

  const formatTime = (time) => {
    if (isNaN(time)) return "0:00";
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  return (
    <div className="audio-player-widget" style={{
      border: "1px solid rgba(128, 105, 90, 0.28)",
      borderRadius: "12px",
      padding: "16px",
      background: "rgba(18, 16, 20, 0.95)",
      color: "#fff",
      display: "flex",
      flexDirection: "column",
      gap: "12px",
      width: "100%",
      marginTop: "16px",
      boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)"
    }}>
      <audio
        ref={audioRef}
        src="https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3"
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={() => setIsPlaying(false)}
      />
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <button
          type="button"
          onClick={togglePlay}
          style={{
            width: "44px",
            height: "44px",
            borderRadius: "50%",
            background: "#b01834",
            border: "none",
            color: "#fff",
            display: "grid",
            placeItems: "center",
            cursor: "pointer",
            fontSize: "1.2rem",
            fontWeight: "bold",
            minWidth: "auto",
            minHeight: "auto",
            padding: 0
          }}
        >
          {isPlaying ? "Ⅱ" : "▶"}
        </button>
        <div style={{ flex: 1, minWidth: 0, textAlign: "left" }}>
          <strong style={{ display: "block", fontSize: "0.95rem", color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>Ascendance: The Audio Drama</strong>
          <span style={{ fontSize: "0.8rem", color: "#d2a94f" }}>{isPlaying ? "Playing drama preview" : "Tap play to listen"}</span>
        </div>
      </div>
      
      <div style={{ display: "flex", alignItems: "center", gap: "10px", width: "100%" }}>
        <span style={{ fontSize: "0.75rem", color: "#ccc", width: "32px", display: "inline-block" }}>{formatTime(currentTime)}</span>
        <input
          type="range"
          min="0"
          max={duration || 100}
          value={currentTime}
          onChange={handleSeek}
          style={{
            flex: 1,
            height: "4px",
            borderRadius: "2px",
            background: "rgba(255,255,255,0.2)",
            accentColor: "#b01834",
            cursor: "pointer",
            outline: "none"
          }}
        />
        <span style={{ fontSize: "0.75rem", color: "#ccc", width: "32px", textAlign: "right", display: "inline-block" }}>{formatTime(duration)}</span>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "8px", justifyContent: "flex-end", width: "100%" }}>
        <span style={{ fontSize: "0.75rem", color: "#ccc" }}>Vol</span>
        <input
          type="range"
          min="0"
          max="1"
          step="0.05"
          value={volume}
          onChange={handleVolumeChange}
          style={{
            width: "70px",
            height: "3px",
            accentColor: "#b01834",
            cursor: "pointer"
          }}
        />
      </div>
    </div>
  );
}

function AppShell({ children, view, setView }) {
  return (
    <div className={`shell ${view === "reader" ? "is-reading" : ""}`}>
      <header className="topbar" aria-label="Ascendance">
        <div className="brand-lockup">
          <img src={BRAND_ASSETS.wordmark} alt="Ascendance The Trilogy" />
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
    { name: "Chmama Reads", points: 350, country: "US" },
    { name: "AdaReads", points: 340, country: "NG" },
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

function LeaderList({ leaders, onSelect }) {
  return (
    <div className="leader-strip" role="list" aria-label="Top community contributors">
      {leaders.map((leader, index) => (
        <button className={`leader-chip rank-${index + 1}`} key={`${leader.name}-${leader.points}`} role="listitem" onClick={() => onSelect?.(leader)}>
          <div className="leader-avatar" aria-hidden="true">
            {leader.avatar || leader.name.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase()}
          </div>
          <strong>{leader.points} pts <span>{leader.country || ""}</span></strong>
          <span>{leader.name}</span>
        </button>
      ))}
    </div>
  );
}

function HomeView({
  books,
  purchases,
  user,
  posts,
  progress,
  onViewBooks,
  onViewCommunity,
  onRead,
  onPurchase,
  onSelectLeader,
  onViewLeaderboard
}) {
  const [showSummary, setShowSummary] = useState(false);
  const ownedBooks = books.filter((book) => ownsBook(user.id, purchases, book.id));
  const currentBook = ownedBooks.at(-1) || books[0];
  const firstChapter = flattenChapters([currentBook])[0];
  const currentProgress = Object.values(progress).filter((item) => item?.bookId === currentBook.id).at(-1);
  const continueChapter = flattenChapters([currentBook]).find((item) => item.chapter.id === currentProgress?.chapterId) || firstChapter;
  const percent = currentProgress?.percentage || 0;

  const leaders = getCommunityLeaders(posts).slice(0, 5);

  function playSummary() {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const speech = new SpeechSynthesisUtterance(currentBook.blurb);
    speech.rate = 0.95;
    window.speechSynthesis.speak(speech);
  }

  return (
    <div className="home-screen">
      <section className="featured-book" aria-labelledby="featured-book-title">
        <div className="cover-stage">
          <img className="featured-cover" src={currentBook.cover} alt={`${currentBook.title} cover`} />
          <button className="audio-drama-fab" onClick={playSummary} aria-label={`Listen to the summary of ${currentBook.title}`}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
              <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
              <path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path>
            </svg>
          </button>
        </div>
        <div className="featured-copy">
          <p className="eyebrow">{BOOK_SECTION_LABELS[currentBook.id]}</p>
          <h1 id="featured-book-title">{currentBook.title}</h1>
          {percent > 0 ? <div className="home-progress"><span style={{ width: `${percent}%` }} /></div> : null}
        </div>
        <div className="featured-actions">
          <button className="ghost-btn summary-btn" onClick={() => setShowSummary(true)}>Book Summary</button>
          <button className="primary-btn continue-btn" onClick={() => onRead(continueChapter)}>
            {percent > 0 ? "Continue Reading" : "Start Reading"}
          </button>
        </div>
      </section>

      <section className="leader-section community-leaders" aria-label="Community leaders" style={{ textStyle: "left", marginTop: "24px" }}>
        <div className="leader-title" style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "4px" }}>
          <div style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="#F45A62" xmlns="http://www.w3.org/2000/svg" style={{ marginTop: "2px" }}>
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
            </svg>
            <div className="leader-title-copy">
              <h2 style={{ margin: 0, color: "var(--app-purple)", fontSize: "1.2rem", fontWeight: "bold", fontFamily: "Inter, sans-serif" }}>Community Leaders</h2>
              <p style={{ margin: "4px 0 0", color: "#6b7280", fontSize: "0.85rem" }}>Readers making the biggest contribution this week</p>
            </div>
          </div>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="var(--app-purple)" xmlns="http://www.w3.org/2000/svg" style={{ marginTop: "2px" }}>
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
          </svg>
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "16px", paddingRight: "4px" }}>
          <button onClick={onViewLeaderboard} style={{ background: "transparent", border: "none", color: "var(--app-purple)", fontSize: "0.9rem", fontWeight: "bold", textDecoration: "underline", cursor: "pointer", padding: 0 }}>
            View Full Leaderboard
          </button>
        </div>
        <LeaderList leaders={leaders} onSelect={onSelectLeader} />
      </section>

      {showSummary && (
        <div className="modal-backdrop" role="presentation" onMouseDown={() => { setShowSummary(false); window.speechSynthesis?.cancel(); }}>
          <div className="modal-card" role="dialog" aria-modal="true" onMouseDown={(e) => e.stopPropagation()} style={{ padding: "24px", display: "grid", gap: "16px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h2 style={{ margin: 0, fontSize: "1.4rem", color: "var(--brand)" }}>Book Summary</h2>
              <button className="modal-close" onClick={() => { setShowSummary(false); window.speechSynthesis?.cancel(); }} style={{ minHeight: "auto", padding: "4px 8px" }}>Close</button>
            </div>
            <h3 style={{ margin: 0, fontSize: "1.1rem" }}>{currentBook.title}</h3>
            <p style={{ margin: 0, color: "var(--ink)", lineHeight: 1.6 }}>{currentBook.blurb}</p>
            <div style={{ display: "flex", gap: "12px", marginTop: "12px" }}>
              <button className="primary-btn" onClick={playSummary} style={{ flex: 1 }}>
                Listen (TTS)
              </button>
              <button className="ghost-btn" onClick={() => window.speechSynthesis?.cancel()} style={{ flex: 1 }}>
                Stop
              </button>
            </div>
          </div>
        </div>
      )}
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
    <div className="store-screen">
      <div className="screen-heading">
        <p className="eyebrow">Ascendance collection</p>
        <h1>Store</h1>
        <p>Unlock the complete trilogy or continue one book at a time.</p>
      </div>
      <section className="bundle-offer">
        <div className="bundle-covers" aria-hidden="true">
          {books.map((book) => <img key={book.id} src={book.cover} alt="" />)}
        </div>
        <div className="bundle-copy">
          <span className="offer-badge">Best value</span>
          <h2>Unlock all three books</h2>
          <p>One payment unlocks the complete Ascendance trilogy.</p>
          <ReaderPrice usdAmount={USD_PRICES.trilogy} />
          <button className="primary-btn" onClick={() => onPurchase(null, "trilogy")}>Unlock Trilogy</button>
        </div>
      </section>
      {books.map((book) => (
        <section className="store-book" key={book.id}>
          {(() => {
            const state = bookPurchaseState(book, user.id, purchases);
            const first = flattenChapters([book])[0];
            const latestProgress = Object.values(progress).filter((item) => item?.bookId === book.id).at(-1);
            const continueChapter = flattenChapters([book]).find((item) => item.chapter.id === latestProgress?.chapterId) || first;
            return (
              <>
                <img src={book.cover} alt={`${book.title} cover`} className="store-cover" />
                <div className="store-book-copy">
                  <div className="store-book-topline">
                    <span className="eyebrow">{book.subtitle}</span>
                    <ReaderPrice usdAmount={usdBookPrice(book)} />
                  </div>
                  <h2>{book.title}</h2>
                  <p className="included-books">{BOOK_SECTION_LABELS[book.id]}</p>
                  <p>{book.blurb}</p>
                  <p className={`availability ${state.owned ? "is-owned" : state.requiresPrevious ? "is-disabled" : ""}`}>
                    {state.owned ? "Unlocked and ready to read" : state.requiresPrevious ? `Unlock Book ${book.order - 1} first` : "Available to unlock"}
                  </p>
                  <button
                    className={state.owned ? "primary-btn" : "ghost-btn"}
                    disabled={Boolean(state.requiresPrevious)}
                    onClick={() => state.owned ? onRead(continueChapter) : onPurchase(book)}
                  >
                    {state.owned ? "Read" : state.requiresPrevious ? "Locked" : "Unlock"}
                  </button>
                </div>
              </>
            );
          })()}
        </section>
      ))}
      <section className="print-order">
        <div>
          <p className="eyebrow">Printed edition</p>
          <h2>Order Ascendance hardcopy</h2>
          <p>Prefer paper? Send a request and the publishing team will contact you.</p>
        </div>
        <a className="ghost-btn" href="mailto:brandzillatech@gmail.com?subject=Ascendance%20Hardcopy%20Order">Order</a>
      </section>
    </div>
  );
}

function UnlockDialog({ book, onClose, onPurchase, onViewNotices }) {
  const [selection, setSelection] = useState(book.id === "book-1" ? "trilogy" : "book");

  const isBook1 = book.id === "book-1";
  const bookPrice = book.id === "book-1" ? 2.59 : 3.59;
  const bookTitle = book.title;

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section className="unlock-dialog" role="dialog" aria-modal="true" aria-labelledby="unlock-title" onMouseDown={(event) => event.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="Close unlock options">Close</button>
        <img className="unlock-wordmark" src={BRAND_ASSETS.wordmark} alt="Ascendance The Trilogy" />
        
        {isBook1 ? (
          <>
            <h2 id="unlock-title">The free chapters end here.</h2>
            <p>The story is only getting started. Unlock Book One, or choose the complete trilogy for the full journey.</p>
            <div className="unlock-covers" aria-hidden="true">
              <img src="/assets/books/disciples-inverted-cross.jpeg" alt="" />
              <img src="/assets/books/merchants-ivory-towers.jpeg" alt="" />
              <img src="/assets/books/rhapsodies-coming-regent.jpeg" alt="" />
            </div>
            <label className={`unlock-option ${selection === "trilogy" ? "is-selected" : ""}`}>
              <input type="radio" name="unlock" value="trilogy" checked={selection === "trilogy"} onChange={() => setSelection("trilogy")} />
              <span><strong>Unlock all three books (Trilogy)</strong><small>{usdCurrency(6.59)} · Best value</small></span>
            </label>
            <label className={`unlock-option ${selection === "book" ? "is-selected" : ""}`}>
              <input type="radio" name="unlock" value="book" checked={selection === "book"} onChange={() => setSelection("book")} />
              <span><strong>Unlock Book One: Disciples of the Inverted Cross</strong><small>{usdCurrency(2.59)}</small></span>
            </label>
            <button className="primary-btn unlock-continue" onClick={() => onPurchase(selection === "book" ? book : null, selection)}>Continue to checkout</button>
          </>
        ) : (
          <>
            <h2 id="unlock-title">Unlock {bookTitle}</h2>
            <p>To continue reading, unlock this sequel volume or purchase the complete trilogy.</p>
            <div className="unlock-covers" aria-hidden="true">
              <img src={book.cover} alt="" style={{ width: "120px", borderRadius: "8px" }} />
            </div>
            <div style={{ display: "grid", gap: "12px", width: "100%", marginTop: "16px" }}>
              <button className="primary-btn" onClick={() => onPurchase(book, "book")} style={{ minHeight: "58px", borderRadius: "12px" }}>
                Unlock {bookTitle} ({usdCurrency(bookPrice)})
              </button>
              <button className="ghost-btn" onClick={() => { onClose(); onViewNotices(); }} style={{ minHeight: "58px", borderRadius: "12px" }}>
                Gift this Book
              </button>
            </div>
          </>
        )}
        <small className="checkout-note" style={{ marginTop: "12px", display: "block" }}>Paystack displays the supported settlement currency at checkout.</small>
      </section>
    </div>
  );
}

function ReaderView({ activeChapter, chapters, settings, setSettings, onBack, onAutoScroll, onSpeak, onSave, onRead, onPurchase, purchases, user, onViewNotices }) {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [unlockOpen, setUnlockOpen] = useState(false);
  const index = chapters.findIndex((item) => item.chapter.id === activeChapter.chapter.id);
  const prev = chapters[index - 1];
  const next = chapters[index + 1];

  function goNext() {
    if (!next) return;
    const locked = !next.chapter.isPreview && !ownsBook(user.id, purchases, next.book.id);
    if (locked) {
      setUnlockOpen(true);
      return;
    }
    onRead(next);
  }

  return (
    <div className={`reader-shell ${settings.theme}`}>
      <header className="reader-topbar">
        <div className="reader-topbar-row-1">
          <button className="reader-back-btn" onClick={onBack} aria-label="Go back">
            <svg className="back-arrow-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="19" y1="12" x2="5" y2="12"></line>
              <polyline points="12 19 5 12 12 5"></polyline>
            </svg>
          </button>
          <div className="reader-central-controls" style={{ flex: 1, justifyContent: "center" }}>
            <button className="reader-btn tts-btn" onClick={onSpeak}>
              <span>TTS</span>
            </button>
            <button className="reader-btn save-btn" onClick={onSave}>
              <span>Save</span>
            </button>
          </div>
          <button className={`reader-gear-btn ${settingsOpen ? "is-active" : ""}`} onClick={() => setSettingsOpen(!settingsOpen)} aria-label="Reading settings">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="22" height="22">
              <circle cx="12" cy="12" r="3"/>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
            </svg>
          </button>
        </div>
        <div className="reader-topbar-row-2">
          <div className="reader-meta-info">
            <h1>{activeChapter.book.title}</h1>
            <span>Reading: {activeChapter.chapter.title} - {activeChapter.chapter.subtitle}</span>
          </div>
        </div>
      </header>
      {settingsOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }} onClick={() => setSettingsOpen(false)}>
          <aside className="settings-drawer" aria-label="Reading settings" style={{ background: settings.theme === 'dark' ? '#1c1c1e' : '#fff', padding: '24px', borderTopLeftRadius: '24px', borderTopRightRadius: '24px', color: settings.theme === 'dark' ? '#fff' : '#111' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ margin: 0, fontSize: '1.2rem', fontFamily: 'Georgia, serif' }}>Reader Settings</h2>
              <button onClick={() => setSettingsOpen(false)} style={{ background: 'transparent', border: 'none', color: 'inherit', cursor: 'pointer' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </div>

            <div style={{ display: 'grid', gap: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 'bold' }}>Typography</span>
                <div style={{ display: 'flex', background: settings.theme === 'dark' ? '#333' : '#f1f1f1', borderRadius: '8px', padding: '4px' }}>
                  <button onClick={() => setSettings({ ...settings, font: 'Georgia' })} style={{ padding: '8px 16px', border: 'none', borderRadius: '4px', background: settings.font === 'Georgia' ? '#fff' : 'transparent', color: settings.font === 'Georgia' ? '#111' : 'inherit', fontWeight: 'bold', fontFamily: 'Georgia, serif', cursor: 'pointer', boxShadow: settings.font === 'Georgia' ? '0 2px 4px rgba(0,0,0,0.1)' : 'none' }}>Serif</button>
                  <button onClick={() => setSettings({ ...settings, font: 'Inter' })} style={{ padding: '8px 16px', border: 'none', borderRadius: '4px', background: settings.font !== 'Georgia' ? '#fff' : 'transparent', color: settings.font !== 'Georgia' ? '#111' : 'inherit', fontWeight: 'bold', fontFamily: 'Inter, sans-serif', cursor: 'pointer', boxShadow: settings.font !== 'Georgia' ? '0 2px 4px rgba(0,0,0,0.1)' : 'none' }}>Sans-serif</button>
                </div>
              </div>

              <div>
                <span style={{ fontWeight: 'bold', display: 'block', marginBottom: '12px' }}>Text Size</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <span style={{ fontSize: '1rem', fontWeight: 'bold' }}>A-</span>
                  <input type="range" min="16" max="28" value={settings.size} onChange={(event) => setSettings({ ...settings, size: Number(event.target.value) })} style={{ flex: 1, accentColor: 'var(--app-purple)' }} />
                  <span style={{ fontSize: '1.4rem', fontWeight: 'bold' }}>A+</span>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 'bold' }}>Theme</span>
                <div style={{ display: 'flex', gap: '16px' }}>
                  <button onClick={() => setSettings({ ...settings, theme: 'light' })} style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#ffffff', border: settings.theme === 'light' ? '2px solid var(--app-purple)' : '1px solid #ccc', cursor: 'pointer' }} aria-label="Light"></button>
                  <button onClick={() => setSettings({ ...settings, theme: 'sepia' })} style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#f4ecd8', border: settings.theme === 'sepia' ? '2px solid var(--app-purple)' : '1px solid #ccc', cursor: 'pointer' }} aria-label="Sepia"></button>
                  <button onClick={() => setSettings({ ...settings, theme: 'dark' })} style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#1c1c1e', border: settings.theme === 'dark' ? '2px solid var(--app-purple)' : '1px solid #555', cursor: 'pointer' }} aria-label="Dark"></button>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 'bold' }}>Page turning layout</span>
                <label style={{ display: 'inline-flex', alignItems: 'center', cursor: 'pointer' }}>
                  <input type="checkbox" style={{ appearance: 'none', width: '44px', height: '24px', background: '#ccc', borderRadius: '12px', position: 'relative', transition: '0.3s' }} className="toggle-switch" />
                </label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 'bold' }}>Audio auto-play</span>
                <label style={{ display: 'inline-flex', alignItems: 'center', cursor: 'pointer' }}>
                  <input type="checkbox" checked={settings.autoplay} onChange={(e) => setSettings({ ...settings, autoplay: e.target.checked })} style={{ appearance: 'none', width: '44px', height: '24px', background: settings.autoplay ? 'var(--app-purple)' : '#ccc', borderRadius: '12px', position: 'relative', transition: '0.3s' }} className="toggle-switch active-purple" />
                </label>
              </div>
            </div>
          </aside>
        </div>
      )}
      
      <article className="reader-body" style={{ fontFamily: settings.font, fontSize: settings.size, lineHeight: settings.line, textAlign: settings.align, paddingBottom: '100px' }}>
        <p className="eyebrow">{activeChapter.chapter.title}</p>
        <h2>{activeChapter.chapter.subtitle}</h2>
        {activeChapter.chapter.content.map((paragraph, paragraphIndex) => <p key={`${activeChapter.chapter.id}-${paragraphIndex}`}>{paragraph}</p>)}
        
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '40px', paddingTop: '20px', borderTop: '1px solid rgba(128,105,90,0.2)' }}>
          <button className="ghost-btn" disabled={!prev} onClick={() => prev && onRead(prev)}>Previous</button>
          <button className="ghost-btn" disabled={!next} onClick={goNext}>Next</button>
        </div>
      </article>

      <div className="reader-bottom-bar" style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: settings.theme === 'dark' ? '#111' : '#fff', borderTop: '1px solid rgba(128,105,90,0.2)', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 50 }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', fontWeight: 'bold', color: settings.theme === 'dark' ? '#fff' : '#111' }}>
          Audio auto-play
          <input type="checkbox" checked={settings.autoplay} onChange={(e) => setSettings({ ...settings, autoplay: e.target.checked })} style={{ appearance: 'none', width: '44px', height: '24px', background: settings.autoplay ? 'var(--app-purple)' : '#ccc', borderRadius: '12px', position: 'relative' }} className="toggle-switch active-purple" />
        </label>
        <button onClick={() => setSettingsOpen(true)} style={{ background: 'transparent', border: 'none', fontWeight: 'bold', fontSize: '1.2rem', color: settings.theme === 'dark' ? '#fff' : '#111', cursor: 'pointer' }}>Aa</button>
      </div>
      {unlockOpen ? <UnlockDialog book={next?.book || activeChapter.book} onClose={() => setUnlockOpen(false)} onPurchase={onPurchase} onViewNotices={onViewNotices} /> : null}
    </div>
  );
}

function CommunityView({
  posts,
  user,
  onPost,
  onLike,
  onComment,
  onReport,
  onShare,
  initialQuery = "",
  onQueryChange,
  initialSurface = "feed",
  onSurfaceChange
}) {
  const [sort, setSort] = useState("newest");
  const [surface, setSurfaceState] = useState(initialSurface);
  const [selectedPost, setSelectedPost] = useState(null);
  const [composerOpen, setComposerOpen] = useState(false);
  const [shareSuccess, setShareSuccess] = useState(null);
  const [historyType, setHistoryType] = useState("posts");
  const [query, setQueryState] = useState(initialQuery);
  const [searchOpen, setSearchOpen] = useState(false);

  const setSurface = (val) => {
    setSurfaceState(val);
    onSurfaceChange?.(val);
  };
  const setQuery = (val) => {
    setQueryState(val);
    onQueryChange?.(val);
  };

  useEffect(() => {
    setQueryState(initialQuery);
  }, [initialQuery]);

  useEffect(() => {
    setSurfaceState(initialSurface);
  }, [initialSurface]);

  const leaders = getCommunityLeaders(posts).slice(0, 5);
  const sortedPosts = [...posts].sort((a, b) => {
    if (sort === "oldest") return new Date(a.createdAt) - new Date(b.createdAt);
    if (sort === "liked") return (b.likes || 0) - (a.likes || 0);
    if (sort === "replied") return (b.comments?.length || 0) - (a.comments?.length || 0);
    return new Date(b.createdAt) - new Date(a.createdAt);
  }).filter((post) => `${post.username} ${post.content}`.toLowerCase().includes(query.toLowerCase()));

  const selected = selectedPost ? posts.find((post) => post.id === selectedPost) : null;
  const userPosts = posts.filter((post) => post.userId === user.id);
  const userComments = posts.flatMap((post) => (post.comments || []).filter((comment) => comment.userId === user.id || comment.user === user.username).map((comment) => ({ ...comment, post })));

  async function submitReview(event) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const title = String(data.get("title") || "").trim();
    const review = String(data.get("review") || "").trim();
    const payload = new FormData();
    payload.set("content", `${title}\n${review}`);
    await onPost(payload);
    setComposerOpen(false);
    setShareSuccess({ content: review, username: user.username || user.fullName });
  }

  function openLeader(leader) {
    setQuery(leader.name);
    setSurface("feed");
  }

  return (
    <div className="community-screen">
      <header className="community-header" style={{ alignItems: 'center', justifyContent: surface === "feed" ? 'center' : 'space-between', padding: '16px 24px', background: 'transparent' }}>
        {surface === "feed" ? (
          <>
            <img src={BRAND_ASSETS.wordmark} alt="Ascendance" style={{ height: '24px' }} />
            <button style={{ position: 'absolute', right: '24px', border: '2px solid var(--app-purple)', background: 'transparent', color: 'var(--app-purple)', fontWeight: 'bold', padding: '4px 12px', borderRadius: '8px', fontSize: '0.85rem' }}>Admin</button>
          </>
        ) : (
          <h1 style={{ fontFamily: 'Georgia, serif', color: 'var(--app-purple)', margin: 0 }}>
            {surface === "notifications" ? "Notifications" : surface === "history" ? "History" : surface === "leaderboard" ? "Leaderboard" : surface === "compose" ? "Write a Review" : surface === "sort" ? "Update Feed" : surface === "review" ? "Reviews" : "Community"}
          </h1>
        )}
        {surface !== "feed" && (
          <div className="community-tools">
            <button className="circle-icon-btn" onClick={() => { setSurface("feed"); setSelectedPost(null); }} aria-label="Back">
              <svg viewBox="0 0 24 24"><path d="M19 12H5M12 19l-7-7 7-7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
            {surface === "compose" ? (
              <button form="compose-form" type="submit" style={{ background: "transparent", border: "none", color: "var(--app-purple)", fontWeight: "bold", fontSize: "1rem", cursor: "pointer", marginLeft: "12px" }}>Post</button>
            ) : null}
            {surface === "history" ? (
              <select value={historyType} onChange={(e) => setHistoryType(e.target.value)} style={{ padding: '8px 12px', borderRadius: '8px', border: 'none', background: 'var(--app-purple)', color: 'white', fontWeight: 'bold' }}>
                <option value="posts">Posts ▼</option>
                <option value="comments">Comments ▼</option>
              </select>
            ) : null}
          </div>
        )}
      </header>

      {surface === "feed" ? (
        <div style={{ padding: '0 24px', paddingBottom: '40px' }}>
          {/* Reader Leaderboard Section */}
          <section style={{ marginTop: '16px' }}>
            <div style={{ marginBottom: '16px' }}>
              <h2 style={{ margin: 0, color: 'var(--app-purple)', fontSize: '1.4rem', fontFamily: 'Georgia, serif' }}>Reader Leaderboard</h2>
              <p style={{ margin: '4px 0 0', color: '#6b7280', fontSize: '0.9rem' }}>Ranked by reviews, likes, and helpful discussion.</p>
            </div>
            <div style={{ display: 'grid', gap: '12px' }}>
              {getCommunityLeaders(posts).slice(0, 4).map((leader, i) => {
                const colors = [
                  { border: '#C29837', bg: '#A67C24', rank: '#A67C24' }, // Gold/Bronze
                  { border: '#8A9BA8', bg: '#4A0E4E', rank: '#111' }, // Silver / Purple
                  { border: '#CD7F32', bg: '#4A0E4E', rank: '#111' }, // Bronze / Purple
                  { border: '#4A0E4E', bg: '#4A0E4E', rank: '#111' }, // Purple / Purple
                ];
                const c = colors[i] || colors[3];
                return (
                  <button key={leader.name} onClick={() => openLeader(leader)} style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px', background: 'white', border: 'none', borderLeft: `6px solid ${c.border}`, borderRadius: '8px', width: '100%', textAlign: 'left', cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                    <span style={{ fontSize: '0.9rem', fontWeight: 'bold', color: c.rank, minWidth: '16px', textAlign: 'center' }}>{i + 1}</span>
                    <div className="avatar" style={{ width: '40px', height: '40px', borderRadius: '50%', background: c.bg, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '1rem' }}>
                      {leader.avatar || leader.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div style={{ flex: 1 }}>
                      <strong style={{ display: 'block', fontSize: '1rem', marginBottom: '2px', color: '#111' }}>{leader.name}</strong>
                      <span style={{ fontSize: '0.8rem', color: '#888', fontWeight: 'bold' }}>{leader.country}</span>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <strong style={{ display: 'block', fontSize: '1.1rem', color: 'var(--app-purple)' }}>{leader.pts}</strong>
                      <span style={{ fontSize: '0.75rem', color: '#888', fontWeight: 'bold' }}>points</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          {/* Community & Composer Section */}
          <section style={{ marginTop: '24px', background: 'white', borderRadius: '16px', padding: '24px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
            <h2 style={{ margin: '0 0 8px', color: 'var(--app-purple)', fontSize: '1.6rem', fontFamily: 'Georgia, serif' }}>Community</h2>
            <p style={{ margin: '0 0 24px', color: '#6b7280', fontSize: '0.95rem', lineHeight: '1.5' }}>Reader reviews, replies, sharing, and moderation signals.</p>
            
            <h3 style={{ margin: '0 0 8px', color: 'var(--app-purple)', fontSize: '0.95rem', fontWeight: 'bold' }}>Your review</h3>
            <form onSubmit={submitReview} style={{ display: 'grid', gap: '16px' }}>
              <textarea name="review" placeholder="Write your review" style={{ width: '100%', minHeight: '120px', padding: '16px', borderRadius: '12px', border: '2px solid var(--app-purple)', fontSize: '1rem', outline: 'none', resize: 'vertical' }} required />
              <button type="submit" style={{ background: 'var(--app-purple)', color: 'white', padding: '16px', borderRadius: '12px', fontWeight: 'bold', fontSize: '1.1rem', border: 'none', cursor: 'pointer' }}>Post Review</button>
            </form>
          </section>

          {/* Feed Toolbar & Feed List */}
          <div style={{ marginTop: '32px' }}>
            <div className={`feed-toolbar ${searchOpen ? "has-search" : ""}`} style={{ marginBottom: '16px' }}>
              {searchOpen ? <label className="search-field" style={{ flex: 1 }}><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search community" autoFocus style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid rgba(0,0,0,0.1)' }} /></label> : null}
              <div style={{ display: 'flex', justifyContent: searchOpen ? 'flex-end' : 'space-between', width: searchOpen ? 'auto' : '100%', alignItems: 'center' }}>
                {!searchOpen && <button onClick={() => setSearchOpen(true)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--app-purple)', fontWeight: 'bold' }}>
                  <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                  Search
                </button>}
                <button className="ghost-btn" onClick={() => setSurface("sort")} style={{ color: 'var(--app-purple)', padding: 0, minHeight: 'auto' }}>Sort <span>▼</span></button>
              </div>
            </div>
            <div className="community-feed">
              {sortedPosts.map((post) => (
                <ReviewCard
                  key={post.id}
                  post={post}
                  user={user}
                  onOpen={() => { setSelectedPost(post.id); setSurface("review"); }}
                  onLike={onLike}
                  onShare={onShare}
                />
              ))}
            </div>
          </div>
        </div>
      ) : null}

      {surface === "review" && selected ? (
        <section className="review-detail" style={{ marginTop: '24px' }}>
          <ReviewCard post={selected} user={user} onOpen={() => {}} onLike={onLike} onShare={onShare} expanded />
          <div className="reply-heading" style={{ marginTop: '32px', marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontSize: '1.2rem', color: 'var(--app-purple)', margin: 0 }}>Reviews</h2>
            <span style={{ fontWeight: 'bold', color: '#666' }}>{selected.comments?.length || 0}</span>
          </div>
          <CommentForm label="Write a review" onSubmit={(text) => onComment(selected.id, text)} />
          <div className="comment-list" style={{ marginTop: '24px' }}>
            {(selected.comments || []).filter((comment) => !comment.parentId).map((comment) => (
              <CommunityComment
                key={comment.id || comment.text}
                comment={comment}
                replies={(selected.comments || []).filter((reply) => reply.parentId === comment.id)}
                onReply={(text) => onComment(selected.id, text, comment.id)}
              />
            ))}
          </div>
          <button className="report-link" onClick={() => onReport(selected.id)} style={{ marginTop: '32px', color: '#888', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '0.85rem' }}>Report this review</button>
        </section>
      ) : null}

      {surface === "history" ? (
        <section className="history-screen" style={{ marginTop: '24px', display: 'grid', gap: '16px' }}>
          {historyType === "posts"
            ? userPosts.map((post) => (
                <article key={post.id} style={{ padding: '16px', background: 'transparent', border: '1px solid rgba(0,0,0,0.1)', borderRadius: '12px' }}>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '12px' }}>
                    <div className="avatar" style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--app-purple)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>{post.avatar || post.username?.slice(0, 1) || "A"}</div>
                    <strong style={{ fontSize: '1rem' }}>{post.username}</strong>
                  </div>
                  <p style={{ margin: '0 0 12px', fontSize: '0.95rem', color: '#4b5563', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: '1.5' }}>{splitPostContent(post.content).body}</p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.85rem', color: '#6b7280' }}>{new Date(post.createdAt).toLocaleDateString()}</span>
                    <h3 style={{ margin: 0, fontSize: '1rem', color: 'var(--app-purple)' }}>{splitPostContent(post.content).title}</h3>
                  </div>
                </article>
              ))
            : userComments.map((comment) => (
                <article key={comment.id || comment.text} style={{ padding: '16px', background: 'transparent', border: '1px solid rgba(0,0,0,0.1)', borderRadius: '12px' }}>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '12px' }}>
                    <div className="avatar" style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--app-purple)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>{comment.avatar || comment.user?.slice(0, 1) || "A"}</div>
                    <strong style={{ fontSize: '1rem' }}>{comment.user}</strong>
                  </div>
                  <p style={{ margin: '0 0 12px', fontSize: '0.95rem', color: '#4b5563', lineHeight: '1.5' }}>{comment.text}</p>
                  <span style={{ fontSize: '0.85rem', color: '#6b7280' }}>{new Date(comment.createdAt || Date.now()).toLocaleDateString()}</span>
                </article>
              ))}
          {((historyType === "posts" && !userPosts.length) || (historyType === "comments" && !userComments.length)) ? <div className="empty-state">Nothing here yet.</div> : null}
        </section>
      ) : null}

      {surface === "notifications" ? (
        <section className="notification-list" style={{ marginTop: '24px', display: 'grid', gap: '16px' }}>
          {posts.flatMap((post) => (post.comments || []).map((comment) => ({ ...comment, post }))).slice(0, 12).map((notice, index) => (
            <article className="notification-item" key={notice.id || `${notice.text}-${index}`} style={{ display: 'flex', gap: '16px', padding: '16px', background: 'transparent', border: '1px solid rgba(0,0,0,0.1)', borderRadius: '12px', alignItems: 'flex-start' }}>
              <div className="avatar" style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--app-purple)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', flexShrink: 0, fontSize: '1.2rem' }}>{notice.avatar || notice.user?.slice(0, 1) || "A"}</div>
              <div>
                <p style={{ margin: '0 0 4px', fontSize: '1rem', color: '#111' }}><strong>{notice.user}</strong> replied to your review <em>“{splitPostContent(notice.post.content).title}”</em></p>
                <p style={{ margin: '0 0 8px', fontSize: '0.95rem', color: '#4b5563', lineHeight: '1.4' }}>"{notice.text}"</p>
                <span style={{ fontSize: '0.85rem', color: '#6b7280' }}>{new Date(notice.createdAt || Date.now()).toLocaleDateString()}</span>
              </div>
            </article>
          ))}
          {!posts.some((post) => post.comments?.length) ? <div className="empty-state" style={{ padding: '24px', textAlign: 'center', color: '#6b7280' }}>No notifications yet.</div> : null}
        </section>
      ) : null}

      {surface === "compose" ? (
        <section className="compose-screen" style={{ marginTop: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'var(--app-purple)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '2rem', fontFamily: 'Georgia, serif', lineHeight: 1 }}>
              “
            </div>
          </div>
          <form id="compose-form" className="review-composer" onSubmit={submitReview} style={{ display: 'grid', gap: '20px' }}>
            <label style={{ display: 'grid', gap: '8px', color: 'var(--app-purple)', fontWeight: 'bold' }}>Title
              <input name="title" maxLength={30} placeholder="What is the headline?" required style={{ padding: '16px', borderRadius: '8px', border: '1px solid rgba(0,0,0,0.1)', background: 'transparent', fontSize: '1rem', outline: 'none' }} />
            </label>
            <label style={{ display: 'grid', gap: '8px', color: 'var(--app-purple)', fontWeight: 'bold' }}>Review
              <textarea name="review" maxLength={250} placeholder="What is your experience?" required style={{ padding: '16px', borderRadius: '8px', border: '1px solid rgba(0,0,0,0.1)', background: 'transparent', minHeight: '160px', fontSize: '1rem', resize: 'vertical', outline: 'none' }} />
            </label>
          </form>
        </section>
      ) : null}

      {surface === "sort" ? (
        <section className="sort-screen" style={{ marginTop: '24px' }}>
          <p style={{ margin: '0 0 24px', color: '#6b7280', fontSize: '1rem', fontWeight: 'bold' }}>How should we sort your feed?</p>
          <form style={{ display: 'grid', gap: '16px' }}>
            {["newest", "oldest", "liked", "replied"].map((sortOption) => (
              <label key={sortOption} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px', borderRadius: '8px', border: '1px solid rgba(0,0,0,0.1)', cursor: 'pointer', background: sort === sortOption ? 'var(--app-purple)' : 'transparent', color: sort === sortOption ? 'white' : 'inherit', transition: 'all 0.2s' }}>
                <input type="radio" name="sort" value={sortOption} checked={sort === sortOption} onChange={() => { setSort(sortOption); setSurface("feed"); }} style={{ display: 'none' }} />
                <span style={{ fontSize: '1.1rem', textTransform: 'capitalize', fontWeight: 'bold' }}>
                  {sortOption === "liked" ? "Most Liked" : sortOption === "replied" ? "Most Replied" : sortOption}
                </span>
              </label>
            ))}
          </form>
        </section>
      ) : null}

      {shareSuccess ? (
        <div className="modal-backdrop" role="presentation" onMouseDown={() => setShareSuccess(null)}>
          <section className="share-success" role="dialog" aria-modal="true" onMouseDown={(event) => event.stopPropagation()} style={{ background: '#f3f4f6', padding: '32px 24px', borderRadius: '16px', textAlign: 'left', width: 'min(360px, 90vw)' }}>
            <h2 style={{ color: 'var(--app-purple)', margin: '0 0 16px', fontSize: '1.4rem' }}>Post Successful.</h2>
            <p style={{ margin: '0 0 24px', color: '#4b5563', lineHeight: '1.5' }}>Your Review/Comment has been posted in the Community.<br/><br/>You may also share your Review with friends on your social media channels.</p>
            <div className="share-actions" style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button className="circle-icon-btn" onClick={() => onShare(shareSuccess, 'facebook')} style={{ background: '#1877F2' }}>f</button>
              <button className="circle-icon-btn" onClick={() => onShare(shareSuccess, 'x')} style={{ background: '#000' }}>X</button>
              <button className="circle-icon-btn" onClick={() => onShare(shareSuccess, 'instagram')} style={{ background: '#E4405F' }}>in</button>
              <button className="circle-icon-btn" onClick={() => onShare(shareSuccess, 'whatsapp')} style={{ background: '#25D366' }}>W</button>
              <button className="circle-icon-btn" onClick={() => onShare(shareSuccess, 'linkedin')} style={{ background: '#0A66C2' }}>in</button>
            </div>
          </section>
        </div>
      ) : null}
    </div>
  );
}

function ReviewCard({ post, user, onOpen, onLike, onShare, expanded = false }) {
  const liked = post.likedBy?.includes(user.id);
  const copy = splitPostContent(post.content);
  return (
    <article className={`review-card ${post.pinned ? "is-pinned" : ""}`}>
      <button className="review-card-main" onClick={onOpen}>
        <div className="review-author">
          <div className="avatar">{post.avatar || post.username?.slice(0, 1) || "A"}</div>
          <div><strong>{post.username}</strong><span>{post.country} · {new Date(post.createdAt).toLocaleDateString()}</span></div>
        </div>
        <h2>{copy.title}</h2>
        <p>{copy.body}</p>
      </button>
      <div className="review-actions">
        <button onClick={() => onLike(post.id)} aria-label={`${liked ? "Unlike" : "Like"} review`}>{liked ? "Liked" : "Like"} <strong>{post.likes || 0}</strong></button>
        <button onClick={onOpen}>Replies <strong>{post.comments?.length || 0}</strong></button>
        <button onClick={() => onShare(post, "native")}>Share</button>
      </div>
    </article>
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
      <button className="reply-link" onClick={() => setOpen(!open)}>Reply</button>
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
    <div className="gift-screen">
      <div className="screen-heading">
        <p className="eyebrow">Share the journey</p>
        <h1>Gift Ascendance</h1>
        <p>Send the complete trilogy to a friend and follow their redemption progress here.</p>
      </div>
      <section className="gift-panel">
        <div className="gift-cover-stack" aria-hidden="true">
          <img src="/assets/books/disciples-inverted-cross.jpeg" alt="" />
          <img src="/assets/books/merchants-ivory-towers.jpeg" alt="" />
          <img src="/assets/books/rhapsodies-coming-regent.jpeg" alt="" />
        </div>
        <div className="gift-price">
          <div><span>Ascendance Trilogy gift</span><small>All three books for one reader</small></div>
          <ReaderPrice usdAmount={USD_PRICES.giftTrilogy} />
        </div>
        <form onSubmit={(event) => { event.preventDefault(); onGift(new FormData(event.currentTarget)); event.currentTarget.reset(); }} className="gift-form">
          <label>Recipient email<input name="recipientEmail" type="email" placeholder="friend@example.com" required /></label>
          <button className="primary-btn">Pay and Send Gift</button>
        </form>
      </section>
      <section className="gift-history">
        <h2>Gift activity</h2>
        {gifts.length ? gifts.map((gift) => <article className="notice-card" key={gift.id}><div><h3>{gift.recipientEmail}</h3><p>{gift.status}</p></div><strong>{gift.accessCode}</strong></article>) : <div className="empty-state">No gift activity yet.</div>}
      </section>
    </div>
  );
}

function ProfileView({ user, progress, purchases, gifts, onProfile, onLogout, onShareApp, onInstall, canInstall }) {
  const completed = Object.values(progress).filter((item) => Number(item?.percentage || 0) >= 100).length;
  return (
    <div className="profile-screen" style={{ maxWidth: '800px', margin: '0 auto', padding: '16px', background: 'var(--reader-bg, #fff)', minHeight: '100vh' }}>
      <header className="profile-header" style={{ display: 'flex', alignItems: 'center', marginBottom: '32px' }}>
        <button className="circle-icon-btn" onClick={() => window.history.back()} aria-label="Back" style={{ border: 'none', background: 'transparent' }}>
          <svg viewBox="0 0 24 24" width="24" height="24"><path d="M19 12H5M12 19l-7-7 7-7" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>
        <h1 style={{ fontFamily: 'Georgia, serif', color: 'var(--app-purple)', margin: '0 auto', fontSize: '1.6rem' }}>ASCENDANCE</h1>
        <div style={{ width: '40px' }}></div>
      </header>

      <section className="profile-form-section" style={{ display: 'grid', gap: '20px', marginBottom: '32px' }}>
        <form onSubmit={(event) => { event.preventDefault(); onProfile(new FormData(event.currentTarget)); }} style={{ display: 'grid', gap: '20px' }}>
          <label style={{ display: 'grid', gap: '8px', color: 'var(--app-purple)' }}>Phone number
            <input name="phone" defaultValue={user.phone} placeholder="+1 9289 982 928" style={{ padding: '16px', borderRadius: '8px', border: '1px solid #111', background: 'transparent' }} />
          </label>
          <label style={{ display: 'grid', gap: '8px', color: 'var(--app-purple)' }}>Country
            <input name="country" defaultValue={user.country} placeholder="United States" style={{ padding: '16px', borderRadius: '8px', border: '1px solid #111', background: 'transparent' }} />
          </label>
          <button className="primary-btn" style={{ minHeight: '56px', borderRadius: '8px', fontWeight: 'bold' }}>Save Profile</button>
        </form>
      </section>

      <section className="profile-stats" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '32px' }}>
        <article style={{ border: '1px solid #111', borderRadius: '12px', padding: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <strong style={{ fontSize: '1.5rem', color: '#b01834' }}>{purchases.length}</strong>
          <span style={{ fontSize: '0.9rem', color: 'var(--ink)' }}>Purchases</span>
        </article>
        <article style={{ border: '1px solid #111', borderRadius: '12px', padding: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <strong style={{ fontSize: '1.5rem', color: '#b01834' }}>{Object.keys(progress).length}</strong>
          <span style={{ fontSize: '0.9rem', color: 'var(--ink)' }}>Saved chapters</span>
        </article>
      </section>

      <section className="profile-share" style={{ textAlign: 'center', display: 'grid', gap: '16px', marginBottom: '32px' }}>
        <p style={{ margin: 0, color: 'var(--ink)', fontSize: '0.95rem' }}>Help more people to read these book by sharing out this webapp with your friends</p>
        <button className="ghost-btn" onClick={onShareApp} style={{ borderColor: 'var(--app-purple)', color: 'var(--app-purple)', fontWeight: 'bold' }}>Share WebApp Link</button>
      </section>

      <section className="profile-install" style={{ textAlign: 'center' }}>
        <button onClick={onInstall} style={{ background: 'transparent', border: 'none', color: 'var(--app-purple)', fontWeight: 'bold', fontSize: '1rem', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
          Install icon on Device
        </button>
      </section>
    </div>
  );
}

function AdminGate({
  admin,
  twoFactorPending,
  books,
  posts,
  purchases,
  gifts,
  onLogin,
  onVerifyTwoFactor,
  onLogout,
  onModeratePost,
  onAdminReply,
  onRefresh
}) {
  if (!admin) {
    return (
      <div className="content-stack">
        <section className="admin-login-panel">
          <p className="eyebrow">Admin backend</p>
          <h1>{twoFactorPending ? "Authentication Code" : "Admin Login"}</h1>
          {twoFactorPending ? (
            <form onSubmit={(event) => { event.preventDefault(); onVerifyTwoFactor(new FormData(event.currentTarget)); }} className="form-grid">
              <p>Enter the six-digit code sent to the admin email. It expires in ten minutes.</p>
              <label>Authentication code<input name="code" inputMode="numeric" pattern="[0-9]{6}" maxLength={6} autoComplete="one-time-code" required /></label>
              <button className="primary-btn">Verify and Open Dashboard</button>
              <button className="ghost-btn" type="button" onClick={onLogout}>Cancel</button>
            </form>
          ) : (
            <form onSubmit={(event) => { event.preventDefault(); onLogin(new FormData(event.currentTarget)); }} className="form-grid">
              <label>Email<input name="email" type="email" placeholder="admin@example.com" autoComplete="email" required /></label>
              <label>Password<input name="password" type="password" placeholder="Admin password" autoComplete="current-password" required /></label>
              <button className="primary-btn">Continue</button>
            </form>
          )}
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
      onRefresh={onRefresh}
    />
  );
}

function AdminView({ admin, books, posts, purchases, gifts, onLogout, onModeratePost, onAdminReply, onRefresh }) {
  const revenue = purchases.reduce((sum, purchase) => sum + Number(purchase.amount || 0), 0);
  const [selectedBookId, setSelectedBookId] = useState(books[0]?.id || "");
  const [selectedSectionId, setSelectedSectionId] = useState("");

  useEffect(() => {
    if (selectedBookId) {
      const bk = books.find((b) => b.id === selectedBookId);
      if (bk?.sections?.length) {
        setSelectedSectionId((prev) => {
          const exists = bk.sections.some((s) => s.id === prev);
          return exists ? prev : bk.sections[0].id;
        });
      } else {
        setSelectedSectionId("");
      }
    } else {
      setSelectedSectionId("");
    }
  }, [selectedBookId, books]);

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
        {books.map((book) => (
          <div key={book.id} style={{ borderBottom: "1px solid rgba(128,105,90,0.1)", padding: "8px 0" }}>
            <strong>{book.subtitle}: {book.title}</strong> · {usdCurrency(book.usdPrice || 0)} ({ngnCurrency(book.price)}) · {book.status}
            {book.sections && book.sections.map((sec) => (
              <div key={sec.id} style={{ paddingLeft: "20px", fontSize: "0.9rem", color: "var(--muted)" }}>
                - Section: {sec.title} ({sec.chapters?.length || 0} chapters)
              </div>
            ))}
          </div>
        ))}
      </section>

      <section className="admin-panel" style={{ display: "grid", gap: "20px" }}>
        <h2>Book Management Panel</h2>
        
        {/* Create Book Form */}
        <form onSubmit={async (e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          const payload = {
            title: fd.get("title"),
            subtitle: fd.get("subtitle"),
            author: fd.get("author"),
            cover: fd.get("cover"),
            price: Number(fd.get("price") || 0),
            usdPrice: Number(fd.get("usdPrice") || 0),
            status: fd.get("status"),
            preview: fd.get("preview") === "true",
            blurb: fd.get("blurb")
          };
          try {
            const res = await fetch("/api/admin/books", {
              method: "POST",
              headers: { "content-type": "application/json" },
              body: JSON.stringify(payload)
            });
            const data = await res.json();
            if (data.ok) {
              e.target.reset();
              onRefresh();
            } else {
              alert(data.error);
            }
          } catch (err) {
            console.error(err);
          }
        }} className="form-grid" style={{ border: "1px solid rgba(128,105,90,0.16)", padding: "16px", borderRadius: "8px" }}>
          <h3>Create Book</h3>
          <div className="two-col">
            <label>Title<input name="title" placeholder="e.g. Disciples of the Inverted Cross" required /></label>
            <label>Subtitle<input name="subtitle" placeholder="e.g. Book One: The Formation" /></label>
            <label>Author<input name="author" placeholder="e.g. BrandZilla Technologies" /></label>
            <label>Cover URL<input name="cover" placeholder="e.g. /assets/books/disciples-inverted-cross.jpeg" /></label>
            <label>Price (NGN)<input name="price" type="number" placeholder="4500" /></label>
            <label>USD Price<input name="usdPrice" type="number" step="0.01" placeholder="2.59" /></label>
            <label>Status
              <select name="status">
                <option value="Published">Published</option>
                <option value="Draft">Draft</option>
                <option value="Hidden">Hidden</option>
              </select>
            </label>
            <label style={{ display: "flex", alignItems: "center", gap: "8px", flexDirection: "row", marginTop: "24px" }}>
              <input name="preview" type="checkbox" value="true" />
              <span>Available as Preview</span>
            </label>
          </div>
          <label>Blurb<textarea name="blurb" placeholder="Book description..." style={{ minHeight: "80px" }} /></label>
          <button className="primary-btn" style={{ justifySelf: "start" }}>Save Book</button>
        </form>

        {/* Create Section Form */}
        <form onSubmit={async (e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          const bookId = fd.get("bookId");
          const payload = {
            title: fd.get("title"),
            subtitle: fd.get("subtitle"),
            price: Number(fd.get("price") || 0),
            order: Number(fd.get("order") || 1),
            tts: fd.get("tts") === "true",
            voice: fd.get("voice")
          };
          try {
            const res = await fetch(`/api/admin/books/${bookId}/sections`, {
              method: "POST",
              headers: { "content-type": "application/json" },
              body: JSON.stringify(payload)
            });
            const data = await res.json();
            if (data.ok) {
              e.target.reset();
              onRefresh();
            } else {
              alert(data.error);
            }
          } catch (err) {
            console.error(err);
          }
        }} className="form-grid" style={{ border: "1px solid rgba(128,105,90,0.16)", padding: "16px", borderRadius: "8px" }}>
          <h3>Create Section</h3>
          <div className="two-col">
            <label>Select Book
              <select name="bookId" required>
                {books.map(b => <option key={b.id} value={b.id}>{b.subtitle}: {b.title}</option>)}
              </select>
            </label>
            <label>Section Title<input name="title" placeholder="e.g. Book 1 – The Formation" required /></label>
            <label>Section Subtitle<input name="subtitle" placeholder="e.g. by Ikenna Obiajulu" /></label>
            <label>Price (NGN)<input name="price" type="number" placeholder="0" /></label>
            <label>Order<input name="order" type="number" placeholder="1" /></label>
            <label>Voice
              <select name="voice">
                <option value="Female">Female</option>
                <option value="Male">Male</option>
              </select>
            </label>
            <label style={{ display: "flex", alignItems: "center", gap: "8px", flexDirection: "row", marginTop: "24px" }}>
              <input name="tts" type="checkbox" value="true" defaultChecked />
              <span>Enable TTS</span>
            </label>
          </div>
          <button className="primary-btn" style={{ justifySelf: "start" }}>Save Section</button>
        </form>

        {/* Create Chapter Form */}
        <form onSubmit={async (e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          const sectionId = fd.get("sectionId");
          const payload = {
            title: fd.get("title"),
            subtitle: fd.get("subtitle"),
            content: fd.get("content"),
            chapterNumber: Number(fd.get("chapterNumber") || 1),
            order: Number(fd.get("order") || 1),
            isPreview: fd.get("isPreview") === "true",
            status: fd.get("status")
          };
          try {
            const res = await fetch(`/api/admin/sections/${sectionId}/chapters`, {
              method: "POST",
              headers: { "content-type": "application/json" },
              body: JSON.stringify(payload)
            });
            const data = await res.json();
            if (data.ok) {
              e.target.reset();
              onRefresh();
            } else {
              alert(data.error);
            }
          } catch (err) {
            console.error(err);
          }
        }} className="form-grid" style={{ border: "1px solid rgba(128,105,90,0.16)", padding: "16px", borderRadius: "8px" }}>
          <h3>Create Chapter</h3>
          <div className="two-col">
            <label>Select Book
              <select value={selectedBookId} onChange={(e) => {
                setSelectedBookId(e.target.value);
              }} required>
                <option value="" disabled>-- Choose Book --</option>
                {books.map(b => <option key={b.id} value={b.id}>{b.subtitle}: {b.title}</option>)}
              </select>
            </label>
            <label>Select Section
              <select name="sectionId" value={selectedSectionId} onChange={(e) => setSelectedSectionId(e.target.value)} required>
                <option value="" disabled>-- Choose Section --</option>
                {(books.find(b => b.id === selectedBookId)?.sections || []).map(s => (
                  <option key={s.id} value={s.id}>{s.title}</option>
                ))}
              </select>
            </label>
            <label>Chapter Title<input name="title" placeholder="e.g. Chapter One" required /></label>
            <label>Chapter Subtitle<input name="subtitle" placeholder="e.g. A Sign in the Dust" /></label>
            <label>Chapter Number<input name="chapterNumber" type="number" placeholder="1" /></label>
            <label>Order<input name="order" type="number" placeholder="1" /></label>
            <label>Status
              <select name="status">
                <option value="Published">Published</option>
                <option value="Draft">Draft</option>
              </select>
            </label>
            <label style={{ display: "flex", alignItems: "center", gap: "8px", flexDirection: "row", marginTop: "24px" }}>
              <input name="isPreview" type="checkbox" value="true" />
              <span>Is Free Preview</span>
            </label>
          </div>
          <label>Content (Double-newline separated paragraphs)<textarea name="content" placeholder="Type or paste paragraphs separated by empty lines..." required style={{ minHeight: "150px" }} /></label>
          <button className="primary-btn" style={{ justifySelf: "start" }}>Save Chapter</button>
        </form>
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
