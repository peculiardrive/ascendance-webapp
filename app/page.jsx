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
  ["community", "Community", "community"],
  ["books", "Store", "store"],
  ["home", "Home", "home"],
  ["notices", "Gift", "gift"],
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
    community: (
      <>
        <circle cx="12" cy="7" r="4" />
        <path d="M6 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" />
        <circle cx="6" cy="11" r="3" />
        <path d="M2 21v-1a3 3 0 0 1 3-3h1" />
        <circle cx="18" cy="11" r="3" />
        <path d="M18 17h1a3 3 0 0 1 3 3v1" />
      </>
    ),
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
    gift: (
      <>
        <path d="M20 12v10H4V12" />
        <path d="M2 7h20v5H2z" />
        <line x1="12" y1="22" x2="12" y2="7" />
        <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" />
        <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" />
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

function InfoIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.6 }}>
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  );
}

export default function Home() {
  const [ready, setReady] = useState(false);
  const [splashFade, setSplashFade] = useState(false);
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
  const [isReadingTtsPlaying, setIsReadingTtsPlaying] = useState(false); // Reading page TTS
  const [currentTtsParaIndex, setCurrentTtsParaIndex] = useState(-1);
  const [readerSettings, setReaderSettings] = useState({
    font: "Georgia",
    size: 19,
    line: 1.72,
    theme: "light",
    align: "left",
    scrollSpeed: 2,
    autoScrollEnabled: false
  });
  const autoScrollRef = useRef(null);

  const chapters = useMemo(() => flattenChapters(books), [books]);
  const activeChapter = chapters.find((item) => item.chapter.id === activeChapterId) || chapters[0];
  const isOnboarded = user?.onboardingStep === "done";

  // Reader-facing views always show only active (non-deleted) content,
  // even when the admin session has loaded includeDeleted=true books.
  const readerBooks = useMemo(() =>
    books
      .filter(b => !b.deleted)
      .map(b => ({
        ...b,
        sections: (b.sections || [])
          .filter(s => !s.deleted)
          .map(s => ({ ...s, chapters: (s.chapters || []).filter(c => !c.deleted) }))
      })),
    [books]
  );

  useEffect(() => {
    let active = true;
    async function bootstrap() {
      try {
        const onAdminRoute = window.location.pathname.startsWith("/admin");
        setAdminRoute(onAdminRoute);
        if (typeof window !== "undefined") {
          window.__confirmBypass = new URLSearchParams(window.location.search).get("confirmBypass") === "true";
        }
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
          setSplashFade(true);
          setSplashDone(true);
          setView(previewView);
          return;
        }

        let savedView = "home";
        let savedChapter = null;
        try {
          localStorage.removeItem("ascendance_next_user");
          localStorage.removeItem("ascendance_next_admin");
          savedView = localStorage.getItem(LAST_VIEW_KEY) || "home";
          savedChapter = localStorage.getItem(LAST_CHAPTER_KEY);
        } catch (e) {
          console.warn("localStorage access blocked", e);
        }
        if (savedChapter) setActiveChapterId(savedChapter);

        try {
          const response = await fetch("/api/auth/session", { credentials: "same-origin" });
          const data = await response.json();
          if (!active) return;
          setUser(data.user || null);
          setAdmin(data.admin || null);
          setAdminTwoFactorPending(Boolean(data.adminChallengePending && !data.admin));
          await refreshState(Boolean(data.admin));
          if (!active) return;
          setReady(true);
          const onAdminRoute = window.location.pathname.startsWith("/admin");
          const savedView = localStorage.getItem(LAST_VIEW_KEY) || "home";

          window.setTimeout(() => {
            setSplashFade(true);
            if (onAdminRoute) setView("admin");
            else if (data.user?.onboardingStep === "done") setView(savedView);
            else setShowTrailer(true);

            window.setTimeout(() => {
              setSplashDone(true);
            }, 520);
          }, 450);
        } catch (error) {
          console.error("Auth session fetch failed:", error);
          if (!active) return;
          setReady(true);
          setSplashFade(true);
          setSplashDone(true);
          setShowTrailer(true);
        }
      } catch (fatalError) {
        console.error("Fatal bootstrap error:", fatalError);
        if (!active) return;
        setReady(true);
        setSplashFade(true);
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
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setIsReadingTtsPlaying(false);
    setCurrentTtsParaIndex(-1);
  }, [activeChapterId, view]);

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

  async function refreshState(includeDeleted = false) {
    const booksUrl = includeDeleted ? "/api/books?includeDeleted=true" : "/api/books";
    const [booksResponse, postsResponse, stateResponse] = await Promise.all([
      fetch(booksUrl),
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

  async function requestPasswordReset(formData) {
    const response = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: formData.get("email") })
    });
    const data = await response.json();
    if (!data.ok) return notify(data.error);
    notify("If the account exists, a recovery code has been sent.");
    return true; // Used by AuthView to proceed
  }

  async function resetPassword(formData) {
    const response = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        email: formData.get("email"),
        code: formData.get("code"),
        newPassword: formData.get("newPassword")
      })
    });
    const data = await response.json();
    if (!data.ok) return notify(data.error);
    setUser(data.user);
    notify("Password successfully reset. Welcome back.");
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
        username: formData.get("username") || user?.username,
        country: formData.get("country") || user.country,
        fullName: formData.get("fullName") || user?.fullName
      })
    });
    const data = await response.json();
    if (!data.ok) return notify(data.error);
    setUser(data.user);
    notify("Profile saved.");
  }

  async function changePassword(formData) {
    const currentPassword = formData.get("currentPassword");
    const newPassword = formData.get("newPassword");
    const confirmPassword = formData.get("confirmPassword");

    if (newPassword !== confirmPassword) {
      return notify("New passwords do not match.");
    }

    const response = await fetch("/api/users/me/password", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ currentPassword, newPassword })
    });
    const data = await response.json();
    if (!data.ok) return notify(data.error);
    notify("Password updated successfully.");
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
    if (!ownsBook(user?.id, purchases, "book-1")) {
      return notify("You must purchase Book One or the Trilogy before you can send a gift.");
    }
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

  async function redeemGift(formData) {
    const code = String(formData.get("accessCode") || "").toUpperCase().trim();
    if (!code) return notify("Access code is required.");
    
    notify("Validating gift code...");
    try {
      const response = await fetch("/api/gifts/redeem", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ accessCode: code })
      });
      const data = await response.json();
      if (!data.ok) return notify(data.error);
      
      notify("Trilogy successfully unlocked! Happy reading.");
      await refreshState();
    } catch (e) {
      console.error(e);
      notify("Failed to redeem gift code.");
    }
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
    
    // Bypass 2FA
    setAdmin(data.admin);
    setAdminTwoFactorPending(false);
    notify("Admin login successful.");
    await refreshState(true);
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
    await refreshState(true);
  }

  async function adminLogout() {
    await fetch("/api/admin/logout", { method: "POST" });
    setAdmin(null);
    setAdminTwoFactorPending(false);
    await refreshState(false);
    notify("Admin logged out.");
  }

  async function readerLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    setView("auth");
    await refreshState();
  }

  useEffect(() => {
    if (readerSettings.autoScrollEnabled) {
      if (autoScrollRef.current) {
        clearInterval(autoScrollRef.current);
      }
      autoScrollRef.current = setInterval(() => {
        const el = document.querySelector(".reader-shell");
        if (el) {
          el.scrollBy({ top: readerSettings.scrollSpeed || 2, behavior: "auto" });
        }
      }, 40);
    } else {
      if (autoScrollRef.current) {
        clearInterval(autoScrollRef.current);
        autoScrollRef.current = null;
      }
    }
    return () => {
      if (autoScrollRef.current) {
        clearInterval(autoScrollRef.current);
      }
    };
  }, [readerSettings.scrollSpeed, readerSettings.autoScrollEnabled]);

  function toggleAutoScroll() {
    setReaderSettings(prev => {
      const nextEnabled = !prev.autoScrollEnabled;
      notify(nextEnabled ? "Auto-scroll started." : "Auto-scroll paused.");
      return { ...prev, autoScrollEnabled: nextEnabled };
    });
  }

  /**
   * Picks the best available browser voice.
   * Priority: Neural/Online/Natural > Enhanced/Premium > Google > Microsoft > any English.
   * Respects preferredGender ("Male" | "Female") stored on each section.
   */
  function getBestVoice(preferredGender) {
    const voices = window.speechSynthesis.getVoices();
    const english = voices.filter(v => v.lang.startsWith("en"));
    if (!english.length) return null;

    const gender = (preferredGender || "female").toLowerCase();

    // Female-leaning name hints
    const femaleHints = ["female", "aria", "jenny", "nova", "zira", "hazel", "susan", "samantha", "emily", "kate", "natasha", "moira", "tessa", "fiona"];
    // Male-leaning name hints
    const maleHints   = ["male", "guy", "david", "mark", "daniel", "james", "alex", "fred", "rishi", "oliver", "arthur"];

    function score(v) {
      let s = 0;
      const n = v.name.toLowerCase();
      // Quality tier — neural/online voices sound most natural
      if (n.includes("online") || n.includes("neural") || n.includes("natural")) s += 120;
      if (n.includes("enhanced") || n.includes("premium"))                       s += 60;
      if (n.includes("google"))                                                   s += 35;
      if (n.includes("microsoft"))                                                s += 25;
      // Gender match
      const hints = gender === "female" ? femaleHints : maleHints;
      if (hints.some(h => n.includes(h)))                                         s += 50;
      // Prefer British English for storytelling warmth
      if (v.lang === "en-GB")                                                     s += 12;
      if (v.lang === "en-US")                                                     s += 6;
      return s;
    }

    return english.slice().sort((a, b) => score(b) - score(a))[0];
  }

  // Pre-warm SpeechSynthesis voices early to avoid cold-start delays
  useEffect(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.getVoices();
      const handleVoices = () => window.speechSynthesis.getVoices();
      window.speechSynthesis.addEventListener("voiceschanged", handleVoices);
      return () => {
        window.speechSynthesis.removeEventListener("voiceschanged", handleVoices);
      };
    }
  }, []);

  // Extract clean paragraphs for chunk-by-chunk speech synthesis
  const activeChapterParagraphs = useMemo(() => {
    if (!activeChapter?.chapter?.content) return [];
    const content = activeChapter.chapter.content;
    const arr = Array.isArray(content) ? content : [content];
    return arr.map(p => {
      return String(p || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    }).filter(Boolean);
  }, [activeChapter]);

  // Use a mutable state ref to ensure the async speech callbacks (onend, onerror)
  // always reference the correct dynamic state variables without React closure staleness.
  const ttsStateRef = useRef({ paragraphs: [], index: -1, playing: false });
  useEffect(() => {
    ttsStateRef.current.paragraphs = activeChapterParagraphs;
  }, [activeChapterParagraphs]);

  useEffect(() => {
    ttsStateRef.current.playing = isReadingTtsPlaying;
    ttsStateRef.current.index = currentTtsParaIndex;
  }, [isReadingTtsPlaying, currentTtsParaIndex]);

  function speakParagraph(index) {
    if (!("speechSynthesis" in window)) return;
    const paras = ttsStateRef.current.paragraphs;
    
    if (index < 0 || index >= paras.length) {
      console.log("Chunk TTS finished speaking all paragraphs in chapter.");
      setIsReadingTtsPlaying(false);
      setCurrentTtsParaIndex(-1);
      return;
    }

    console.log(`TTS Chunk Player: speaking paragraph index ${index} / ${paras.length}`);
    window.speechSynthesis.cancel(); // Abort previous speech segment cleanly

    const text = paras[index];
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    utterance.pitch = 1;

    const preferredGender = activeChapter?.section?.voice || "Female";
    const voices = window.speechSynthesis.getVoices();
    if (voices.length) {
      const best = getBestVoice(preferredGender);
      if (best) utterance.voice = best;
    }

    utterance.onstart = () => {
      console.log(`Speech chunk ${index} started`);
      setCurrentTtsParaIndex(index);
    };

    utterance.onend = () => {
      console.log(`Speech chunk ${index} ended`);
      if (ttsStateRef.current.playing && ttsStateRef.current.index === index) {
        speakParagraph(index + 1);
      }
    };

    utterance.onerror = (err) => {
      console.error(`Speech chunk ${index} error:`, err);
      if (err.error !== "interrupted") {
        setIsReadingTtsPlaying(false);
        setCurrentTtsParaIndex(-1);
      }
    };

    window.speechSynthesis.speak(utterance);
  }

  function speakActiveChapter() {
    console.log("speakActiveChapter called. Playing:", isReadingTtsPlaying, "Current Index:", currentTtsParaIndex);
    if (!("speechSynthesis" in window)) {
      return notify("Text-to-speech is not supported here.");
    }
    
    if (isReadingTtsPlaying) {
      console.log("Cancelling text-to-speech chunks");
      window.speechSynthesis.cancel();
      setIsReadingTtsPlaying(false);
      return;
    }

    if (activeChapterParagraphs.length === 0) {
      console.warn("No paragraphs extracted for speech");
      return notify("No content to read.");
    }

    const startIdx = currentTtsParaIndex >= 0 ? currentTtsParaIndex : 0;
    console.log(`Starting chunked playback from index: ${startIdx}`);
    setIsReadingTtsPlaying(true);
    speakParagraph(startIdx);
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
          onRefresh={() => refreshState(true)}
        />
        <Toast message={toast} />
      </>
    );
  }

  return (
    <>
      {!splashDone ? <Splash hidden={splashFade} /> : null}
      {showTrailer && (!user || !isOnboarded) ? (
        <TrailerIntro onEnter={(shouldPlay) => { setAutoplayAudio(shouldPlay); setShowTrailer(false); setView("auth"); }} />
      ) : !user || !isOnboarded ? (
        <AuthView autoplay={autoplayAudio} user={user} onSignup={signup} onLogin={login} onVerify={verifyEmail} onResendCode={resendVerificationCode} onProfile={updateProfile} onRequestPasswordReset={requestPasswordReset} onResetPassword={resetPassword} />
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
              books={readerBooks}
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
            <BooksView books={readerBooks} purchases={purchases} user={user} progress={progress} onRead={openChapter} onPurchase={purchase} />
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
              isTtsPlaying={isReadingTtsPlaying}
              currentTtsParaIndex={currentTtsParaIndex}
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
          {view === "notices" && <NoticesView gifts={gifts} onGift={sendGift} onRedeem={redeemGift} />}
          {view === "profile" && (
            <ProfileView
              user={user}
              progress={progress}
              purchases={purchases}
              gifts={gifts}
              onProfile={updateProfile}
              onChangePassword={changePassword}
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
        <div className="splash-spacer" />
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
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const videoRef = useRef(null);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.muted = false;
      setIsMuted(false);
      videoRef.current.play().catch(err => console.log(err));
      setIsPlaying(true);
    }
  };

  const toggleMute = (e) => {
    e.stopPropagation();
    if (!videoRef.current) return;
    const newMute = !isMuted;
    videoRef.current.muted = newMute;
    setIsMuted(newMute);
  };

  return (
    <main className="trailer-page">
      <section className="trailer-stage" aria-label="Ascendance trailer stage" onClick={togglePlay} style={{ cursor: "pointer" }}>
        <video
          ref={videoRef}
          className={`trailer-video ${videoReady ? "is-ready" : ""}`}
          autoPlay
          muted={isMuted}
          loop
          playsInline
          poster="/assets/cover-book-1.svg"
          onCanPlay={() => setVideoReady(true)}
          onError={() => setVideoReady(false)}
        >
          <source src="/assets/ascendance-trailer.mp4" type="video/mp4" />
          <source src="/assets/ascendance-trailer.webm" type="video/webm" />
        </video>

        {/* Play Button Overlay */}
        <div className={`trailer-play-overlay ${isPlaying ? "is-playing" : ""}`}>
          <div className="play-btn-circle">
            {isPlaying ? (
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M8 5v14l11-7z"/>
              </svg>
            )}
          </div>
        </div>

        {/* Mute/Unmute Float Button */}
        <button className="trailer-mute-btn" onClick={toggleMute} aria-label={isMuted ? "Unmute" : "Mute"}>
          {isMuted ? (
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM12 4L9.91 6.09 12 8.18V4zm-8 8H6l5 5v-4.18l-5-5H4v4.18zM19 12c0 2.76-1.54 5.14-3.8 6.3l1.42 1.42C19.78 17.84 21 15.07 21 12c0-3.07-1.22-5.84-3.38-7.72l-1.42 1.42C17.46 6.86 19 9.24 19 12zM3.41 1.86L2 3.27 4.73 6H4v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81l2.04 2.04 1.41-1.41L3.41 1.86z"/>
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
            </svg>
          )}
        </button>

        <div className="trailer-copy">
          <div style={{ flex: 1 }} />
          <button className="trailer-login-btn-new" onClick={(e) => { e.stopPropagation(); onEnter(true); }}>Login</button>
        </div>
      </section>
    </main>
  );
}

function AuthView({ autoplay, user, onSignup, onLogin, onVerify, onResendCode, onProfile, onRequestPasswordReset, onResetPassword }) {
  const step = user?.onboardingStep || "signin";
  const [mode, setMode] = useState("login");
  const [resetEmail, setResetEmail] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const changeMode = (newMode) => {
    setMode(newMode);
    setShowPassword(false);
  };

  return (
    <main className="auth-page">
      <section className="auth-panel">
        <img className="auth-logo" src={BRAND_ASSETS.wordmark} alt="Ascendance The Trilogy" />
        <div className="auth-heading">
          <h1>{step === "verify" ? "Confirm Email" : step === "phone" ? "Add Telephone" : step === "profile" ? "Reader Profile" : mode === "login" ? "Login" : mode === "forgot" ? "Reset Password" : mode === "reset" ? "New Password" : "Create Profile"}</h1>
        </div>
        {step === "signin" && (
          <>
            {mode === "signup" ? (
              <form onSubmit={(event) => { event.preventDefault(); onSignup(new FormData(event.currentTarget)); }} className="form-grid new-auth-form">
                <input name="email" type="email" placeholder="Email" autoComplete="email" required />
                <input name="fullName" placeholder="Full name" autoComplete="name" required />
                <div className="password-input-wrapper" style={{ position: 'relative', width: '100%' }}>
                  <input name="password" type={showPassword ? "text" : "password"} placeholder="Password (Min 8 characters)" autoComplete="new-password" minLength={8} required style={{ width: '100%', paddingRight: '52px' }} />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute',
                      right: '16px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: 'var(--brand)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '4px',
                      zIndex: 2,
                    }}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                        <line x1="1" y1="1" x2="23" y2="23"></line>
                      </svg>
                    ) : (
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                        <circle cx="12" cy="12" r="3"></circle>
                      </svg>
                    )}
                  </button>
                </div>
                <button className="auth-alt-link" type="button" onClick={() => changeMode("login")}>Already have an account? Login</button>
                <div className="auth-submit-container">
                  <button className="primary-btn auth-submit-new">Submit</button>
                </div>
              </form>
            ) : mode === "login" ? (
              <form onSubmit={(event) => { event.preventDefault(); onLogin(new FormData(event.currentTarget)); }} className="form-grid new-auth-form">
                <input name="email" type="email" placeholder="Email" autoComplete="email" required />
                <div className="password-input-wrapper" style={{ position: 'relative', width: '100%' }}>
                  <input name="password" type={showPassword ? "text" : "password"} placeholder="Password" autoComplete="current-password" required style={{ width: '100%', paddingRight: '52px' }} />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute',
                      right: '16px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: 'var(--brand)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '4px',
                      zIndex: 2,
                    }}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                        <line x1="1" y1="1" x2="23" y2="23"></line>
                      </svg>
                    ) : (
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                        <circle cx="12" cy="12" r="3"></circle>
                      </svg>
                    )}
                  </button>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0 8px', marginTop: '-8px' }}>
                  <button className="auth-alt-link" style={{ textAlign: 'left' }} type="button" onClick={() => changeMode("forgot")}>Forgot Password?</button>
                  <button className="auth-alt-link" type="button" onClick={() => changeMode("signup")}>Create Profile</button>
                </div>
                <div className="auth-submit-container">
                  <button className="primary-btn auth-submit-new">Submit</button>
                </div>
              </form>
            ) : mode === "forgot" ? (
              <form onSubmit={async (event) => { 
                event.preventDefault(); 
                const formData = new FormData(event.currentTarget);
                const email = formData.get("email");
                const success = await onRequestPasswordReset(formData); 
                if (success) {
                  setResetEmail(email);
                  changeMode("reset");
                }
              }} className="form-grid new-auth-form">
                <p style={{ color: 'var(--muted)', fontSize: '0.9rem', textAlign: 'center', marginBottom: '8px' }}>Enter your email to receive a recovery code.</p>
                <input name="email" type="email" placeholder="Email" autoComplete="email" required />
                <button className="auth-alt-link" type="button" onClick={() => changeMode("login")}>Back to Login</button>
                <div className="auth-submit-container">
                  <button className="primary-btn auth-submit-new">Send Code</button>
                </div>
              </form>
            ) : mode === "reset" ? (
              <form onSubmit={(event) => { event.preventDefault(); onResetPassword(new FormData(event.currentTarget)); }} className="form-grid new-auth-form">
                <p style={{ color: 'var(--muted)', fontSize: '0.9rem', textAlign: 'center', marginBottom: '8px' }}>Enter the 6-digit code sent to your email.</p>
                <input type="hidden" name="email" value={resetEmail} />
                <input name="code" inputMode="numeric" placeholder="6-digit code" maxLength={6} required />
                <div className="password-input-wrapper" style={{ position: 'relative', width: '100%' }}>
                  <input name="newPassword" type={showPassword ? "text" : "password"} placeholder="New Password (Min 8 chars)" minLength={8} required style={{ width: '100%', paddingRight: '52px' }} />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute',
                      right: '16px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: 'var(--brand)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '4px',
                      zIndex: 2,
                    }}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                        <line x1="1" y1="1" x2="23" y2="23"></line>
                      </svg>
                    ) : (
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                        <circle cx="12" cy="12" r="3"></circle>
                      </svg>
                    )}
                  </button>
                </div>
                <button className="auth-alt-link" type="button" onClick={() => changeMode("login")}>Back to Login</button>
                <div className="auth-submit-container">
                  <button className="primary-btn auth-submit-new">Reset Password</button>
                </div>
              </form>
            ) : null}
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
    <div className={`shell ${view === "reader" ? "is-reading" : ""} view-${view}`}>
      <header className="topbar" aria-label="Ascendance">
        <div className="brand-lockup">
          <img src={BRAND_ASSETS.wordmark} alt="Ascendance The Trilogy" />
        </div>
        <nav className="desktop-nav">
          {NAV_TABS.map(([key, label]) => (
            <button key={key} className={`desktop-nav-link ${view === key ? "is-active" : ""}`} onClick={() => setView(key)}>
              {label}
            </button>
          ))}
        </nav>
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
    <div className="leader-strip" role="list" aria-label="Top community contributors" style={{ display: 'flex', flexWrap: 'nowrap', justifyContent: 'safe center', gap: '16px 12px', padding: '0 24px', overflowX: 'auto', overflowY: 'hidden', WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
      {leaders.map((leader, index) => (
        <button className={`leader-chip rank-${index + 1}`} key={`${leader.name}-${leader.points}`} role="listitem" onClick={() => onSelect?.(leader)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', width: '76px', flexShrink: 0, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
          <div className="leader-avatar" aria-hidden="true" style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'var(--app-purple)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem', fontWeight: 'bold', boxShadow: '0 4px 12px rgba(74, 14, 78, 0.2)' }}>
            {leader.avatar || leader.name.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase()}
          </div>
          <div style={{ textAlign: 'center', width: '100%' }}>
            <span style={{ display: 'block', fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--ink)', width: '100%', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{leader.name}</span>
            <span style={{ display: 'inline-block', fontSize: '0.6rem', color: 'var(--muted)', background: 'rgba(0,0,0,0.05)', padding: '1px 4px', borderRadius: '4px', marginTop: '2px', fontWeight: '600', maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{leader.points} Pts {leader.country}</span>
          </div>
        </button>
      ))}
    </div>
  );
}

function TiltCover({ src, alt, className = "" }) {
  const cardRef = useRef(null);

  const handleMouseMove = (e) => {
    const card = cardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = ((centerY - y) / centerY) * 15;
    const rotateY = ((x - centerX) / centerX) * 15;
    
    card.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.03)`;
  };

  const handleMouseLeave = () => {
    const card = cardRef.current;
    if (card) {
      card.style.transform = "rotateX(0deg) rotateY(0deg) scale(1)";
    }
  };

  return (
    <div 
      className="cover-3d-wrap"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <img 
        ref={cardRef} 
        src={src} 
        alt={alt} 
        className={`cover-3d ${className}`} 
      />
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
  const [isAudioPlaying, setIsAudioPlaying] = useState(false); // MP3 FAB on cover
  const [isTtsPlaying, setIsTtsPlaying] = useState(false);     // TTS in Book Summary modal
  const audioRef = useRef(null);
  const ownedBooks = books.filter((book) => ownsBook(user?.id, purchases, book.id));
  const currentBook = ownedBooks.at(-1) || books[0];
  const firstChapter = flattenChapters([currentBook])[0];
  const currentProgress = Object.values(progress).filter((item) => item?.bookId === currentBook.id).at(-1);
  const continueChapter = flattenChapters([currentBook]).find((item) => item.chapter.id === currentProgress?.chapterId) || firstChapter;
  const percent = currentProgress?.percentage || 0;

  const leaders = getCommunityLeaders(posts).slice(0, 5);

  useEffect(() => {
    return () => {
      // Stop MP3 when navigating away
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      // Stop any TTS when navigating away
      if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    };
  }, []);

  // --- Cover FAB: plays the MP3 prologue ---
  function togglePlaySummary() {
    const audio = audioRef.current;
    if (!audio) return;
    if (isAudioPlaying) {
      audio.pause();
      setIsAudioPlaying(false);
    } else {
      if (audio.ended || audio.currentTime >= audio.duration) audio.currentTime = 0;
      audio.play()
        .then(() => setIsAudioPlaying(true))
        .catch(() => setIsAudioPlaying(false));
    }
  }

  function stopAudio() {
    const audio = audioRef.current;
    if (!audio) return;
    audio.pause();
    audio.currentTime = 0;
    setIsAudioPlaying(false);
  }

  // --- Book Summary modal: reads the blurb text with smart TTS voice ---
  function toggleBlurbTts() {
    if (!("speechSynthesis" in window)) return;
    if (isTtsPlaying) {
      window.speechSynthesis.cancel();
      setIsTtsPlaying(false);
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(currentBook.summary || currentBook.blurb);
    utterance.rate  = 0.9;
    utterance.pitch = 1;
    utterance.onend   = () => setIsTtsPlaying(false);
    utterance.onerror = () => setIsTtsPlaying(false);

    const femaleHints = ["female", "aria", "jenny", "nova", "zira", "hazel", "susan", "samantha", "emily", "kate", "natasha", "moira", "tessa", "fiona"];
    function scoreVoice(v) {
      let s = 0;
      const n = v.name.toLowerCase();
      if (n.includes("online") || n.includes("neural") || n.includes("natural")) s += 120;
      if (n.includes("enhanced") || n.includes("premium"))                       s += 60;
      if (n.includes("google"))                                                   s += 35;
      if (n.includes("microsoft"))                                                s += 25;
      if (femaleHints.some(h => n.includes(h)))                                  s += 50;
      if (v.lang === "en-GB") s += 12;
      if (v.lang === "en-US") s += 6;
      return s;
    }

    const voices = window.speechSynthesis.getVoices().filter(v => v.lang.startsWith("en"));
    if (voices.length) {
      const best = voices.slice().sort((a, b) => scoreVoice(b) - scoreVoice(a))[0];
      if (best) utterance.voice = best;
    } else {
      window.speechSynthesis.addEventListener("voiceschanged", () => {
        const updatedVoices = window.speechSynthesis.getVoices();
        console.log(`Speech voices loaded asynchronously: ${updatedVoices.length} available.`);
      }, { once: true });
    }

    window.speechSynthesis.speak(utterance);
    setIsTtsPlaying(true);
  }

  function stopBlurbTts() {
    window.speechSynthesis?.cancel();
    setIsTtsPlaying(false);
  }

  return (
    <div className="home-screen">
      {/* Hidden MP3 audio element — controlled by togglePlaySummary / stopAudio */}
      <audio
        ref={audioRef}
        src="/assets/ascendance-prologue.mp3"
        onEnded={() => setIsAudioPlaying(false)}
        preload="metadata"
      />
      <section className="featured-book" aria-labelledby="featured-book-title">
        <div className="cover-stage">
          <TiltCover src={currentBook.cover} alt={`${currentBook.title} cover`} className="featured-cover" />
          <button className="audio-drama-fab" onClick={togglePlaySummary} aria-label={isAudioPlaying ? "Stop audio" : "Play the Ascendance Trilogy Prologue"}>
            {isAudioPlaying ? (
              <svg viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="4" y="4" width="16" height="16" rx="2" ry="2"></rect>
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
                <path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path>
              </svg>
            )}
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

      <section className="leader-section community-leaders" aria-label="Community leaders" style={{ textStyle: "left", marginTop: "24px", padding: '24px 0' }}>
        <div className="leader-header" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '20px', padding: '0 24px' }}>
          <div className="leader-title-group" style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
            <div style={{ color: '#F45A62', marginTop: '2px' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
            </div>
            <div>
              <h2 style={{ margin: 0, color: "var(--app-purple)", fontSize: "1.25rem", fontWeight: "800", fontFamily: "Inter, sans-serif", letterSpacing: "-0.02em" }}>Community Leaders</h2>
              <p style={{ margin: '4px 0 0', fontSize: "0.85rem", color: "var(--muted)" }}>Readers making the biggest contribution this week</p>
            </div>
          </div>
          <button onClick={onViewLeaderboard} style={{ background: "transparent", border: "none", color: "var(--app-purple)", fontSize: "0.85rem", fontWeight: "bold", cursor: "pointer", padding: 0, whiteSpace: "nowrap", flexShrink: 0 }}>
            View All
          </button>
        </div>
        <LeaderList leaders={leaders} onSelect={onSelectLeader} />
      </section>

      {showSummary && (
        <div className="modal-backdrop" role="presentation" onMouseDown={() => { setShowSummary(false); stopBlurbTts(); }}>
          <div className="modal-card" role="dialog" aria-modal="true" onMouseDown={(e) => e.stopPropagation()} style={{ padding: "24px", display: "grid", gap: "16px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h2 style={{ margin: 0, fontSize: "1.4rem", color: "var(--brand)" }}>Book Summary</h2>
              <button className="modal-close" onClick={() => { setShowSummary(false); stopBlurbTts(); }} style={{ minHeight: "auto", padding: "4px 8px" }}>Close</button>
            </div>
            <h3 style={{ margin: 0, fontSize: "1.1rem" }}>{currentBook.title}</h3>
            <p style={{ margin: 0, color: "var(--ink)", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{currentBook.summary || currentBook.blurb}</p>
            <div style={{ display: "flex", gap: "12px", marginTop: "12px" }}>
              <button className="primary-btn" onClick={toggleBlurbTts} style={{ flex: 1 }}>
                {isTtsPlaying ? "⏸ Pause" : "▶ Listen"}
              </button>
              <button className="ghost-btn" onClick={stopBlurbTts} style={{ flex: 1 }}>
                ⏹ Stop
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
  const owned = ownsBook(user?.id, purchases, book.id);
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
            const state = bookPurchaseState(book, user?.id, purchases);
            const first = flattenChapters([book])[0];
            const latestProgress = Object.values(progress).filter((item) => item?.bookId === book.id).at(-1);
            const continueChapter = flattenChapters([book]).find((item) => item.chapter.id === latestProgress?.chapterId) || first;
            return (
              <>
                <TiltCover src={book.cover} alt={`${book.title} cover`} className="store-cover" />
                <div className="store-book-copy">
                  <h2>{book.title}</h2>
                  <p className="included-books">{BOOK_SECTION_LABELS[book.id]}</p>
                  <p>{book.blurb}</p>
                  <p className={`availability ${state.owned ? "is-owned" : state.requiresPrevious ? "is-disabled" : ""}`}>
                    {state.owned ? "Unlocked and ready to read" : state.requiresPrevious ? `Unlock Book ${book.order - 1} first` : "Available to unlock"}
                  </p>
                  <div className="store-book-footer">
                    <button
                      className={state.owned ? "primary-btn" : "ghost-btn"}
                      disabled={Boolean(state.requiresPrevious)}
                      onClick={() => state.owned ? onRead(continueChapter) : onPurchase(book)}
                    >
                      {state.owned ? "Read" : state.requiresPrevious ? "Locked" : "Unlock"}
                    </button>
                    <ReaderPrice usdAmount={usdBookPrice(book)} />
                  </div>
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

const GLOSSARY_CHARACTERS = [
  // ── CHARACTERS ──────────────────────────────────────────────────────────
  {
    name: "Ikenna Obiajulu",
    role: "Protagonist",
    bio: "The central figure of Disciples of the Inverted Cross. A brilliant young man who defies his father's vow for him to become a priest, joins the fraternity, becomes Hangman, later receives Christ, and swears to destroy the fraternity he helped create.",
    avatar: "I"
  },
  {
    name: "Jehoshaphat / Jshap",
    role: "Protagonist",
    bio: "The new name Ikenna adopts after turning away from the fraternity. It represents his attempt to escape the penalty of his transgression and begin a new life under a changed identity.",
    avatar: "J"
  },
  {
    name: "Sammy Briggs",
    role: "Successor Protagonist",
    bio: "A former disciple of the Inverted Cross and later a fugitive soul searching for redemption. Once known as Lethal Weapon, Sammy becomes a teacher, mentor, and witness to the possibility that corrupted gifts can be redeemed for purpose.",
    avatar: "S"
  },
  {
    name: "Elizabeth / Lizzy",
    role: "Witness Protagonist",
    bio: "Ikenna's love interest and later one of the most important witnesses of the Ascendance story. She carries Ikenna's memory, follows Sammy's trail, investigates Rakiya's paintings, and helps uncover the final revelation.",
    avatar: "L"
  },
  {
    name: "Rakiya / Rachel",
    role: "Remnant Witness",
    bio: "A gifted, formally untrained left-handed artist whose paintings carry prophetic meaning. Her rescue and artwork become central to the mystery of Rhapsodies of the Coming Regent.",
    avatar: "R"
  },
  {
    name: "Bitty / Bitrus Shak",
    role: "Mentor-Bridge",
    bio: "A former fraternity figure and friend connected to Ikenna, Sammy, and Lizzy. His story carries guilt, escape, royal responsibility, and eventual release from the burden of the past.",
    avatar: "B"
  },
  {
    name: "Rev. Joseph Obiajulu",
    role: "Mentor",
    bio: "Ikenna's father, a clergyman whose vow to dedicate Ikenna to God becomes one of the earliest spiritual tensions in the story.",
    avatar: "R"
  },
  {
    name: "Ifeanyi Obiajulu",
    role: "Catalyst",
    bio: "Ikenna's elder brother. He once helped Ikenna leave home, later carries guilt for leading him into Dike's orbit, and must eventually confront both his uncle and his own need for reconciliation.",
    avatar: "I"
  },
  {
    name: "Dike Obiajulu",
    role: "Antagonist",
    bio: "Ifeanyi and Ikenna's uncle. A wealthy, crafty, and dangerous figure whose hidden dealings connect family betrayal, child trafficking, art exploitation, and the deeper darkness behind the trilogy.",
    avatar: "D"
  },
  {
    name: "Ugo Amanze",
    role: "Rival Disciple",
    bio: "A ruthless fraternity figure whose ambition and rivalry help trigger Ikenna's final exposure. His confrontation with Jshap reveals the deadly cost of the Hangman's law and pushes Ikenna toward the sacrifice that defines the Ascendance story.",
    avatar: "U"
  },
  {
    name: "Steel",
    role: "Antagonist",
    bio: "A feared fraternity member whose possessiveness, violence, and bitterness make him a recurring antagonist, especially in relation to Sammy and Lizzy.",
    avatar: "S"
  },
  {
    name: "Legion",
    role: "Antagonist",
    bio: "A young disciple of the fraternity who admires Sammy and is drawn deeper into the cult's violent promise of identity, power, and belonging.",
    avatar: "L"
  },
  {
    name: "Otunba",
    role: "Antagonist",
    bio: "A charismatic politician connected to the fraternity's political machinery. He represents the dangerous alliance between cultism, ambition, election violence, and public power.",
    avatar: "O"
  },
  // ── TRILOGY & WORLD ──────────────────────────────────────────────────────
  {
    name: "Ascendance",
    role: "The Trilogy",
    bio: "The overarching title of the trilogy. It points to rising above darkness, corruption, fear, and broken identity into divine purpose, truth, and restoration.",
    avatar: "A"
  },
  {
    name: "Disciples of the Inverted Cross",
    role: "First Series of the Trilogy",
    bio: "The first part of the Ascendance trilogy. It follows Ikenna Obiajulu's journey from ambition and rebellion into the dark world of a university fraternity, and his eventual vow to destroy what he helped create.",
    avatar: "D"
  },
  {
    name: "Merchants of the Ivory Towers",
    role: "Second Series of the Trilogy",
    bio: "The second part of the trilogy. It follows Sammy Briggs as he flees the fraternity's wrath and begins to discover a deeper system that trades in politics, ambition, influence, and the destinies of gifted young people.",
    avatar: "M"
  },
  {
    name: "Rhapsodies of the Coming Regent",
    role: "Third Series of the Trilogy",
    bio: "The final part of the trilogy. It follows Lizzy's search for truth through Rakiya's prophetic art, Ifeanyi's confrontation with family darkness, and the revelation of the Regent whose coming gives meaning to the entire story.",
    avatar: "R"
  },
  // ── SYSTEMS & MOTIFS ─────────────────────────────────────────────────────
  {
    name: "The Inverted Cross Fraternity",
    role: "World-Building Story Motif",
    bio: "A feared secret university fraternity built around rebellion, power, oath, hierarchy, violence, and distorted spirituality. It becomes the central dark system Ikenna, Sammy, Bitty, and Lizzy must confront.",
    avatar: "F"
  },
  {
    name: "The Cross",
    role: "Story Motif",
    bio: "A central symbol in the trilogy. To the fraternity, the inverted cross represents rebellion and dark allegiance. To the redeemed characters, the upright Cross becomes a symbol of Christ's sacrifice, mercy, deliverance, and return.",
    avatar: "✝"
  },
  {
    name: "The GODs",
    role: "Antagonist System",
    bio: "The hidden ruling powers behind the fraternity. They represent the unseen authorities that preserve the fraternity's covenant, enforce its laws, and manipulate its disciples for darker purposes.",
    avatar: "G"
  },
  {
    name: "The Order",
    role: "Antagonist System",
    bio: "Another name for the organized structure of the Inverted Cross Fraternity, including its hierarchy, rituals, rules, offices, and secret operations.",
    avatar: "O"
  },
  {
    name: "The Testament",
    role: "Symbolic Object",
    bio: "The secret code or spiritual constitution of the Inverted Cross Fraternity. It contains hidden laws, obligations, offices, punishments, and future programs designed to preserve the fraternity's influence.",
    avatar: "T"
  },
  {
    name: "The Program",
    role: "Symbolic Story Element",
    bio: "A hidden operation tied to the fraternity's deeper purpose. It is designed to harvest the gifts, ambitions, talents, and vulnerabilities of young people through politics, influence, fame, education, money, and opportunity.",
    avatar: "P"
  },
  {
    name: "Merchants",
    role: "Story Title",
    bio: "The unseen handlers, patrons, politicians, sponsors, and power brokers who exploit young people's hunger for success, belonging, influence, and fulfilment.",
    avatar: "M"
  },
  {
    name: "Hangman",
    role: "Antagonist System Motif",
    bio: "A high-ranking office in the Inverted Cross Fraternity. The Hangman is connected to ritual authority, violence, and the dark symbolism of the fraternity's law.",
    avatar: "H"
  },
  {
    name: "The Law of the Hangman",
    role: "Antagonist System Motif",
    bio: "A dark rule connected to the Hangman's office. It involves the symbolic 'shedding of fingers' before the mantle can pass to another.",
    avatar: "⚖"
  },
  {
    name: "Fingers of the Hangman",
    role: "Antagonist System Motif",
    bio: "The bronze nails given to a Hangman during ordination. They are called 'fingers' and are tied to the violent obligations of the office.",
    avatar: "F"
  },
  {
    name: "Crucifixion Parade",
    role: "Antagonist System Motif",
    bio: "A violent fraternity operation led by the Hangman. It is one of the darkest distortions of the Cross in the story.",
    avatar: "C"
  },
  {
    name: "Cardinal",
    role: "Antagonist System Motif",
    bio: "A leadership title within the fraternity. It marks rank, command, and influence among the disciples of the Inverted Cross.",
    avatar: "C"
  },
  {
    name: "Guardian Angel",
    role: "Antagonist System Motif",
    bio: "A fraternity role associated with guiding, protecting, and shaping new members. Sammy later recognizes that the leadership skill behind this role can be redeemed for mentoring young people toward purpose.",
    avatar: "G"
  },
  {
    name: "The Key",
    role: "Antagonist System Motif",
    bio: "A mysterious identity connected to Sammy and the fraternity's hidden spiritual system. It points to his role in the larger Program and the danger surrounding his life.",
    avatar: "🔑"
  },
  {
    name: "Matchstick Image",
    role: "Symbolic Object",
    bio: "A symbolic image in Ikenna's memoir linking Ikenna, Bitty, and Sammy. It hints at the hidden connection among the three disciples and their roles in the larger story.",
    avatar: "🔥"
  },
  {
    name: "Morashe Hills",
    role: "Mystic Location",
    bio: "A spiritually significant location tied to fraternity mystery, consecration, and the dark origins of some characters' commitments.",
    avatar: "⛰"
  },
  {
    name: "Katampe Prison",
    role: "Redemption Location",
    bio: "The prison where Ikenna's transformation begins after he encounters the message of Christ and begins to understand grace, guilt, and redemption.",
    avatar: "K"
  },
  {
    name: "The Crucified One",
    role: "Symbolic Title",
    bio: "A title referring to Jesus Christ. Sammy uses it when declaring his new allegiance after turning away from the fraternity.",
    avatar: "✝"
  },
  {
    name: "Prophetic Art",
    role: "Story Motif",
    bio: "Artwork that carries spiritual meaning beyond ordinary visual beauty. Rakiya's paintings become prophetic signs pointing to rescue, judgment, redemption, and the coming Regent.",
    avatar: "🎨"
  },
  {
    name: "The Inversion",
    role: "Story Motif",
    bio: "The distortion of truth, purpose, identity, and the Cross by darkness. To experience the inversion is to have one's gifts, desires, and identity bent toward false power.",
    avatar: "↕"
  },
  {
    name: "The Remnant Generation",
    role: "Story Motif",
    bio: "A phrase pointing to young people whose gifts will not be owned by darkness. It reflects Sammy's growing understanding of his calling to help the wounded, gifted, and vulnerable discover purpose.",
    avatar: "🌱"
  },
];

function ReaderView({ activeChapter, chapters, settings, setSettings, onBack, onAutoScroll, onSpeak, onSave, onRead, onPurchase, purchases, user, onViewNotices, isTtsPlaying, currentTtsParaIndex }) {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [unlockOpen, setUnlockOpen] = useState(false);
  const [glossaryOpen, setGlossaryOpen] = useState(false);
  const [selectedText, setSelectedText] = useState("");
  const [quotePosition, setQuotePosition] = useState(null);
  const [showQuoteModal, setShowQuoteModal] = useState(false);

  useEffect(() => {
    const el = document.querySelector(".reader-shell");
    if (el) {
      el.scrollTop = 0;
    }
  }, [activeChapter]);

  useEffect(() => {
    const handleSelectionChange = () => {
      const selection = window.getSelection();
      const text = selection.toString().trim();
      if (text && text.length > 5 && text.length < 200) {
        try {
          const range = selection.getRangeAt(0);
          const rect = range.getBoundingClientRect();
          if (rect.top !== 0 || rect.left !== 0) {
            setQuotePosition({
              top: rect.top + window.scrollY - 48,
              left: rect.left + window.scrollX + rect.width / 2
            });
            setSelectedText(text);
            return;
          }
        } catch (e) {}
      }
      if (!text) {
        setQuotePosition(null);
      }
    };

    document.addEventListener("selectionchange", handleSelectionChange);
    return () => {
      document.removeEventListener("selectionchange", handleSelectionChange);
    };
  }, []);
  const index = chapters.findIndex((item) => item.chapter.id === activeChapter.chapter.id);
  const prev = chapters[index - 1];
  const next = chapters[index + 1];

  function goNext() {
    if (!next) return;
    const locked = !next.chapter.isPreview && !ownsBook(user?.id, purchases, next.book.id);
    if (locked) {
      setUnlockOpen(true);
      return;
    }
    onRead(next);
  }

  return (
    <div className={`reader-shell ${settings.theme}`}>
      <header className="reader-topbar">
        {/* Single row: [Back] | [TTS · Glossary · Save] | [spacer] */}
        <div className="reader-topbar-row-1">
          <button className="reader-back-btn" onClick={onBack} aria-label="Go back">
            <svg className="back-arrow-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="19" y1="12" x2="5" y2="12"></line>
              <polyline points="12 19 5 12 12 5"></polyline>
            </svg>
          </button>
          <div className="reader-central-controls">
            <button className={`reader-btn tts-btn ${isTtsPlaying ? "is-active" : ""}`} onClick={onSpeak}>
              <span>{isTtsPlaying ? "⏸ Pause" : "TTS"}</span>
            </button>
            <button className="reader-btn glossary-btn" onClick={() => setGlossaryOpen(true)}>
              <span>Glossary</span>
            </button>
            <button className="reader-btn save-btn" onClick={onSave}>
              <span>Save</span>
            </button>
          </div>
          <div className="reader-topbar-spacer" aria-hidden="true" />
        </div>
        {/* Row 2: Book title + chapter info */}
        <div className="reader-topbar-row-2">
          <div className="reader-meta-info">
            <h1>{activeChapter.book.title}</h1>
            <span>Reading: {activeChapter.section.title} – {activeChapter.chapter.title}</span>
          </div>
        </div>
      </header>
      {settingsOpen && (
        <div className="reader-settings-overlay" onClick={() => setSettingsOpen(false)}>
          <aside className="settings-drawer" aria-label="Reading settings" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ margin: 0, fontSize: '1.2rem', fontFamily: 'Georgia, serif' }}>Reader Settings</h2>
              <button onClick={() => setSettingsOpen(false)} style={{ background: 'transparent', border: 'none', color: 'inherit', cursor: 'pointer' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </div>

            <div style={{ display: 'grid', gap: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 'bold' }}>Typography</span>
                <div className="typography-toggle-container">
                  <button onClick={() => setSettings({ ...settings, font: 'Playfair Display' })} className={`font-select-btn ${settings.font === 'Playfair Display' || settings.font === 'Georgia' ? 'is-active' : ''}`} style={{ fontFamily: 'Playfair Display, Georgia, serif' }}>Serif</button>
                  <button onClick={() => setSettings({ ...settings, font: 'Outfit' })} className={`font-select-btn ${settings.font === 'Outfit' || settings.font === 'Inter' ? 'is-active' : ''}`} style={{ fontFamily: 'Outfit, Inter, sans-serif' }}>Sans-serif</button>
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
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                  <button onClick={() => setSettings({ ...settings, theme: 'light' })} style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#ffffff', border: settings.theme === 'light' ? '2px solid var(--app-purple)' : '1px solid #ccc', cursor: 'pointer' }} aria-label="Light" title="Light"></button>
                  <button onClick={() => setSettings({ ...settings, theme: 'sepia' })} style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#f4ecd8', border: settings.theme === 'sepia' ? '2px solid var(--app-purple)' : '1px solid #ccc', cursor: 'pointer' }} aria-label="Sepia" title="Sepia"></button>
                  <button onClick={() => setSettings({ ...settings, theme: 'dark' })} style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#1c1c1e', border: settings.theme === 'dark' ? '2px solid var(--app-purple)' : '1px solid #555', cursor: 'pointer' }} aria-label="Dark" title="Dark"></button>
                  <button onClick={() => setSettings({ ...settings, theme: 'midnight-gold' })} style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#19191c', border: settings.theme === 'midnight-gold' ? '2px solid #c99d42' : '1px solid #555', cursor: 'pointer' }} aria-label="Midnight Gold" title="Midnight Gold"></button>
                  <button onClick={() => setSettings({ ...settings, theme: 'royal-forest' })} style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#14281a', border: settings.theme === 'royal-forest' ? '2px solid #3c5e47' : '1px solid #555', cursor: 'pointer' }} aria-label="Royal Forest" title="Royal Forest"></button>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 'bold' }}>Auto-scroll</span>
                <label style={{ display: 'inline-flex', alignItems: 'center', cursor: 'pointer' }}>
                  <input type="checkbox" checked={settings.autoScrollEnabled || false} onChange={onAutoScroll} className="toggle-switch" />
                </label>
              </div>

              <div>
                <span style={{ fontWeight: 'bold', display: 'block', marginBottom: '12px' }}>Auto-scroll Speed</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <span style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>Slow</span>
                  <input type="range" min="1" max="10" value={settings.scrollSpeed || 2} onChange={(event) => setSettings({ ...settings, scrollSpeed: Number(event.target.value) })} style={{ flex: 1, accentColor: 'var(--app-purple)' }} />
                  <span style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>Fast</span>
                </div>
              </div>
            </div>
          </aside>
        </div>
      )}
      
      <article className="reader-body" style={{ fontFamily: settings.font, fontSize: settings.size, lineHeight: settings.line, textAlign: settings.align, paddingBottom: '100px' }}>
        <p className="eyebrow">{activeChapter.section.title}</p>
        <h2>{activeChapter.chapter.title} {activeChapter.chapter.subtitle ? `— ${activeChapter.chapter.subtitle}` : ""}</h2>
        <div className="chapter-content-html">
          {(Array.isArray(activeChapter.chapter.content) ? activeChapter.chapter.content : [activeChapter.chapter.content]).map((p, idx) => {
            const cleanText = String(p || "").replace(/^<p>/i, "").replace(/<\/p>$/i, "");
            const isActive = isTtsPlaying && idx === currentTtsParaIndex;
            return (
              <p 
                key={idx}
                className={isActive ? "tts-active-paragraph" : ""}
                style={{
                  backgroundColor: isActive ? "rgba(111, 66, 193, 0.15)" : "transparent",
                  transition: "background-color 0.3s ease, padding 0.3s ease",
                  borderRadius: "4px",
                  padding: isActive ? "8px 12px" : "0",
                  margin: "16px 0",
                  boxShadow: isActive ? "0 2px 8px rgba(111, 66, 193, 0.1)" : "none"
                }}
                dangerouslySetInnerHTML={{ __html: cleanText }}
              />
            );
          })}
        </div>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '40px', paddingTop: '20px', borderTop: '1px solid rgba(128,105,90,0.2)' }}>
          <button className="ghost-btn" disabled={!prev} onClick={() => prev && onRead(prev)}>Previous</button>
          <button className="ghost-btn" disabled={!next} onClick={goNext}>Next</button>
        </div>
      </article>

      <div className="reader-bottom-bar">
        <label className="reader-bottom-bar-label">
          Auto-scroll
          <input type="checkbox" checked={settings.autoScrollEnabled || false} onChange={onAutoScroll} className="toggle-switch" />
        </label>
        <button className="reader-bottom-bar-btn" onClick={() => setSettingsOpen(true)}>Aa</button>
      </div>
      {unlockOpen ? <UnlockDialog book={next?.book || activeChapter.book} onClose={() => setUnlockOpen(false)} onPurchase={onPurchase} onViewNotices={onViewNotices} /> : null}

      {/* 3. Glossary Drawer */}
      {glossaryOpen && (
        <div 
          className="reader-glossary-overlay"
          onClick={() => setGlossaryOpen(false)}
        />
      )}
      <aside className={`glossary-drawer ${glossaryOpen ? "is-open" : ""}`} aria-label="Character Glossary">
        <div className="glossary-header">
          <h2>Glossary & Lore</h2>
          <button className="glossary-close" onClick={() => setGlossaryOpen(false)} aria-label="Close glossary">×</button>
        </div>
        <div className="glossary-content">
          {GLOSSARY_CHARACTERS.map((char) => (
            <div className="glossary-card" key={char.name}>
              <div className="glossary-card-top">
                <div className="glossary-avatar-circle">{char.avatar}</div>
                <div className="glossary-card-info">
                  <h3>{char.name}</h3>
                  <span>{char.role}</span>
                </div>
              </div>
              <p>{char.bio}</p>
            </div>
          ))}
        </div>
      </aside>

      {/* 4. Quote Card Sharing Overlay */}
      {quotePosition && (
        <button 
          className="floating-quote-btn"
          style={{ 
            top: `${quotePosition.top}px`, 
            left: `${quotePosition.left}px`,
            transform: 'translate(-50%, -100%)' 
          }}
          onClick={() => {
            setShowQuoteModal(true);
            setQuotePosition(null);
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '4px' }}>
            <circle cx="18" cy="5" r="3" />
            <circle cx="6" cy="12" r="3" />
            <circle cx="18" cy="19" r="3" />
            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
            <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
          </svg>
          Share Quote
        </button>
      )}

      {showQuoteModal && (
        <div className="quote-card-overlay" onMouseDown={() => setShowQuoteModal(false)}>
          <div className="quote-card-box" onMouseDown={(e) => e.stopPropagation()}>
            <div className="quote-card-preview">
              <div className="quote-card-text">
                “{selectedText}”
              </div>
              <div className="quote-card-attribution">
                — {activeChapter.book.title}
              </div>
              <div className="quote-card-watermark">
                Ascendance: The Trilogy
              </div>
            </div>
            <div className="quote-card-actions">
              <button 
                className="ghost-btn" 
                onClick={() => {
                  navigator.clipboard.writeText(`“${selectedText}” — ${activeChapter.book.title} (Ascendance)`).then(() => {
                    alert("Quote copied to clipboard!");
                  });
                }}
              >
                Copy
              </button>
              <button 
                className="primary-btn" 
                onClick={() => {
                  if (navigator.share) {
                    navigator.share({
                      title: "Ascendance Quote",
                      text: `“${selectedText}” — ${activeChapter.book.title}`,
                      url: window.location.origin
                    });
                  } else {
                    alert("Sharing is not supported on this browser. Text copied!");
                    navigator.clipboard.writeText(`“${selectedText}” — ${activeChapter.book.title}`);
                  }
                  setShowQuoteModal(false);
                }}
              >
                Share
              </button>
              <button className="ghost-btn" onClick={() => setShowQuoteModal(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
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
  const [showCommunityInfo, setShowCommunityInfo] = useState(false);

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
  const userPosts = posts.filter((post) => user && post.userId === user?.id);
  const userComments = posts.flatMap((post) => (post.comments || []).filter((comment) => user && (comment.userId === user?.id || comment.user === user?.username)).map((comment) => ({ ...comment, post })));

  async function submitReview(event) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const title = String(data.get("title") || "").trim();
    const review = String(data.get("review") || "").trim();
    const payload = new FormData();
    payload.set("content", `${title}\n${review}`);
    await onPost(payload);
    setComposerOpen(false);
    setShareSuccess({ content: review, username: user?.username || user?.fullName });
  }

  function openLeader(leader) {
    setQuery(leader.name);
    setSurface("feed");
  }

  return (
    <div className="community-screen">
      <header className="community-header" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px 24px', background: 'transparent', position: 'relative' }}>
        {surface !== "feed" && (
          <button className="circle-icon-btn" onClick={() => { setSurface("feed"); setSelectedPost(null); }} aria-label="Back" style={{ background: 'none', border: 'none', color: 'var(--ink)', cursor: 'pointer', padding: '4px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
          </button>
        )}
        <div style={{ flex: 1 }}>
          <h1 style={{ fontFamily: 'Georgia, serif', color: 'var(--app-purple)', margin: 0, fontSize: '1.8rem', textAlign: 'left' }}>
            {surface === "feed" ? "Community" : surface === "notifications" ? "Notifications" : surface === "history" ? "History" : surface === "leaderboard" ? "Leaderboard" : surface === "compose" ? "Write a Review" : surface === "sort" ? "Update Feed" : surface === "review" ? "Reviews" : "Community"}
          </h1>
        </div>
        {surface === "feed" ? (
          <div className="topbar-actions" style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <button onClick={() => setSearchOpen(!searchOpen)} aria-label="Search" style={{ background: 'none', border: 'none', color: 'var(--ink)', cursor: 'pointer', padding: '4px' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
            </button>
            <button onClick={() => setSurface("notifications")} aria-label="Notifications" style={{ background: 'none', border: 'none', color: 'var(--ink)', cursor: 'pointer', padding: '4px' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0"></path></svg>
            </button>
            <button onClick={() => setSurface("history")} aria-label="History" style={{ background: 'none', border: 'none', color: 'var(--ink)', cursor: 'pointer', padding: '4px' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
            </button>
          </div>
        ) : (
          <div className="community-tools" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
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
        <>
          <section className="leader-section community-leaders" aria-label="Community leaders" style={{ padding: '0 24px' }}>
            <div className="leader-header" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '20px' }}>
              <div className="leader-title-group" style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                <div style={{ color: '#F45A62', marginTop: '2px' }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
                </div>
                <div>
                  <h2 style={{ margin: 0, color: "var(--app-purple)", fontSize: "1.25rem", fontWeight: "800", fontFamily: "Inter, sans-serif", letterSpacing: "-0.02em" }}>Community Leaders</h2>
                  <p style={{ margin: '4px 0 0', fontSize: "0.85rem", color: "var(--muted)" }}>Readers making the biggest contribution this week</p>
                </div>
              </div>
              <div style={{ color: 'var(--muted)', opacity: 0.7, cursor: 'pointer' }} onClick={() => setShowCommunityInfo(true)}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>
              </div>
            </div>
            <LeaderList leaders={getCommunityLeaders(posts)} onSelect={() => setSurface("leaderboard")} />
          </section>

          {showCommunityInfo && (
            <div className="modal-backdrop" role="presentation" onMouseDown={() => setShowCommunityInfo(false)}>
              <div className="modal-card" role="dialog" aria-modal="true" onMouseDown={(e) => e.stopPropagation()} style={{ display: "grid", gap: "16px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <h2 style={{ margin: 0, fontSize: "1.3rem", color: "var(--brand)", fontWeight: "bold" }}>Community Leaderboard</h2>
                  <button className="modal-close" onClick={() => setShowCommunityInfo(false)} style={{ minHeight: "auto", padding: "4px 8px" }}>Close</button>
                </div>
                <p style={{ margin: 0, color: "var(--ink)", lineHeight: 1.6, fontSize: "0.95rem" }}>
                  The community leaderboard celebrates readers making the biggest contributions to the discussion this week.
                </p>
                <div style={{ display: "grid", gap: "12px", background: "rgba(0,0,0,0.02)", padding: "16px", borderRadius: "8px", border: "1px solid var(--line)" }}>
                  <strong style={{ fontSize: "0.95rem" }}>How to earn points:</strong>
                  <ul style={{ margin: 0, paddingLeft: "20px", fontSize: "0.9rem", display: "grid", gap: "8px", color: "var(--ink)" }}>
                    <li><strong>Write a review:</strong> +25 points</li>
                    <li><strong>Receive a reply:</strong> +20 points per reply</li>
                    <li><strong>Receive a like:</strong> +10 points per like</li>
                  </ul>
                </div>
                <p style={{ margin: 0, color: "var(--muted)", fontSize: "0.85rem" }}>
                  The leaderboard resets weekly. Keep reading and sharing your thoughts to climb the ranks!
                </p>
                <button className="primary-btn" onClick={() => { setShowCommunityInfo(false); setSurface("leaderboard"); }} style={{ width: "100%" }}>
                  View Leaderboard
                </button>
              </div>
            </div>
          )}

          <div style={{ padding: '0 12px' }}>
            <div className={`feed-toolbar ${searchOpen ? "has-search" : ""}`} style={{ marginTop: '24px', marginBottom: '16px' }}>
              {searchOpen ? <label className="search-field" style={{ flex: 1 }}><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search community" autoFocus style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid rgba(0,0,0,0.1)' }} /></label> : null}
              <div style={{ display: 'flex', justifyContent: 'flex-end', width: searchOpen ? 'auto' : '100%', alignItems: 'center' }}>
                <button onClick={() => setSurface("sort")} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(0,0,0,0.04)', border: 'none', padding: '8px 16px', borderRadius: '100px', color: 'var(--ink)', fontSize: '0.9rem', fontWeight: '600', cursor: 'pointer' }}>
                  {sort === "newest" ? "Newest" : sort === "oldest" ? "Oldest" : sort === "liked" ? "Most Liked" : "Most Replied"}
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                </button>
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
          <button onClick={() => setComposerOpen(true)} aria-label="Write a review" style={{ position: 'fixed', bottom: '80px', right: '24px', width: '56px', height: '56px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--app-purple) 0%, #7e22ce 100%)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', boxShadow: '0 8px 24px rgba(74, 14, 78, 0.3)', cursor: 'pointer', zIndex: 100 }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
          </button>
        </>
      ) : null}

      {surface === "leaderboard" ? (
        <section className="full-leaderboard-screen" style={{ marginTop: '24px', padding: '0 12px' }}>
          <div style={{ marginBottom: '24px' }}>
            <h2 style={{ margin: 0, color: 'var(--app-purple)', fontSize: '1.4rem', fontFamily: 'Georgia, serif' }}>Reader Leaderboard</h2>
            <p style={{ margin: '4px 0 0', color: '#6b7280', fontSize: '0.9rem' }}>Ranked by reviews, likes, and helpful discussion.</p>
          </div>
          <div style={{ display: 'grid', gap: '12px' }}>
            {getCommunityLeaders(posts).map((leader, i) => {
              const colors = [
                { border: '#C29837', bg: '#A67C24', rank: '#A67C24' }, // Gold/Bronze
                { border: '#8A9BA8', bg: '#4A0E4E', rank: '#111' }, // Silver / Purple
                { border: '#CD7F32', bg: '#4A0E4E', rank: '#111' }, // Bronze / Purple
                { border: '#4A0E4E', bg: '#4A0E4E', rank: '#111' }, // Purple / Purple
              ];
              const c = colors[i] || colors[3];
              return (
                <button key={leader.name} onClick={() => openLeader(leader)} style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px', background: 'white', border: 'none', borderLeft: `6px solid ${c.border}`, borderRadius: '8px', width: '100%', textAlign: 'left', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', cursor: 'pointer' }}>
                  <div className="avatar" style={{ width: '40px', height: '40px', borderRadius: '50%', background: c.bg, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '1rem', flexShrink: 0 }}>
                    {leader.avatar || leader.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div style={{ flex: 1 }}>
                    <strong style={{ display: 'block', fontSize: '1.05rem', marginBottom: '2px', color: '#111' }}>{leader.name}</strong>
                    <span style={{ fontSize: '0.85rem', color: '#6b7280', fontWeight: 'bold' }}>{leader.country}</span>
                  </div>
                  <div style={{ color: 'var(--app-purple)', fontWeight: 'bold', fontSize: '1.05rem' }}>
                    {leader.points} Points
                  </div>
                </button>
              );
            })}
          </div>
        </section>
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

      {composerOpen ? (
        <div className="modal-backdrop" role="presentation" onMouseDown={() => setComposerOpen(false)} style={{ animation: 'fadeIn 0.3s ease-out' }}>
          <section className="review-composer" role="dialog" aria-modal="true" onMouseDown={(event) => event.stopPropagation()} style={{ display: 'grid', gap: '20px', position: 'relative' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <h2 style={{ color: 'var(--app-purple)', margin: 0, fontSize: '1.5rem', fontFamily: 'Georgia, serif' }}>Write a Review</h2>
              <button className="circle-icon-btn" onClick={() => setComposerOpen(false)} aria-label="Close" type="button" style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ink)' }}>
                <svg viewBox="0 0 24 24" style={{ width: '24px', height: '24px' }}><path d="M18 6L6 18M6 6l12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </button>
            </div>
            <form id="compose-form" onSubmit={submitReview} style={{ display: 'grid', gap: '20px' }}>
              <label style={{ display: 'grid', gap: '8px', color: 'var(--app-purple)', fontWeight: 'bold' }}>Title
                <input name="title" maxLength={30} placeholder="What is the headline?" required style={{ padding: '16px', borderRadius: '8px', border: '1px solid var(--app-line, rgba(0,0,0,0.1))', background: 'transparent', fontSize: '1rem', outline: 'none', color: 'var(--ink)' }} />
              </label>
              <label style={{ display: 'grid', gap: '8px', color: 'var(--app-purple)', fontWeight: 'bold' }}>Review
                <textarea name="review" maxLength={250} placeholder="What is your experience?" required style={{ padding: '16px', borderRadius: '8px', border: '1px solid var(--app-line, rgba(0,0,0,0.1))', background: 'transparent', minHeight: '160px', fontSize: '1rem', resize: 'vertical', outline: 'none', color: 'var(--ink)' }} />
              </label>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '12px' }}>
                <button type="button" onClick={() => setComposerOpen(false)} style={{ padding: '10px 20px', borderRadius: '100px', border: '1px solid var(--app-line, rgba(0,0,0,0.15))', background: 'transparent', color: 'var(--ink)', fontWeight: '600', cursor: 'pointer', fontSize: '0.95rem' }}>Cancel</button>
                <button type="submit" style={{ padding: '10px 24px', borderRadius: '100px', border: 'none', background: 'var(--app-purple)', color: 'white', fontWeight: '600', cursor: 'pointer', fontSize: '0.95rem', boxShadow: '0 4px 12px rgba(74, 14, 78, 0.2)' }}>Publish</button>
              </div>
            </form>
          </section>
        </div>
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
  const liked = post.likedBy?.includes(user?.id);
  const copy = splitPostContent(post.content);
  return (
    <article className={`review-card ${post.pinned ? "is-pinned" : ""}`} style={{ background: 'white', border: '1px solid rgba(0,0,0,0.06)', borderRadius: '16px', boxShadow: '0 2px 12px rgba(0,0,0,0.02)', overflow: 'hidden', marginBottom: '16px' }}>
      <button className="review-card-main" onClick={onOpen} style={{ width: '100%', textAlign: 'left', padding: '20px', background: 'none', border: 'none', cursor: 'pointer' }}>
        <div className="review-author" style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '12px' }}>
          <div className="avatar" style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--app-purple)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '1rem' }}>{post.avatar || post.username?.slice(0, 1) || "A"}</div>
          <div>
            <strong style={{ display: 'block', color: 'var(--ink)', fontSize: '0.95rem' }}>{post.username}</strong>
            <span style={{ color: 'var(--muted)', fontSize: '0.75rem' }}>{post.country} · {new Date(post.createdAt).toLocaleDateString()}</span>
          </div>
        </div>
        <h2 style={{ fontSize: '1.15rem', color: 'var(--app-purple)', margin: '0 0 8px 0', lineHeight: '1.3' }}>{copy.title}</h2>
        <p style={{ fontSize: '0.95rem', color: '#4b5563', lineHeight: '1.6', margin: 0, display: expanded ? 'block' : '-webkit-box', WebkitLineClamp: expanded ? 'unset' : 4, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{copy.body}</p>
      </button>
      <div className="review-actions" style={{ display: 'flex', gap: '24px', padding: '12px 20px', borderTop: '1px solid rgba(0,0,0,0.04)', background: '#fafafa' }}>
        <button onClick={() => onLike(post.id)} aria-label={`${liked ? "Unlike" : "Like"} review`} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', color: liked ? 'var(--danger)' : 'var(--muted)', cursor: 'pointer', fontSize: '0.9rem', fontWeight: '600', padding: 0 }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill={liked ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
          {post.likes || 0}
        </button>
        <button onClick={onOpen} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: '0.9rem', fontWeight: '600', padding: 0 }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
          {post.comments?.length || 0}
        </button>
        <button onClick={() => onShare(post, "native")} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: '0.9rem', fontWeight: '600', padding: 0 }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line></svg>
        </button>
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

function NoticesView({ gifts, onGift, onRedeem }) {
  return (
    <div className="gift-screen">
      <div className="screen-heading">
        <p className="eyebrow">Share the journey</p>
        <h1>Gift & Redeem</h1>
        <p>Send the complete trilogy to a friend, or redeem an access code to unlock your books.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px', marginBottom: '32px' }}>
        {/* Panel 1: Gift Panel */}
        <section className="gift-panel" style={{ gridTemplateColumns: '1fr', gap: '16px', display: 'flex', flexDirection: 'column' }}>
          <h2 style={{ fontSize: '1.25rem', margin: 0, color: 'var(--brand)', fontFamily: 'Georgia, serif' }}>Send a Gift</h2>
          <div className="gift-cover-stack" aria-hidden="true" style={{ margin: '12px 0' }}>
            <img src="/assets/books/disciples-inverted-cross.jpeg" alt="" />
            <img src="/assets/books/merchants-ivory-towers.jpeg" alt="" />
            <img src="/assets/books/rhapsodies-coming-regent.jpeg" alt="" />
          </div>
          <div className="gift-price" style={{ marginBottom: '12px' }}>
            <div><span style={{ fontWeight: 'bold' }}>Ascendance Trilogy gift</span><small>All three books for one reader</small></div>
            <ReaderPrice usdAmount={USD_PRICES.giftTrilogy} />
          </div>
          <form onSubmit={(event) => { event.preventDefault(); onGift(new FormData(event.currentTarget)); event.currentTarget.reset(); }} style={{ display: 'grid', gap: '12px', marginTop: 'auto' }}>
            <label style={{ display: 'grid', gap: '6px', color: 'var(--brand)' }}>Recipient email
              <input name="recipientEmail" type="email" placeholder="friend@example.com" required style={{ padding: '12px', borderRadius: '6px', border: '1px solid var(--app-line)', background: 'transparent' }} />
            </label>
            <button className="primary-btn" style={{ minHeight: '44px', borderRadius: '6px', cursor: 'pointer' }}>Pay and Send Gift</button>
          </form>
        </section>

        {/* Panel 2: Redeem Panel */}
        <section className="gift-panel" style={{ gridTemplateColumns: '1fr', gap: '16px', display: 'flex', flexDirection: 'column' }}>
          <h2 style={{ fontSize: '1.25rem', margin: 0, color: 'var(--brand)', fontFamily: 'Georgia, serif' }}>Redeem Gift Code</h2>
          <p style={{ margin: 0, color: 'var(--ink)', fontSize: '0.9rem', lineHeight: 1.5 }}>
            Have a gift access code? Enter the 8-character code below to unlock the complete Ascendance Trilogy on your account.
          </p>
          <form onSubmit={(event) => { event.preventDefault(); onRedeem(new FormData(event.currentTarget)); event.currentTarget.reset(); }} style={{ display: 'grid', gap: '12px', marginTop: 'auto' }}>
            <label style={{ display: 'grid', gap: '6px', color: 'var(--brand)' }}>Access code
              <input name="accessCode" placeholder="E.g., ABCDEFGH" required style={{ padding: '12px', borderRadius: '6px', border: '1px solid var(--app-line)', background: 'transparent', textTransform: 'uppercase' }} />
            </label>
            <button className="primary-btn" style={{ minHeight: '44px', borderRadius: '6px', background: 'var(--ink)', cursor: 'pointer' }}>Unlock Trilogy</button>
          </form>
        </section>
      </div>

      <section className="gift-history">
        <h2>Gift activity</h2>
        {gifts.length ? gifts.map((gift) => <article className="notice-card" key={gift.id}><div><h3>{gift.recipientEmail}</h3><p>{gift.status}</p></div><strong>{gift.accessCode}</strong></article>) : <div className="empty-state">No gift activity yet.</div>}
      </section>
    </div>
  );
}

function ProfileView({ user, progress, purchases, gifts, onProfile, onChangePassword, onLogout, onShareApp, onInstall, canInstall }) {
  const completed = Object.values(progress).filter((item) => Number(item?.percentage || 0) >= 100).length;
  return (
    <div className="profile-screen" style={{ maxWidth: '800px', margin: '0 auto', padding: '16px', background: 'var(--reader-bg, #fff)', minHeight: '100vh' }}>
      <header className="profile-header" style={{ display: 'flex', alignItems: 'center', marginBottom: '32px' }}>
        <button className="circle-icon-btn" onClick={() => window.history.back()} aria-label="Back" style={{ border: 'none', background: 'transparent' }}>
          <svg viewBox="0 0 24 24" width="24" height="24"><path d="M19 12H5M12 19l-7-7 7-7" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>
        <h1 style={{ fontFamily: 'Georgia, serif', color: 'var(--app-purple)', margin: '0 auto', fontSize: '1.6rem' }}>Profile</h1>
        <div style={{ width: '40px' }}></div>
      </header>

      <section className="profile-form-section" style={{ display: 'grid', gap: '20px', marginBottom: '40px' }}>
        <form onSubmit={(event) => { event.preventDefault(); onProfile(new FormData(event.currentTarget)); }} style={{ display: 'grid', gap: '20px' }}>
          <label style={{ display: 'grid', gap: '8px', color: 'var(--app-purple)' }}>Full Name
            <input name="fullName" defaultValue={user?.fullName || ""} placeholder="Your Name" style={{ padding: '16px', borderRadius: '8px', border: '1px solid #111', background: 'transparent' }} />
          </label>
          <label style={{ display: 'grid', gap: '8px', color: 'var(--app-purple)' }}>Email Address
            <input name="email" defaultValue={user?.email || ""} readOnly style={{ padding: '16px', borderRadius: '8px', border: '1px solid rgba(0,0,0,0.1)', background: 'rgba(0,0,0,0.03)', color: 'rgba(0,0,0,0.5)', cursor: 'not-allowed' }} />
          </label>
          <label style={{ display: 'grid', gap: '8px', color: 'var(--app-purple)' }}>Username
            <input name="username" defaultValue={user?.username || ""} placeholder="@username" style={{ padding: '16px', borderRadius: '8px', border: '1px solid #111', background: 'transparent' }} />
          </label>
          <label style={{ display: 'grid', gap: '8px', color: 'var(--app-purple)' }}>Phone number
            <input name="phone" defaultValue={user?.phone || ""} placeholder="+1 9289 982 928" style={{ padding: '16px', borderRadius: '8px', border: '1px solid #111', background: 'transparent' }} />
          </label>
          <label style={{ display: 'grid', gap: '8px', color: 'var(--app-purple)' }}>Country
            <input name="country" defaultValue={user?.countryCode || ""} placeholder="US" style={{ padding: '16px', borderRadius: '8px', border: '1px solid #111', background: 'transparent' }} />
          </label>
          <button className="primary-btn" style={{ minHeight: '56px', borderRadius: '8px', fontWeight: 'bold' }}>Save Profile</button>
        </form>
      </section>

      <section className="profile-password-section" style={{ display: 'grid', gap: '20px', marginBottom: '40px' }}>
        <h2 style={{ color: 'var(--app-purple)', margin: 0, fontSize: '1.25rem' }}>Change Password</h2>
        <form onSubmit={(event) => { event.preventDefault(); onChangePassword(new FormData(event.currentTarget)); event.currentTarget.reset(); }} style={{ display: 'grid', gap: '20px' }}>
          <label style={{ display: 'grid', gap: '8px', color: 'var(--app-purple)' }}>Current Password
            <input name="currentPassword" type="password" required style={{ padding: '16px', borderRadius: '8px', border: '1px solid #111', background: 'transparent' }} />
          </label>
          <label style={{ display: 'grid', gap: '8px', color: 'var(--app-purple)' }}>New Password
            <input name="newPassword" type="password" required minLength={8} style={{ padding: '16px', borderRadius: '8px', border: '1px solid #111', background: 'transparent' }} />
          </label>
          <label style={{ display: 'grid', gap: '8px', color: 'var(--app-purple)' }}>Confirm New Password
            <input name="confirmPassword" type="password" required minLength={8} style={{ padding: '16px', borderRadius: '8px', border: '1px solid #111', background: 'transparent' }} />
          </label>
          <button className="primary-btn" style={{ minHeight: '56px', borderRadius: '8px', fontWeight: 'bold', background: 'var(--ink)' }}>Update Password</button>
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

      <section className="profile-install" style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '24px', alignItems: 'center' }}>
        <button onClick={onInstall} style={{ background: 'transparent', border: 'none', color: 'var(--app-purple)', fontWeight: 'bold', fontSize: '1rem', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
          Install icon on Device
        </button>

        <div style={{ display: 'flex', gap: '16px' }}>
          <button onClick={onLogout} className="danger-btn" style={{ padding: '8px 16px', borderRadius: '8px' }}>Sign Out</button>
        </div>
      </section>

      <footer className="profile-footer" style={{ marginTop: '48px', paddingBlock: '24px 12px', borderTop: '1px solid rgba(128, 105, 90, 0.15)', textAlign: 'center', display: 'grid', gap: '8px' }}>
        <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--muted)' }}>For support, inquiries or assistance, email us at:</p>
        <a href="mailto:ascendance-trilogy@gmail.com" style={{ fontSize: '1rem', fontWeight: 'bold', color: 'var(--app-purple)', textDecoration: 'none', transition: 'opacity 0.2s' }} className="support-email-link">
          ascendance-trilogy@gmail.com
        </a>
      </footer>
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

function RichTextEditor({ name, defaultValue, placeholder }) {
  const editorRef = useRef(null);
  const inputRef = useRef(null);
  const [html, setHtml] = useState(() => {
    if (!defaultValue) return "";
    if (Array.isArray(defaultValue)) {
      // Content items are already stored as HTML <p> strings - join them directly
      return defaultValue.join("");
    }
    // If it's already an HTML string, just return it. 
    // If it's plain text with newlines, convert to paragraphs.
    if (String(defaultValue).includes("<p>") || String(defaultValue).includes("<br>")) {
      return String(defaultValue);
    }
    return String(defaultValue).split(/\n\s*\n/).map(p => `<p>${p}</p>`).join("");
  });

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== html) {
      editorRef.current.innerHTML = html;
    }
  }, [html]);

  const handleInput = () => {
    if (editorRef.current) {
      inputRef.current.value = editorRef.current.innerHTML.trim();
    }
  };

  const execCommand = (command, value = null) => {
    document.execCommand(command, false, value);
    if (editorRef.current) editorRef.current.focus();
    handleInput();
  };

  return (
    <div className="rich-text-editor" style={{ border: "1px solid rgba(0,0,0,0.1)", borderRadius: "8px", overflow: "hidden", background: "#fff", display: "flex", flexDirection: "column" }}>
      <div className="rte-toolbar" style={{ display: "flex", gap: "4px", padding: "8px", background: "#f9fafb", borderBottom: "1px solid rgba(0,0,0,0.1)", alignItems: "center", flexWrap: "wrap" }}>
        <button type="button" onClick={() => execCommand("bold")} style={{ padding: "4px 8px", background: "none", border: "none", cursor: "pointer", fontWeight: "bold" }}>B</button>
        <button type="button" onClick={() => execCommand("italic")} style={{ padding: "4px 8px", background: "none", border: "none", cursor: "pointer", fontStyle: "italic" }}>I</button>
        <button type="button" onClick={() => execCommand("underline")} style={{ padding: "4px 8px", background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}>U</button>
        <div style={{ width: "1px", height: "16px", background: "rgba(0,0,0,0.1)", margin: "0 4px" }} />
        <button type="button" onClick={() => execCommand("formatBlock", "H1")} style={{ padding: "4px 8px", background: "none", border: "none", cursor: "pointer", fontWeight: "bold" }}>H1</button>
        <button type="button" onClick={() => execCommand("formatBlock", "H2")} style={{ padding: "4px 8px", background: "none", border: "none", cursor: "pointer", fontWeight: "bold" }}>H2</button>
        <button type="button" onClick={() => execCommand("formatBlock", "P")} style={{ padding: "4px 8px", background: "none", border: "none", cursor: "pointer" }}>P</button>
      </div>
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        style={{ minHeight: "240px", padding: "16px", outline: "none", fontFamily: "Georgia, serif", fontSize: "1.1rem", lineHeight: "1.8", cursor: "text" }}
      />
      <input type="hidden" name={name} ref={inputRef} defaultValue={defaultValue} />
    </div>
  );
}


function AdminView({ admin, books, posts, purchases, gifts, onLogout, onModeratePost, onAdminReply, onRefresh }) {
  const [activeTab, setActiveTab] = useState("overview");
  const revenue = purchases.reduce((sum, purchase) => sum + Number(purchase.amount || 0), 0);
  const [editingItem, setEditingItem] = useState(null);
  const [isImporting, setIsImporting] = useState(false);
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  const activeBooks = useMemo(() => books.filter(b => !b.deleted), [books]);
  const deletedBooks = useMemo(() => books.filter(b => b.deleted), [books]);
  
  const deletedSections = useMemo(() => {
    return books.filter(b => !b.deleted).flatMap(b => 
      (b.sections || []).filter(s => s.deleted).map(s => ({ ...s, bookTitle: b.title, bookId: b.id }))
    );
  }, [books]);

  const deletedChapters = useMemo(() => {
    return books.filter(b => !b.deleted).flatMap(b => 
      (b.sections || []).filter(s => !s.deleted).flatMap(s => 
        (s.chapters || []).filter(c => c.deleted).map(c => ({ ...c, sectionTitle: s.title, bookId: b.id, sectionId: s.id }))
      )
    );
  }, [books]);

  const [selectedBookId, setSelectedBookId] = useState("");
  const [selectedSectionId, setSelectedSectionId] = useState("");

  useEffect(() => {
    if (activeBooks.length > 0 && !selectedBookId) {
      setSelectedBookId(activeBooks[0].id);
    }
  }, [activeBooks, selectedBookId]);

  useEffect(() => {
    if (activeTab === "users" && users.length === 0) {
      setLoadingUsers(true);
      fetch("/api/admin/users")
        .then(res => res.json())
        .then(data => {
          if (data.ok) setUsers(data.users || []);
          setLoadingUsers(false);
        })
        .catch(e => {
          console.error("Failed to fetch users", e);
          setLoadingUsers(false);
        });
    }
  }, [activeTab]);

  const handleDelete = async (type, id) => {
    const label = type === 'section' ? 'series' : type;
    const warningText = type === 'book' 
      ? `Are you sure you want to delete this book? This will also soft-delete all series and chapters under it.`
      : type === 'section'
      ? `Are you sure you want to delete this series? This will also soft-delete all chapters under it.`
      : `Are you sure you want to delete this chapter?`;
      
    if (typeof window !== "undefined" && !window.__confirmBypass && !window.confirm(warningText)) return;
    try {
      const endpointMap = {
        book: `/api/admin/books/${id}`,
        section: `/api/admin/sections/${id}`,
        chapter: `/api/admin/chapters/${id}`
      };
      const res = await fetch(endpointMap[type], { method: "DELETE" });
      if (res.ok) { 
        onRefresh(); 
        setEditingItem(null); 
      } else { 
        alert(await res.text()); 
      }
    } catch (e) { 
      console.error(e); 
    }
  };

  const handleRestore = async (type, id) => {
    const label = type === 'section' ? 'series' : type;
    if (typeof window !== "undefined" && !window.__confirmBypass && !window.confirm(`Are you sure you want to restore this ${label}?`)) return;
    try {
      const endpointMap = {
        book: `/api/admin/books/${id}/restore`,
        section: `/api/admin/sections/${id}/restore`,
        chapter: `/api/admin/chapters/${id}/restore`
      };
      const res = await fetch(endpointMap[type], { method: "POST" });
      if (res.ok) {
        onRefresh();
        setEditingItem(null);
      } else {
        alert(await res.text());
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handlePermanentDelete = async (type, id) => {
    const label = type === 'section' ? 'series' : type;
    if (typeof window !== "undefined" && !window.__confirmBypass && !window.confirm(`WARNING: This will permanently delete this ${label} and all its nested content. This action CANNOT be undone. Are you sure you want to proceed?`)) return;
    try {
      const endpointMap = {
        book: `/api/admin/books/${id}?permanent=true`,
        section: `/api/admin/sections/${id}?permanent=true`,
        chapter: `/api/admin/chapters/${id}?permanent=true`
      };
      const res = await fetch(endpointMap[type], { method: "DELETE" });
      if (res.ok) {
        onRefresh();
        setEditingItem(null);
      } else {
        alert(await res.text());
      }
    } catch (e) {
      console.error(e);
    }
  };

  const formatDeletedAt = (isoString) => {
    if (!isoString) return "Unknown date";
    const date = new Date(isoString);
    return date.toLocaleString();
  };

  useEffect(() => {
    if (selectedBookId) {
      const bk = activeBooks.find((b) => b.id === selectedBookId);
      const activeSections = bk?.sections?.filter(s => !s.deleted) || [];
      if (activeSections.length) {
        setSelectedSectionId((prev) => {
          const exists = activeSections.some((s) => s.id === prev);
          return exists ? prev : activeSections[0].id;
        });
      } else {
        setSelectedSectionId("");
      }
    } else {
      setSelectedSectionId("");
    }
  }, [selectedBookId, activeBooks]);

  return (
    <div className="admin-layout" style={{ flexDirection: "column" }}>
      <header className="admin-topbar" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 32px", background: "var(--ink)", color: "var(--bg)", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
          <div>
            <p className="eyebrow" style={{ margin: "0 0 4px 0", color: "rgba(255,255,255,0.5)", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.1em" }}>BrandZilla</p>
            <h2 style={{ margin: 0, color: "white", fontSize: "1.2rem" }}>Ascendance Admin</h2>
          </div>
          <div style={{ display: "flex", gap: "12px", marginLeft: "16px" }}>
            <button className={`admin-nav-btn ${activeTab === "overview" ? "is-active" : ""}`} onClick={() => setActiveTab("overview")} style={{ padding: "8px 16px" }}>Overview</button>
            <button className={`admin-nav-btn ${activeTab === "library" ? "is-active" : ""}`} onClick={() => setActiveTab("library")} style={{ padding: "8px 16px" }}>Library</button>
            <button className={`admin-nav-btn ${activeTab === "community" ? "is-active" : ""}`} onClick={() => setActiveTab("community")} style={{ padding: "8px 16px" }}>Community</button>
            <button className={`admin-nav-btn ${activeTab === "users" ? "is-active" : ""}`} onClick={() => setActiveTab("users")} style={{ padding: "8px 16px" }}>Users</button>
            <button className={`admin-nav-btn ${activeTab === "trash" ? "is-active" : ""}`} onClick={() => setActiveTab("trash")} style={{ padding: "8px 16px" }}>Recycle Bin</button>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <span className="admin-role-badge">{admin.role}</span>
          <span style={{ color: "rgba(255,255,255,0.8)", fontSize: "0.9rem" }}>{admin.name}</span>
          <button className="ghost-btn" onClick={onLogout} style={{ color: "var(--bg)", borderColor: "rgba(255,255,255,0.3)", padding: "6px 12px", minHeight: "auto" }}>Logout</button>
        </div>
      </header>

      <main className="admin-content">
        <div className="admin-header-bar">
          <h1>
            {activeTab === "overview"
              ? "Overview"
              : activeTab === "library"
              ? "Library Management"
              : activeTab === "trash"
              ? "Recycle Bin"
              : activeTab === "users"
              ? "Users Management"
              : "Community Moderation"}
          </h1>
          <button className="ghost-btn" onClick={onRefresh} style={{ background: "white" }}>Refresh Data</button>
        </div>

        {activeTab === "overview" && (
          <div className="admin-tab-pane">
            <div className="grid dashboard-grid" style={{ marginBottom: "40px" }}>
              <article className="stat-card"><strong>{books.length}</strong><span>Books</span></article>
              <article className="stat-card"><strong>{purchases.length}</strong><span>Purchases</span></article>
              <article className="stat-card"><strong>{ngnCurrency(revenue)}</strong><span>Revenue</span></article>
              <article className="stat-card"><strong>{gifts.length}</strong><span>Gifts</span></article>
              <article className="stat-card"><strong>{posts.length}</strong><span>Posts</span></article>
            </div>
            <div className="admin-library-grid">
              <div className="admin-library-card">
                <h2>Revenue (Last 7 Days)</h2>
                {(() => {
                  const last7Days = Array.from({ length: 7 }).map((_, i) => {
                    const d = new Date();
                    d.setDate(d.getDate() - (6 - i));
                    return d.toISOString().split("T")[0];
                  });
                  const revByDate = purchases.reduce((acc, p) => {
                    if (p.paymentStatus !== "Successful") return acc;
                    const date = new Date(p.createdAt || p.paidAt).toISOString().split("T")[0];
                    if (!acc[date]) acc[date] = 0;
                    acc[date] += Number(p.amount || 0);
                    return acc;
                  }, {});
                  const maxRev = Math.max(...last7Days.map(d => revByDate[d] || 0), 100);

                  return (
                    <div className="chart-container" style={{ display: 'flex', alignItems: 'flex-end', gap: '8px', height: '200px', marginTop: '24px', paddingBottom: '24px', borderBottom: '1px solid var(--border)', position: 'relative' }}>
                      {last7Days.map(date => {
                        const rev = revByDate[date] || 0;
                        const heightPct = (rev / maxRev) * 100;
                        const label = new Date(date).toLocaleDateString(undefined, { weekday: 'short' });
                        return (
                          <div key={date} style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', alignItems: 'center', height: '100%', group: 'true' }}>
                            <div className="chart-tooltip" style={{ opacity: 0, transition: '0.2s', background: 'var(--ink)', color: 'var(--bg)', padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem', marginBottom: '8px', pointerEvents: 'none', whiteSpace: 'nowrap' }}>
                              {ngnCurrency(rev)}
                            </div>
                            <div style={{ width: '100%', maxWidth: '40px', height: `${heightPct}%`, background: 'var(--brand)', borderRadius: '4px 4px 0 0', minHeight: '4px', transition: 'height 0.3s ease' }}></div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--ink-light)', marginTop: '8px', position: 'absolute', bottom: 0 }}>{label}</div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>

              <div className="admin-library-card">
                <h2>Recent Purchases</h2>
                {purchases.slice(0, 5).map(p => (
                  <div key={p.id} style={{ display: "flex", justifyContent: "space-between", padding: "12px 0", borderBottom: "1px solid rgba(0,0,0,0.05)" }}>
                    <span style={{ fontSize: '0.9rem' }}>{p.userId || "Unknown"} <br/><small className="muted">{p.productType}</small></span>
                    <strong>{ngnCurrency(p.amount)}</strong>
                  </div>
                ))}
                {purchases.length === 0 && <p className="muted">No purchases yet.</p>}
              </div>
            </div>
          </div>
        )}

        {activeTab === "library" && (
          <div className="admin-tab-pane admin-library-grid">
            <div className="admin-library-card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                <h2 style={{ margin: 0 }}>Books Library</h2>
                <div style={{ display: "flex", gap: "8px" }}>
                  <button className="ghost-btn" onClick={() => setEditingItem({ type: 'import-book' })} style={{ color: "var(--app-purple)", borderColor: "var(--app-purple)" }}>+ Import Series</button>
                  <button className="ghost-btn" onClick={() => setEditingItem({ type: 'book', isNew: true })}>+ Series</button>
                  <button className="ghost-btn" onClick={() => setEditingItem({ type: 'section', isNew: true })}>+ Book</button>
                  <button className="ghost-btn" onClick={() => setEditingItem({ type: 'chapter', isNew: true })}>+ Chapter</button>
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {activeBooks.map((book) => (
                  <div key={book.id} className="admin-book-item" style={{ border: "1px solid rgba(0,0,0,0.1)", borderRadius: "8px", padding: "16px" }}>
                    <div className="admin-book-header" style={{ display: "flex", justifyContent: "space-between" }}>
                      <div>
                        <strong style={{ fontSize: "1.1rem", display: "block" }}>{book.subtitle}: {book.title}</strong>
                        <span style={{ fontSize: "0.85rem", color: "var(--muted)" }}>{usdCurrency(book.usdPrice || 0)} ({ngnCurrency(book.price)}) · {book.status}</span>
                      </div>
                      <div style={{ display: "flex", gap: "8px" }}>
                        <button className="ghost-btn" onClick={() => setEditingItem({ type: 'book', item: book })} style={{ minHeight: "auto", padding: "4px 8px", fontSize: "0.8rem" }}>Edit</button>
                        <button className="danger-btn" onClick={() => handleDelete('book', book.id)} style={{ minHeight: "auto", padding: "4px 8px", fontSize: "0.8rem", background: "transparent", color: "var(--danger)" }}>Delete</button>
                      </div>
                    </div>
                    {book.sections && book.sections.filter(sec => !sec.deleted).length > 0 && (
                      <div className="admin-sections-list" style={{ marginTop: "12px", display: "flex", flexDirection: "column", gap: "12px", paddingLeft: "16px", borderLeft: "2px solid rgba(0,0,0,0.05)" }}>
                        {book.sections.filter(sec => !sec.deleted).map((sec) => (
                          <div key={sec.id}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                              <strong style={{ fontSize: "0.95rem" }}>Book: {sec.title}</strong>
                              <div style={{ display: "flex", gap: "8px" }}>
                                <button className="ghost-btn" onClick={() => setEditingItem({ type: 'section', item: sec, bookId: book.id })} style={{ minHeight: "auto", padding: "2px 6px", fontSize: "0.75rem" }}>Edit</button>
                                <button className="danger-btn" onClick={() => handleDelete('section', sec.id)} style={{ minHeight: "auto", padding: "2px 6px", fontSize: "0.75rem", background: "transparent", color: "var(--danger)" }}>Delete</button>
                              </div>
                            </div>
                            <div style={{ paddingLeft: "12px", marginTop: "4px", display: "flex", flexWrap: "wrap", gap: "6px" }}>
                              {sec.chapters?.filter(ch => !ch.deleted).map((ch) => (
                                <button key={ch.id} onClick={() => setEditingItem({ type: 'chapter', item: ch, bookId: book.id, sectionId: sec.id })} style={{ background: "rgba(0,0,0,0.04)", border: "none", padding: "4px 8px", borderRadius: "4px", fontSize: "0.8rem", cursor: "pointer" }}>
                                  {ch.chapterNumber}. {ch.title}
                                </button>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {editingItem && editingItem.type === 'import-book' && (
              <div className="admin-library-card">
                <h2>Bulk Import Series</h2>
                <div style={{ background: "rgba(102, 51, 153, 0.05)", border: "1px solid rgba(102, 51, 153, 0.2)", padding: "16px", borderRadius: "8px", marginBottom: "24px", fontSize: "0.9rem", color: "var(--ink)", lineHeight: 1.6 }}>
                  <strong style={{ color: "var(--app-purple)", display: "block", marginBottom: "8px" }}>Document Formatting Rules:</strong>
                  Upload a <strong>.docx</strong> or <strong>.txt</strong> file containing the entire series. The system will automatically split it into Books and Chapters based on your headings:
                  <ul style={{ margin: "8px 0 0 24px", padding: 0 }}>
                    <li><strong>Book Headings:</strong> Must start with "Book", "Part", "Series", or "Section" (e.g., <em>"Book One: The Formation"</em>).</li>
                    <li><strong>Chapter Headings:</strong> Must start with "Chapter" (e.g., <em>"Chapter 1"</em> or <em>"CHAPTER ONE: The Beginning"</em>).</li>
                    <li>Everything else will be treated as the content of the preceding chapter.</li>
                  </ul>
                </div>
                <form onSubmit={async (e) => {
                  e.preventDefault();
                  setIsImporting(true);
                  try {
                    const fd = new FormData(e.currentTarget);
                    const res = await fetch("/api/admin/books/import", { method: "POST", body: fd });
                    const data = await res.json();
                    if (data.ok) { onRefresh(); setEditingItem(null); alert("Series imported successfully!"); } 
                    else { alert(data.error); }
                  } catch (err) { console.error(err); alert("Failed to upload series."); }
                  finally { setIsImporting(false); }
                }} className="form-grid">
                  <div className="two-col">
                    <label>Series File (.docx or .txt)<input type="file" name="file" accept=".docx,.txt" required disabled={isImporting} /></label>
                    <label>Series Title<input name="title" placeholder="e.g., Disciples of the Inverted Cross" required disabled={isImporting} /></label>
                    <label>Subtitle<input name="subtitle" disabled={isImporting} /></label>
                    <label>Author<input name="author" defaultValue="BrandZilla Technologies" required disabled={isImporting} /></label>
                    <label>Cover URL<input name="cover" defaultValue="/assets/books/disciples-inverted-cross.jpeg" disabled={isImporting} /></label>
                    <label>Price (NGN)<input name="price" type="number" defaultValue="0" disabled={isImporting} /></label>
                    <label>USD Price<input name="usdPrice" type="number" step="0.01" defaultValue="0.00" disabled={isImporting} /></label>
                    <label>Status
                      <select name="status" defaultValue="Published" disabled={isImporting}>
                        <option value="Published">Published</option><option value="Draft">Draft</option><option value="Hidden">Hidden</option>
                      </select>
                    </label>
                    <label style={{ display: "flex", alignItems: "center", gap: "8px", flexDirection: "row", marginTop: "24px" }}>
                      <input name="preview" type="checkbox" value="true" disabled={isImporting} />
                      <span>Available as Preview</span>
                    </label>
                  </div>
                  <label>Blurb<textarea name="blurb" placeholder="Short description of the series..." disabled={isImporting} style={{ minHeight: "80px", width: "100%", padding: "12px", border: "1px solid var(--border)", borderRadius: "8px", fontFamily: "inherit" }} /></label>
                  <div style={{ display: "flex", gap: "12px" }}>
                    <button className="primary-btn" disabled={isImporting}>{isImporting ? "Parsing & Importing..." : "Import Series"}</button>
                    <button className="ghost-btn" type="button" onClick={() => setEditingItem(null)} disabled={isImporting}>Cancel</button>
                  </div>
                </form>
              </div>
            )}

            {editingItem && editingItem.type === 'book' && (
              <div className="admin-library-card">
                <h2>{editingItem.isNew ? "Create Series" : "Edit Series"}</h2>
                <form onSubmit={async (e) => {
                  e.preventDefault();
                  const fd = new FormData(e.currentTarget);
                  const payload = {
                    title: fd.get("title"), subtitle: fd.get("subtitle"), author: fd.get("author"),
                    cover: fd.get("cover"), price: Number(fd.get("price") || 0), usdPrice: Number(fd.get("usdPrice") || 0),
                    status: fd.get("status"), preview: fd.get("preview") === "true", blurb: fd.get("blurb")
                  };
                  try {
                    const method = editingItem.isNew ? "POST" : "PUT";
                    const url = editingItem.isNew ? "/api/admin/books" : `/api/admin/books/${editingItem.item.id}`;
                    const res = await fetch(url, { method, headers: { "content-type": "application/json" }, body: JSON.stringify(payload) });
                    const data = await res.json();
                    if (data.ok) { onRefresh(); setEditingItem(null); } else { alert(data.error); }
                  } catch (err) { console.error(err); }
                }} className="form-grid">
                  <div className="two-col">
                    <label>Title<input name="title" defaultValue={editingItem.item?.title} required /></label>
                    <label>Subtitle<input name="subtitle" defaultValue={editingItem.item?.subtitle} /></label>
                    <label>Author<input name="author" defaultValue={editingItem.item?.author || "BrandZilla Technologies"} /></label>
                    <label>Cover URL<input name="cover" defaultValue={editingItem.item?.cover || "/assets/books/disciples-inverted-cross.jpeg"} /></label>
                    <label>Price (NGN)<input name="price" type="number" defaultValue={editingItem.item?.price} /></label>
                    <label>USD Price<input name="usdPrice" type="number" step="0.01" defaultValue={editingItem.item?.usdPrice} /></label>
                    <label>Status
                      <select name="status" defaultValue={editingItem.item?.status || "Draft"}>
                        <option value="Published">Published</option><option value="Draft">Draft</option><option value="Hidden">Hidden</option>
                      </select>
                    </label>
                    <label style={{ display: "flex", alignItems: "center", gap: "8px", flexDirection: "row", marginTop: "24px" }}>
                      <input name="preview" type="checkbox" value="true" defaultChecked={editingItem.item?.preview} />
                      <span>Available as Preview</span>
                    </label>
                  </div>
                  <label>Blurb<textarea name="blurb" defaultValue={editingItem.item?.blurb} style={{ minHeight: "80px", width: "100%", padding: "12px", border: "1px solid var(--border)", borderRadius: "8px", fontFamily: "inherit" }} /></label>
                  <div style={{ display: "flex", gap: "12px" }}>
                    <button className="primary-btn">Save Series</button>
                    <button className="ghost-btn" type="button" onClick={() => setEditingItem(null)}>Cancel</button>
                  </div>
                </form>
              </div>
            )}

            {editingItem && editingItem.type === 'section' && (
              <div className="admin-library-card">
                <h2>{editingItem.isNew ? "Create Book" : "Edit Book"}</h2>
                <form onSubmit={async (e) => {
                  e.preventDefault();
                  const fd = new FormData(e.currentTarget);
                  const bookId = fd.get("bookId");
                  const payload = {
                    title: fd.get("title"), subtitle: fd.get("subtitle"), price: Number(fd.get("price") || 0),
                    order: Number(fd.get("order") || 1), tts: fd.get("tts") === "true", voice: fd.get("voice")
                  };
                  try {
                    const method = editingItem.isNew ? "POST" : "PUT";
                    const url = editingItem.isNew ? `/api/admin/books/${bookId}/sections` : `/api/admin/sections/${editingItem.item.id}`;
                    const res = await fetch(url, { method, headers: { "content-type": "application/json" }, body: JSON.stringify(payload) });
                    const data = await res.json();
                    if (data.ok) { onRefresh(); setEditingItem(null); } else { alert(data.error); }
                  } catch (err) { console.error(err); }
                }} className="form-grid">
                  <div className="two-col">
                    <label>Select Series
                      <select name="bookId" defaultValue={editingItem.bookId} required disabled={!editingItem.isNew}>
                        {activeBooks.map(b => <option key={b.id} value={b.id}>{b.subtitle}: {b.title}</option>)}
                      </select>
                    </label>
                    <label>Book Title<input name="title" defaultValue={editingItem.item?.title} required /></label>
                    <label>Book Subtitle<input name="subtitle" defaultValue={editingItem.item?.subtitle} /></label>
                    <label>Price (NGN)<input name="price" type="number" defaultValue={editingItem.item?.price} /></label>
                    <label>Order<input name="order" type="number" defaultValue={editingItem.item?.order || 1} /></label>
                    <label>Voice
                      <select name="voice" defaultValue={editingItem.item?.voice || "Female"}>
                        <option value="Female">Female</option><option value="Male">Male</option>
                      </select>
                    </label>
                    <label style={{ display: "flex", alignItems: "center", gap: "8px", flexDirection: "row", marginTop: "24px" }}>
                      <input name="tts" type="checkbox" value="true" defaultChecked={editingItem.item?.tts ?? true} />
                      <span>Enable TTS</span>
                    </label>
                  </div>
                  <div style={{ display: "flex", gap: "12px" }}>
                    <button className="primary-btn">Save Series</button>
                    <button className="ghost-btn" type="button" onClick={() => setEditingItem(null)}>Cancel</button>
                  </div>
                </form>
              </div>
            )}

            {editingItem && editingItem.type === 'chapter' && (
              <div className="admin-library-card">
                <h2>{editingItem.isNew ? "Create Chapter" : "Edit Chapter"}</h2>
                <form onSubmit={async (e) => {
                  e.preventDefault();
                  const fd = new FormData(e.currentTarget);
                  const sectionId = fd.get("sectionId");
                  const payload = {
                    title: fd.get("title"), subtitle: fd.get("subtitle"), content: fd.get("content"),
                    chapterNumber: Number(fd.get("chapterNumber") || 1), order: Number(fd.get("order") || 1),
                    isPreview: fd.get("isPreview") === "true", status: fd.get("status")
                  };
                  try {
                    const method = editingItem.isNew ? "POST" : "PUT";
                    const url = editingItem.isNew ? `/api/admin/sections/${sectionId}/chapters` : `/api/admin/chapters/${editingItem.item.id}`;
                    const res = await fetch(url, { method, headers: { "content-type": "application/json" }, body: JSON.stringify(payload) });
                    const data = await res.json();
                    if (data.ok) { onRefresh(); setEditingItem(null); } else { alert(data.error); }
                  } catch (err) { console.error(err); }
                }} className="form-grid">
                  <div className="two-col">
                    <label>Select Series
                      <select value={selectedBookId} onChange={(e) => setSelectedBookId(e.target.value)} required disabled={!editingItem.isNew}>
                        <option value="" disabled>-- Choose Series --</option>
                        {activeBooks.map(b => <option key={b.id} value={b.id}>{b.subtitle}: {b.title}</option>)}
                      </select>
                    </label>
                    <label>Select Book
                      <select name="sectionId" value={selectedSectionId} onChange={(e) => setSelectedSectionId(e.target.value)} required disabled={!editingItem.isNew}>
                        <option value="" disabled>-- Choose Book --</option>
                        {(activeBooks.find(b => b.id === selectedBookId)?.sections || []).filter(s => !s.deleted).map(s => (
                          <option key={s.id} value={s.id}>{s.title}</option>
                        ))}
                      </select>
                    </label>
                    <label>Chapter Title<input name="title" defaultValue={editingItem.item?.title} required /></label>
                    <label>Chapter Subtitle<input name="subtitle" defaultValue={editingItem.item?.subtitle} /></label>
                    <label>Chapter Number<input name="chapterNumber" type="number" defaultValue={editingItem.item?.chapterNumber} /></label>
                    <label>Order<input name="order" type="number" defaultValue={editingItem.item?.order} /></label>
                    <label>Status
                      <select name="status" defaultValue={editingItem.item?.status || "Published"}>
                        <option value="Published">Published</option><option value="Draft">Draft</option>
                      </select>
                    </label>
                    <label style={{ display: "flex", alignItems: "center", gap: "8px", flexDirection: "row", marginTop: "24px" }}>
                      <input name="isPreview" type="checkbox" value="true" defaultChecked={editingItem.item?.isPreview} />
                      <span>Is Free Preview</span>
                    </label>
                  </div>
                  <label style={{ gridColumn: "1 / -1" }}>Chapter Content
                    <RichTextEditor name="content" defaultValue={editingItem.item?.content || ""} placeholder="Start writing the chapter..." />
                  </label>
                  <div style={{ display: "flex", gap: "12px", gridColumn: "1 / -1" }}>
                    <button className="primary-btn">Save Chapter</button>
                    <button className="ghost-btn" type="button" onClick={() => setEditingItem(null)}>Cancel</button>
                  </div>
                </form>
              </div>
            )}
          </div>
        )}

        {activeTab === "trash" && (
          <div className="admin-tab-pane" style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
            
            <div className="admin-library-card">
              <h2 style={{ color: "var(--app-purple)", marginBottom: "16px" }}>Deleted Books</h2>
              {deletedBooks.length === 0 ? (
                <p className="muted" style={{ padding: "12px 0" }}>No deleted books in the Recycle Bin.</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  {deletedBooks.map((book) => (
                    <div key={book.id} className="admin-book-item" style={{ border: "1px solid rgba(0,0,0,0.1)", borderRadius: "8px", padding: "16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <strong style={{ fontSize: "1.1rem", display: "block", color: "var(--ink)" }}>{book.subtitle}: {book.title}</strong>
                        <span style={{ fontSize: "0.85rem", color: "var(--muted)" }}>
                          Author: {book.author || "Stanley Ohanugo"} · Deleted: {formatDeletedAt(book.deletedAt)}
                        </span>
                      </div>
                      <div style={{ display: "flex", gap: "12px" }}>
                        <button className="primary-btn" onClick={() => handleRestore('book', book.id)} style={{ minHeight: "auto", padding: "6px 12px", fontSize: "0.85rem", background: "var(--app-purple)", color: "white", border: "none", cursor: "pointer", borderRadius: "100px", fontWeight: "600" }}>Restore</button>
                        <button className="danger-btn" onClick={() => handlePermanentDelete('book', book.id)} style={{ minHeight: "auto", padding: "6px 12px", fontSize: "0.85rem", background: "transparent", color: "var(--danger)", border: "1px solid var(--danger)", cursor: "pointer", borderRadius: "100px", fontWeight: "600" }}>Delete Permanently</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="admin-library-card">
              <h2 style={{ color: "var(--app-purple)", marginBottom: "16px" }}>Deleted Series</h2>
              {deletedSections.length === 0 ? (
                <p className="muted" style={{ padding: "12px 0" }}>No deleted series in the Recycle Bin.</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  {deletedSections.map((sec) => (
                    <div key={sec.id} className="admin-book-item" style={{ border: "1px solid rgba(0,0,0,0.1)", borderRadius: "8px", padding: "16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <strong style={{ fontSize: "1.1rem", display: "block", color: "var(--ink)" }}>{sec.title}</strong>
                        <span style={{ fontSize: "0.85rem", color: "var(--muted)" }}>
                          Parent Book: {sec.bookTitle} · Deleted: {formatDeletedAt(sec.deletedAt)}
                        </span>
                      </div>
                      <div style={{ display: "flex", gap: "12px" }}>
                        <button className="primary-btn" onClick={() => handleRestore('section', sec.id)} style={{ minHeight: "auto", padding: "6px 12px", fontSize: "0.85rem", background: "var(--app-purple)", color: "white", border: "none", cursor: "pointer", borderRadius: "100px", fontWeight: "600" }}>Restore</button>
                        <button className="danger-btn" onClick={() => handlePermanentDelete('section', sec.id)} style={{ minHeight: "auto", padding: "6px 12px", fontSize: "0.85rem", background: "transparent", color: "var(--danger)", border: "1px solid var(--danger)", cursor: "pointer", borderRadius: "100px", fontWeight: "600" }}>Delete Permanently</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="admin-library-card">
              <h2 style={{ color: "var(--app-purple)", marginBottom: "16px" }}>Deleted Chapters</h2>
              {deletedChapters.length === 0 ? (
                <p className="muted" style={{ padding: "12px 0" }}>No deleted chapters in the Recycle Bin.</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  {deletedChapters.map((ch) => (
                    <div key={ch.id} className="admin-book-item" style={{ border: "1px solid rgba(0,0,0,0.1)", borderRadius: "8px", padding: "16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <strong style={{ fontSize: "1.1rem", display: "block", color: "var(--ink)" }}>Chapter {ch.chapterNumber}: {ch.title}</strong>
                        <span style={{ fontSize: "0.85rem", color: "var(--muted)" }}>
                          Parent Series: {ch.sectionTitle} · Deleted: {formatDeletedAt(ch.deletedAt)}
                        </span>
                      </div>
                      <div style={{ display: "flex", gap: "12px" }}>
                        <button className="primary-btn" onClick={() => handleRestore('chapter', ch.id)} style={{ minHeight: "auto", padding: "6px 12px", fontSize: "0.85rem", background: "var(--app-purple)", color: "white", border: "none", cursor: "pointer", borderRadius: "100px", fontWeight: "600" }}>Restore</button>
                        <button className="danger-btn" onClick={() => handlePermanentDelete('chapter', ch.id)} style={{ minHeight: "auto", padding: "6px 12px", fontSize: "0.85rem", background: "transparent", color: "var(--danger)", border: "1px solid var(--danger)", cursor: "pointer", borderRadius: "100px", fontWeight: "600" }}>Delete Permanently</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        )}

        {activeTab === "community" && (
          <div className="admin-tab-pane">
            <div className="admin-library-card">
              <h2>Reported Posts</h2>
              <div className="content-stack" style={{ marginTop: "24px" }}>
                {posts.filter(p => p.reported).length === 0 ? (
                  <p className="muted">No reported posts.</p>
                ) : (
                  posts.filter(p => p.reported).map((post) => (
                    <article className="moderation-card is-reported" key={post.id} style={{ border: "1px solid #F8D7DA" }}>
                      <div>
                        <div className="chapter-meta">
                          <span>{post.status}</span>
                          <span>{post.country}</span>
                          <span>{post.likes || 0} likes</span>
                          <span>{post.reports?.length || 1} report(s)</span>
                        </div>
                        <h3 style={{ margin: "8px 0" }}>{post.username}</h3>
                        <p>{post.content}</p>
                      </div>
                      <div className="inline-actions action-wrap" style={{ marginTop: "16px" }}>
                        <button className="ghost-btn" onClick={() => onModeratePost(post.id, "Visible")}>Approve</button>
                        <button className="ghost-btn" onClick={() => onModeratePost(post.id, "Hidden")}>Hide</button>
                        <button className="danger-btn" onClick={() => onModeratePost(post.id, "Deleted")}>Delete</button>
                      </div>
                    </article>
                  ))
                )}
              </div>
            </div>

            <div className="admin-library-card" style={{ marginTop: "32px" }}>
              <h2>All Posts</h2>
              <div className="content-stack" style={{ marginTop: "24px" }}>
                {posts.filter(p => !p.reported).map((post) => (
                  <article className="moderation-card" key={post.id}>
                    <div>
                      <div className="chapter-meta">
                        <span>{post.status}</span>
                        <span>{post.country}</span>
                        <span>{post.likes || 0} likes</span>
                      </div>
                      <h3 style={{ margin: "8px 0" }}>{post.username}</h3>
                      <p>{post.content}</p>
                    </div>
                    <form onSubmit={(event) => {
                      event.preventDefault();
                      onAdminReply(post.id, new FormData(event.currentTarget).get("comment") || "");
                      event.currentTarget.reset();
                    }} className="comment-form" style={{ marginTop: "16px" }}>
                      <input name="comment" placeholder="Reply as admin" style={{ padding: "10px", borderRadius: "8px", border: "1px solid var(--border)", width: "100%" }} />
                      <button className="primary-btn">Reply</button>
                    </form>
                    <div className="inline-actions action-wrap" style={{ marginTop: "12px" }}>
                      <button className="ghost-btn" onClick={() => onModeratePost(post.id, "Hidden")}>Hide</button>
                      <button className="danger-btn" onClick={() => onModeratePost(post.id, "Deleted")}>Delete</button>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </div>
        )}
        {activeTab === "users" && (
          <div className="admin-tab-pane">
            <div className="admin-library-card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
                <h2>Registered Users</h2>
                <span className="admin-role-badge">{users.length} Total Readers</span>
              </div>
              
              {loadingUsers ? (
                <div style={{ textAlign: "center", padding: "40px", color: "var(--brand)" }}>Loading users...</div>
              ) : users.length === 0 ? (
                <p className="muted">No users found.</p>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                    <thead>
                      <tr style={{ borderBottom: "2px solid var(--line)" }}>
                        <th style={{ padding: "12px", color: "var(--brand)" }}>Name</th>
                        <th style={{ padding: "12px", color: "var(--brand)" }}>Email</th>
                        <th style={{ padding: "12px", color: "var(--brand)" }}>Joined</th>
                        <th style={{ padding: "12px", color: "var(--brand)" }}>Purchases</th>
                        <th style={{ padding: "12px", color: "var(--brand)" }}>Chapters Read</th>
                        <th style={{ padding: "12px", color: "var(--brand)" }}>Points</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map(u => (
                        <tr key={u.id} style={{ borderBottom: "1px solid var(--line)" }}>
                          <td style={{ padding: "12px", fontWeight: "bold", color: "var(--ink)" }}>{u.fullName || "—"}</td>
                          <td style={{ padding: "12px", color: "var(--ink)" }}>{u.email}</td>
                          <td style={{ padding: "12px", color: "var(--ink)" }}>{new Date(u.createdAt).toLocaleDateString()}</td>
                          <td style={{ padding: "12px" }}>
                            <span className="admin-role-badge" style={{ background: u._count?.purchases > 0 ? "var(--app-green)" : "var(--line)", color: u._count?.purchases > 0 ? "white" : "var(--ink)" }}>
                              {u._count?.purchases || 0}
                            </span>
                          </td>
                          <td style={{ padding: "12px" }}>
                            <span className="admin-role-badge" style={{ background: u._count?.readingProgress > 0 ? "var(--app-purple)" : "var(--line)", color: u._count?.readingProgress > 0 ? "white" : "var(--ink)" }}>
                              {u._count?.readingProgress || 0}
                            </span>
                          </td>
                          <td style={{ padding: "12px", fontWeight: "600", color: "var(--brand)" }}>{u.points || 0}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
