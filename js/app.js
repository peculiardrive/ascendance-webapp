const STORAGE_KEY = "ascendance_state_v1";
const API_STATE_URL = "/api/state";

const seedBooks = [
  {
    id: "book-1",
    order: 1,
    title: "Disciples of the Inverted Cross",
    subtitle: "Book One",
    author: "BrandZilla Technologies",
    cover: "assets/cover-book-1.svg",
    price: 4500,
    status: "Published",
    preview: true,
    blurb:
      "A forbidden order rises beneath the surface of ordinary faith, and a young reader is drawn into the cost of discernment. Ascendance begins where hidden loyalties, ambition, and sacrifice collide.",
    sections: [
      {
        id: "b1-s1",
        title: "The First Disturbance",
        subtitle: "The door opens quietly",
        order: 1,
        price: 0,
        tts: true,
        voice: "Female",
        chapters: [
          {
            id: "b1-c1",
            title: "Chapter One",
            subtitle: "A Sign in the Dust",
            isPreview: true,
            status: "Published",
            content: [
              "The city did not wake at once. It stirred in pieces: a shutter opened, a kettle sighed, a bell struck the hour with the weary certainty of something older than memory.",
              "Elias stood at the crossing and watched the dust arrange itself into the shape of a warning. It was there only for a breath, a slanted mark under the morning sun, but his heart recognized what his mind refused to name.",
              "By noon, the mark had vanished. By evening, three men in black coats were asking for him by name.",
              "He should have run then. Instead, he opened the old journal his mother had hidden beneath the floorboards and read the sentence that would divide his life in two."
            ]
          },
          {
            id: "b1-c2",
            title: "Chapter Two",
            subtitle: "The House Below",
            isPreview: false,
            status: "Published",
            content: [
              "There are houses built upward for the pride of the living, and there are houses built downward for the secrecy of the afraid.",
              "Elias found the stair behind a wall of flour sacks. Each step carried the smell of rain, iron, and old wax. Somewhere below, voices moved in practiced whispers.",
              "When the final door opened, every candle in the room bowed toward him as if the flame itself had been expecting his arrival."
            ]
          }
        ]
      },
      {
        id: "b1-s2",
        title: "The Hidden Creed",
        subtitle: "A vow beneath a vow",
        order: 2,
        price: 1500,
        tts: true,
        voice: "Male",
        chapters: [
          {
            id: "b1-c3",
            title: "Chapter Three",
            subtitle: "The Witness",
            isPreview: false,
            status: "Published",
            content: [
              "The witness was younger than Elias expected and far less afraid. She sat under the archway with her hands folded, her eyes fixed on the inverted cross cut into the stone.",
              "They told him she had seen the ceremony. They did not tell him she had survived it by answering a question no child should know how to hear.",
              "When she spoke, the room tightened around every word."
            ]
          }
        ]
      }
    ]
  },
  {
    id: "book-2",
    order: 2,
    title: "Merchants of the Ivory Towers",
    subtitle: "Book Two",
    author: "BrandZilla Technologies",
    cover: "assets/cover-book-2.svg",
    price: 5000,
    status: "Published",
    preview: false,
    blurb:
      "The struggle moves from hidden rooms into polished halls, where influence is traded like currency and truth becomes the most expensive commodity.",
    sections: [
      {
        id: "b2-s1",
        title: "Ledgers of Power",
        subtitle: "The tower keeps its receipts",
        order: 1,
        price: 2000,
        tts: true,
        voice: "Female",
        chapters: [
          {
            id: "b2-c1",
            title: "Chapter One",
            subtitle: "Ivory Accounting",
            isPreview: false,
            status: "Published",
            content: [
              "The tower was beautiful in the way a blade is beautiful: clean, reflective, and built for separation.",
              "Inside, no one raised a voice. Contracts did the shouting. Signatures drew blood without staining the page.",
              "Elias learned quickly that every favor had a shadow price."
            ]
          }
        ]
      }
    ]
  },
  {
    id: "book-3",
    order: 3,
    title: "Rhapsodies of the Coming Regent",
    subtitle: "Book Three",
    author: "BrandZilla Technologies",
    cover: "assets/cover-book-3.svg",
    price: 5500,
    status: "Published",
    preview: false,
    blurb:
      "The final movement gathers every oath, betrayal, and revelation into the arrival of a regent whose coming will test the meaning of ascendance itself.",
    sections: [
      {
        id: "b3-s1",
        title: "The Crown Unseen",
        subtitle: "A throne before a name",
        order: 1,
        price: 2500,
        tts: true,
        voice: "Male",
        chapters: [
          {
            id: "b3-c1",
            title: "Chapter One",
            subtitle: "The Music Before Dawn",
            isPreview: false,
            status: "Published",
            content: [
              "Before the regent arrived, the city began to sing.",
              "No choir claimed the sound. It gathered in drains, windows, market stalls, and the trembling string of a violin left untouched in its case.",
              "Those who remembered the first prophecy knelt. Those who mocked it reached for locked doors."
            ]
          }
        ]
      }
    ]
  }
];

const seedState = {
  booted: false,
  user: null,
  users: [],
  books: seedBooks,
  settings: {
    bookOnePrice: 4500,
    bookTwoPrice: 5000,
    bookThreePrice: 5500,
    trilogyPrice: 12000,
    giftPrice: 9500,
    giftLimit: 5,
    autoApprovePosts: true,
    comments: true,
    likes: true,
    sharing: true,
    advertEnabled: true
  },
  purchases: [],
  transactions: [],
  progress: {},
  gifts: [],
  posts: [
    {
      id: "post-1",
      userId: "reader-demo",
      username: "AdaReads",
      country: "NG",
      bookId: "book-1",
      content: "The opening feels cinematic. I like that the story asks spiritual questions without slowing the pace.",
      likes: 12,
      likedBy: [],
      comments: [{ user: "Admin", text: "Thank you for reading. The next section deepens that tension." }],
      status: "Visible",
      pinned: true,
      createdAt: new Date(Date.now() - 86400000).toISOString()
    }
  ],
  notifications: [],
  readerSettings: {
    font: "Georgia",
    size: 19,
    line: 1.72,
    theme: "light",
    align: "left",
    scrollSpeed: 2
  },
  currentChapter: null,
  adminTab: "dashboard"
};

let state = loadState();
let autoScrollTimer = null;
let currentUtterance = null;
let backendAvailable = false;
let backendSaveTimer = null;
let isHydratingBackend = false;

const app = document.querySelector("#app");
const splash = document.querySelector("#splash");
const modalRoot = document.querySelector("#modal-root");

function loadState() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) return structuredClone(seedState);
  try {
    const parsed = JSON.parse(saved);
    return {
      ...structuredClone(seedState),
      ...parsed,
      settings: { ...seedState.settings, ...(parsed.settings || {}) },
      readerSettings: { ...seedState.readerSettings, ...(parsed.readerSettings || {}) },
      books: parsed.books?.length ? parsed.books : seedBooks
    };
  } catch {
    return structuredClone(seedState);
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  queueBackendSave();
}

function exportStateForBackend() {
  const {
    users,
    books,
    settings,
    purchases,
    transactions,
    progress,
    gifts,
    posts,
    notifications,
    readerSettings,
    currentChapter,
    adminTab
  } = state;

  return {
    users,
    books,
    settings,
    purchases,
    transactions,
    progress,
    gifts,
    posts,
    notifications,
    readerSettings,
    currentChapter,
    adminTab
  };
}

async function hydrateFromBackend() {
  try {
    const response = await fetch(API_STATE_URL, { cache: "no-store" });
    if (!response.ok) return;
    const payload = await response.json();
    backendAvailable = true;
    if (!payload.state) return;

    isHydratingBackend = true;
    const activeUserEmail = state.user?.email;
    state = {
      ...state,
      ...payload.state,
      settings: { ...state.settings, ...(payload.state.settings || {}) },
      readerSettings: { ...state.readerSettings, ...(payload.state.readerSettings || {}) },
      user: activeUserEmail ? payload.state.users?.find((user) => user.email === activeUserEmail) || state.user : state.user
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    isHydratingBackend = false;
  } catch {
    backendAvailable = false;
    isHydratingBackend = false;
  }
}

function queueBackendSave() {
  if (isHydratingBackend) return;
  window.clearTimeout(backendSaveTimer);
  backendSaveTimer = window.setTimeout(syncStateToBackend, 450);
}

async function syncStateToBackend() {
  try {
    const response = await fetch(API_STATE_URL, {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(exportStateForBackend())
    });
    backendAvailable = response.ok;
  } catch {
    backendAvailable = false;
  }
}

function currency(amount) {
  return new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(amount);
}

function uid(prefix) {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

function html(strings, ...values) {
  return strings.reduce((acc, part, index) => acc + part + (values[index] ?? ""), "");
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function splitPostContent(content = "") {
  const [first, ...rest] = content.split("\n");
  if (rest.length && first.length <= 30) return { title: first, body: rest.join("\n") };
  return { title: "Reader reflection", body: content };
}

function toast(message) {
  const oldToast = document.querySelector(".toast");
  oldToast?.remove();
  const node = document.createElement("div");
  node.className = "toast";
  node.textContent = message;
  document.body.append(node);
  setTimeout(() => node.remove(), 3200);
}

function routeTo(route) {
  window.location.hash = route;
}

function isOnboarded() {
  return Boolean(state.user && (!state.user.onboardingStep || state.user.onboardingStep === "done"));
}

function getRoute() {
  return window.location.hash.replace("#", "") || (isOnboarded() ? "home" : "auth");
}

function flattenChapters() {
  return state.books.flatMap((book) =>
    book.sections.flatMap((section) =>
      section.chapters.map((chapter) => ({ book, section, chapter }))
    )
  );
}

function findBook(bookId) {
  return state.books.find((book) => book.id === bookId);
}

function findChapter(chapterId) {
  return flattenChapters().find((item) => item.chapter.id === chapterId);
}

function currentUserPurchases() {
  if (!state.user) return [];
  return state.purchases.filter((purchase) => purchase.userId === state.user.id && purchase.status === "Successful");
}

function hasBookAccess(book, chapter) {
  if (!state.user) return false;
  if (chapter?.isPreview) return true;
  const purchases = currentUserPurchases();
  return purchases.some((purchase) =>
    purchase.productType === "trilogy" ||
    purchase.bookId === book.id ||
    purchase.productType === "gift-trilogy"
  );
}

function ownsBookAccess(book) {
  if (!state.user) return false;
  const purchases = currentUserPurchases();
  return purchases.some((purchase) =>
    purchase.productType === "trilogy" ||
    purchase.bookId === book.id ||
    purchase.productType === "gift-trilogy"
  );
}

function bookProgress(bookId) {
  const chapters = flattenChapters().filter((item) => item.book.id === bookId);
  const total = chapters.length || 1;
  const completed = chapters.filter((item) => (state.progress[item.chapter.id]?.percentage || 0) >= 90).length;
  const active = chapters.reduce((best, item) => Math.max(best, state.progress[item.chapter.id]?.percentage || 0), 0);
  return Math.min(100, Math.round((completed / total) * 100 || active));
}

function addNotification(title, body) {
  state.notifications.unshift({
    id: uid("notice"),
    userId: state.user?.id,
    title,
    body,
    createdAt: new Date().toISOString()
  });
}

function shell(content, active = getRoute()) {
  const navItems = [
    ["home", "Home", "⌂"],
    ["books", "Books", "▤"],
    ["community", "Community", "◌"],
    ["notices", "Help", "◇"],
    ["profile", "Profile", "◎"]
  ];
  return html`
    <div class="shell">
      <header class="topbar">
        <div class="brand-lockup">
          <strong>Ascendance</strong>
          <span>The Trilogy · ${backendAvailable ? "Synced" : "Local"}</span>
        </div>
        <div class="top-actions">
          <button class="icon-btn" title="Install app" data-action="install">⇩</button>
        </div>
      </header>
      <nav class="nav-tabs" aria-label="Reader navigation">
        ${navItems
          .map(([route, label, icon]) => html`<button class="nav-link ${active === route ? "is-active" : ""}" data-route="${route}"><span>${icon}</span>${label}</button>`)
          .join("")}
      </nav>
      <main class="main">${content}</main>
    </div>
  `;
}

function render() {
  stopAutoScroll();
  window.speechSynthesis?.cancel();
  const route = getRoute();
  if (!state.user && route !== "auth" && route !== "admin") {
    routeTo("auth");
    return;
  }
  if (state.user && !isOnboarded() && route !== "auth" && route !== "admin") {
    routeTo("auth");
    return;
  }

  const [view, id] = route.split("/");
  const views = {
    auth: renderAuth,
    home: renderHome,
    books: renderBooks,
    reader: () => renderReader(id),
    community: renderCommunity,
    notices: renderNotices,
    profile: renderProfile,
    admin: renderAdmin
  };

  app.innerHTML = (views[view] || renderHome)();
  app.classList.remove("is-loading");
  bindEvents();

  if (view === "reader") restoreReaderPosition(id);
}

function renderAuth() {
  const step = state.user?.onboardingStep || "signin";
  const stepCopy = {
    signin: ["Enter Ascendance", "Create your account or continue reading."],
    verify: ["Confirm Email", "Use the 6-digit code sent to your inbox."],
    phone: ["Add Telephone", "Secure your reader account."],
    profile: ["Community Identity", "Choose how readers will see you."]
  };
  const [title, copy] = stepCopy[step] || stepCopy.signin;

  const form =
    step === "verify"
      ? html`
          <label>Verification code<input name="code" inputmode="numeric" maxlength="6" placeholder="123456"></label>
          <button class="primary-btn" data-action="verify-email">Verify</button>
          <button class="ghost-btn" data-action="resend-code">Resend code</button>
        `
      : step === "phone"
        ? html`
            <label>Telephone<input name="phone" type="tel" placeholder="+234 800 000 0000"></label>
            <button class="primary-btn" data-action="save-phone">Continue</button>
          `
        : step === "profile"
          ? html`
              <label>Community username<input name="username" placeholder="AdaReads"></label>
              <label>Country code
                <select name="country">
                  <option value="NG">NG</option>
                  <option value="GH">GH</option>
                  <option value="ZA">ZA</option>
                  <option value="GB">GB</option>
                  <option value="US">US</option>
                </select>
              </label>
              <label>Avatar
                <select name="avatar">
                  <option value="A">A</option>
                  <option value="Reader">Reader</option>
                  <option value="Regent">Regent</option>
                </select>
              </label>
              <button class="primary-btn" data-action="save-profile">Start Reading</button>
            `
          : state.authMode === "signup"
            ? html`
                <label>Email<input name="email" type="email" autocomplete="email" placeholder="reader@example.com"></label>
                <label>Full name<input name="fullName" placeholder="Your name" autocomplete="name" required></label>
                <label>Password<input name="password" type="password" placeholder="Minimum 8 characters" autocomplete="new-password" minlength="8" required></label>
                <button class="auth-alt-link" data-action="switch-to-login">Already have an account? Login</button>
                <button class="primary-btn auth-submit" data-action="signup">Submit</button>
              `
            : html`
                <label>Email<input name="email" type="email" autocomplete="email" placeholder="reader@example.com"></label>
                <label>Password<input name="password" type="password" placeholder="Your password" autocomplete="current-password" required></label>
                <button class="auth-alt-link" data-action="switch-to-signup">Create a Reader Profile</button>
                <button class="primary-btn auth-submit" data-action="login">Submit</button>
              `;

  return html`
    <main class="auth-page">
      <section class="auth-panel">
        <img class="auth-logo" src="/assets/ascendance-wordmark.png" alt="Ascendance The Trilogy" />
        <div class="auth-heading">
          <h1>${step === "verify" ? "Confirm Email" : step === "phone" ? "Add Telephone" : step === "profile" ? "Reader Profile" : "Login"}</h1>
        </div>
        <div class="form-grid" data-auth-form>${form}</div>
      </section>
    </main>
  `;
}

function renderHome() {
  const ownedBooks = state.books.filter(ownsBookAccess);
  const currentBook = ownedBooks[ownedBooks.length - 1] || state.books[0];
  const chapters = flattenChapters().filter((item) => item.book.id === currentBook.id);
  const firstChapter = chapters[0];
  const progressRows = Object.values(state.progress).filter((item) => item?.bookId === currentBook.id);
  const latestProgress = progressRows[progressRows.length - 1];
  const continueItem = latestProgress ? findChapter(latestProgress.chapterId) : firstChapter;
  const percent = latestProgress?.percentage || 0;

  const sectionLabel = currentBook.id === "book-1" 
    ? "Books One, Two & Three: The Formation, The Fall, The Fraternity"
    : currentBook.id === "book-2"
    ? "Books Four & Five: The Fulcrum, The Firstfruit"
    : "Book Six: The Fulfillment";

  const posts = state.posts || [];
  const leaders = getCommunityLeaders(posts).slice(0, 5);

  return shell(html`
    <section class="featured-book" aria-labelledby="featured-book-title" style="display: grid; justify-items: center; gap: 34px; margin-top: 20px;">
      <div class="cover-stage" style="position: relative;">
        <img class="featured-cover" src="${currentBook.cover}" alt="${escapeHtml(currentBook.title)} cover" style="width: min(520px, 66vw); aspect-ratio: 3/4.1; object-fit: cover; box-shadow: 0 14px 32px rgba(0,0,0,0.12);">
        <button class="audio-drama-fab" data-action="speak" data-text="${escapeHtml(currentBook.blurb)}" aria-label="Listen to summary">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
            <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
            <path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path>
          </svg>
        </button>
      </div>
      <div class="featured-copy" style="text-align: center;">
        <p class="eyebrow">${sectionLabel}</p>
        <h1 id="featured-book-title" style="margin: 0; font-family: Georgia, serif; font-size: clamp(2rem, 6vw, 3.4rem); font-weight: 500;">${escapeHtml(currentBook.title)}</h1>
        ${percent > 0 ? html`<div class="progress-track" style="margin-top: 12px; height: 8px; background: var(--panel-2); border-radius: 4px; overflow: hidden; width: 200px; margin-left: auto; margin-right: auto;"><div class="progress-fill" style="width: ${percent}%; height: 100%; background: linear-gradient(90deg, #b01834, #d2a94f);"></div></div>` : ""}
      </div>
      <div class="featured-actions" style="display: flex; gap: 16px; width: min(760px, 100%); justify-content: center; margin-bottom: 20px;">
        <button class="ghost-btn" data-action="show-summary" data-book-id="${currentBook.id}" style="flex: 1; min-height: 52px; border-radius: 12px;">Book Summary</button>
        <button class="primary-btn" data-route="reader/${continueItem.chapter.id}" style="flex: 1; min-height: 52px; border-radius: 12px;">
          ${percent > 0 ? "Continue Reading" : "Start Reading"}
        </button>
      </div>

      <section class="leader-section community-leaders" aria-label="Community leaders" style="text-align: left; border: 1px solid rgba(128, 105, 90, 0.16); border-radius: 12px; padding: 12px; background: color-mix(in srgb, var(--reader-bg, #fff) 99%, transparent); width: min(760px, 100%); margin: 20px auto 0;">
        <div class="leader-title" style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;">
          <div class="leader-title-copy">
            <h2 style="margin: 0; font-family: Georgia, serif; font-size: 1.15rem; color: #b01834;">Community Leaders</h2>
            <p style="margin: 0; font-size: 0.75rem; color: var(--muted);">Top contributors this week</p>
          </div>
          <button class="ghost-btn leaders-link" data-action="view-leaderboard" style="min-height: auto; padding: 4px 8px; font-size: 0.75rem; border-radius: 4px;">View Full Leaderboard</button>
        </div>
        
        <div class="leader-strip" style="display: flex; gap: 8px; overflow-x: auto; padding-bottom: 6px; scrollbar-width: thin;" role="list">
          ${leaders.map((leader, idx) => html`
            <button class="leader-chip btn-leader-chip" data-name="${escapeHtml(leader.name)}" style="flex: 0 0 auto; display: flex; flex-direction: column; align-items: center; width: 88px; border: 1px solid rgba(128,105,90,0.15); border-radius: 8px; background: transparent; padding: 8px; cursor: pointer; color: inherit;" role="listitem">
              <div class="leader-avatar" style="width: 44px; height: 44px; border-radius: 50%; background: #b01834; color: #fff; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 0.9rem; margin-bottom: 6px;">
                ${escapeHtml((leader.avatar || leader.name || "A").slice(0, 1))}
              </div>
              <span style="font-size: 0.75rem; font-weight: bold; overflow: hidden; text-overflow: ellipsis; width: 100%; text-align: center;">${escapeHtml(leader.name)}</span>
              <span style="font-size: 0.65rem; color: var(--muted);">${leader.points} pts</span>
            </button>
          `).join("")}
        </div>
      </section>
    </section>
  `, "home");
}

function renderBooks() {
  const books = state.books;
  
  const getBookState = (book) => {
    const owned = state.purchases.some(
      (p) =>
        p.userId === state.user?.id &&
        p.status === "Successful" &&
        (p.productType === "trilogy" || p.productType === "gift-trilogy" || p.bookId === book.id)
    );
    const previousId = book.order > 1 ? `book-${book.order - 1}` : null;
    const requiresPrevious = previousId && !state.purchases.some(
      (p) =>
        p.userId === state.user?.id &&
        p.status === "Successful" &&
        (p.productType === "trilogy" || p.productType === "gift-trilogy" || p.bookId === previousId)
    );
    return { owned, requiresPrevious };
  };

  return shell(html`
    <div class="store-screen" style="max-width: 800px; margin: 0 auto; display: grid; gap: 24px; padding: 16px;">
      <div class="screen-heading" style="text-align: left; margin-bottom: 8px;">
        <p class="eyebrow" style="color: #b01834; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; font-size: 0.8rem; margin: 0;">Ascendance collection</p>
        <h1 style="font-family: Georgia, serif; font-size: 2.2rem; margin: 4px 0 8px; color: var(--ink);">Store</h1>
        <p style="color: var(--muted); margin: 0; font-size: 0.95rem;">Unlock the complete trilogy or continue one book at a time.</p>
      </div>

      <section class="bundle-offer" style="display: grid; grid-template-columns: 1fr; border: 1px solid rgba(128, 105, 90, 0.28); border-radius: 12px; overflow: hidden; background: color-mix(in srgb, var(--reader-bg, #fff) 95%, transparent); backdrop-filter: blur(10px);">
        <div class="bundle-covers" style="display: flex; gap: 8px; padding: 16px; justify-content: center; background: rgba(0,0,0,0.05);">
          ${books.map((b) => html`<img src="${b.cover}" alt="" style="width: 70px; height: 100px; border-radius: 4px; box-shadow: 0 4px 8px rgba(0,0,0,0.15);" />`).join("")}
        </div>
        <div class="bundle-copy" style="padding: 20px; text-align: left;">
          <span class="offer-badge" style="background: #b01834; color: #fff; padding: 4px 8px; font-size: 0.75rem; font-weight: bold; border-radius: 4px; text-transform: uppercase; letter-spacing: 0.5px;">Best value</span>
          <h2 style="font-family: Georgia, serif; font-size: 1.5rem; margin: 10px 0 6px; color: var(--ink);">Unlock all three books</h2>
          <p style="color: var(--muted); font-size: 0.9rem; margin: 0 0 16px;">One payment unlocks the complete Ascendance trilogy.</p>
          <div style="font-weight: bold; font-size: 1.1rem; color: #b01834; margin-bottom: 16px;">${currency(8962)} / ${usdCurrency(6.59)}</div>
          <button class="primary-btn" data-action="unlock-trilogy" style="width: 100%; min-height: 48px; border-radius: 8px; font-weight: bold;">Unlock Trilogy</button>
        </div>
      </section>

      <div style="display: grid; gap: 20px;">
        ${books.map((book) => {
          const stateVal = getBookState(book);
          const firstChapter = flattenChapters().find((item) => item.book.id === book.id);
          const continueChapter = firstChapter;
          const priceVal = book.price || 4882;
          const usdVal = book.id === "book-1" ? 2.59 : 3.59;
          
          return html`
            <section class="store-book" style="display: flex; flex-direction: column; gap: 16px; border: 1px solid rgba(128, 105, 90, 0.16); border-radius: 12px; padding: 16px; background: color-mix(in srgb, var(--reader-bg, #fff) 98%, transparent);">
              <div style="display: flex; gap: 16px; align-items: flex-start;">
                <img src="${book.cover}" alt="${escapeHtml(book.title)} cover" style="width: 88px; height: 124px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); object-fit: cover;" />
                <div style="flex: 1; min-width: 0; text-align: left;">
                  <div style="display: flex; justify-content: space-between; align-items: baseline; gap: 8px;">
                    <span class="eyebrow" style="font-size: 0.75rem; color: var(--muted); text-transform: uppercase; font-weight: bold;">${escapeHtml(book.subtitle)}</span>
                    <span style="font-weight: bold; color: #b01834; font-size: 0.95rem;">${currency(priceVal)} / ${usdCurrency(usdVal)}</span>
                  </div>
                  <h2 style="font-family: Georgia, serif; font-size: 1.3rem; margin: 4px 0 6px; color: var(--ink);">${escapeHtml(book.title)}</h2>
                  <p style="color: var(--muted); font-size: 0.85rem; line-height: 1.4; margin: 0 0 10px;">${escapeHtml(book.blurb)}</p>
                  
                  <p style="font-size: 0.8rem; font-weight: bold; margin: 0 0 12px; color: ${stateVal.owned ? "#2e7d32" : stateVal.requiresPrevious ? "#c62828" : "#e65100"};">
                    ${stateVal.owned ? "Unlocked and ready to read" : stateVal.requiresPrevious ? `Unlock Book ${book.order - 1} first` : "Available to unlock"}
                  </p>

                  <button 
                    class="${stateVal.owned ? "primary-btn" : "ghost-btn"}" 
                    style="width: 100%; min-height: 40px; border-radius: 6px; font-weight: bold;"
                    ${stateVal.requiresPrevious ? "disabled" : ""}
                    data-action="${stateVal.owned ? "read" : "unlock"}" 
                    data-book-id="${book.id}" 
                    data-chapter-id="${continueChapter?.chapter?.id || ""}">
                    ${stateVal.owned ? "Read" : stateVal.requiresPrevious ? "Locked" : "Unlock"}
                  </button>
                </div>
              </div>
            </section>
          `;
        }).join("")}
      </div>
    </div>
  `, "books");
}

function renderReader(chapterId) {
  const item = findChapter(chapterId) || flattenChapters()[0];
  if (!item) return shell(`<div class="empty-state">No chapters have been published yet.</div>`, "books");
  if (!hasBookAccess(item.book, item.chapter)) {
    setTimeout(() => showUnlockModal(item.book.id), 0);
    routeTo("books");
    return "";
  }

  state.currentChapter = item.chapter.id;
  if (state.user) state.user.lastChapterId = item.chapter.id;
  saveState();

  const settings = state.readerSettings;
  const all = flattenChapters();
  const index = all.findIndex((entry) => entry.chapter.id === item.chapter.id);
  const prev = all[index - 1];
  const next = all[index + 1];

  return html`
    <div class="reader-shell ${settings.theme}" style="--reader-font:${settings.font};--reader-size:${settings.size}px;--reader-line:${settings.line};--reader-align:${settings.align}">
      <header class="reader-topbar">
        <div class="reader-topbar-row-1" style="display: flex; align-items: center; gap: 12px; width: 100%;">
          <button class="reader-back-btn" data-route="books/${item.book.id}" aria-label="Go back" style="display: flex; align-items: center; justify-content: center; width: 40px; height: 40px; border: none; background: transparent; color: var(--reader-ink); cursor: pointer; padding: 0;">
            <svg class="back-arrow-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="width: 24px; height: 24px;">
              <line x1="19" y1="12" x2="5" y2="12"></line>
              <polyline points="12 19 5 12 12 5"></polyline>
            </svg>
          </button>
          <div class="reader-central-controls" style="display: flex; gap: 10px; flex: 1; justify-content: center;">
            <button class="reader-btn tts-btn" data-action="speak-chapter" style="display: inline-flex; align-items: center; justify-content: center; min-width: 88px; min-height: 38px; padding: 6px 14px; border: 1.5px solid #3d1054; border-radius: 20px; background: transparent; color: #3d1054; font-size: 0.85rem; font-weight: 700; cursor: pointer;">TTS</button>
            <button class="reader-btn save-btn" data-action="save-progress" style="display: inline-flex; align-items: center; justify-content: center; min-width: 88px; min-height: 38px; padding: 6px 14px; border: 1.5px solid #3d1054; border-radius: 20px; background: transparent; color: #3d1054; font-size: 0.85rem; font-weight: 700; cursor: pointer;">Save</button>
          </div>
          <button class="reader-gear-btn" data-action="toggle-settings" aria-label="Reading settings" style="display: flex; align-items: center; justify-content: center; width: 40px; height: 40px; border: none; background: transparent; color: #19111c; cursor: pointer; padding: 0; border-radius: 50%; flex-shrink: 0; transition: background-color 0.2s;">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" width="22" height="22">
              <circle cx="12" cy="12" r="3"/>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
            </svg>
          </button>
        </div>
          <div class="reader-topbar-row-2" style="display: flex; justify-content: center; width: 100%;">
          <div class="reader-meta-info" style="flex: 1; min-width: 0; text-align: center;">
            <h1 style="margin: 0; font-size: 1.05rem; font-weight: 700; color: #3d1054; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; text-align: center;">${escapeHtml(item.book.title)}</h1>
            <span style="font-size: 0.85rem; color: var(--muted); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; display: block; text-align: center;">Reading: ${escapeHtml(item.chapter.title)} - ${escapeHtml(item.chapter.subtitle)}</span>
          </div>
        </div>
      </header>

      <div id="settings-drawer" class="settings-drawer-wrapper" style="display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 100; flex-direction: column; justify-content: flex-end;" onclick="this.style.display='none'">
        <aside class="settings-drawer" aria-label="Reading settings" style="background: ${settings.theme === 'dark' ? '#1c1c1e' : '#fff'}; padding: 24px; border-top-left-radius: 24px; border-top-right-radius: 24px; color: ${settings.theme === 'dark' ? '#fff' : '#111'}; pointer-events: auto;" onclick="event.stopPropagation()">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
            <h2 style="margin: 0; font-size: 1.2rem; font-family: Georgia, serif;">Reader Settings</h2>
            <button onclick="document.getElementById('settings-drawer').style.display='none'" style="background: transparent; border: none; color: inherit; cursor: pointer;">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
          </div>

          <div style="display: grid; gap: 24px;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span style="font-weight: bold;">Typography</span>
              <div style="display: flex; background: ${settings.theme === 'dark' ? '#333' : '#f1f1f1'}; border-radius: 8px; padding: 4px;">
                <button data-action="set-reader-font" data-font="Georgia" style="padding: 8px 16px; border: none; border-radius: 4px; background: ${settings.font === 'Georgia' ? '#fff' : 'transparent'}; color: ${settings.font === 'Georgia' ? '#111' : 'inherit'}; font-weight: bold; font-family: Georgia, serif; cursor: pointer; box-shadow: ${settings.font === 'Georgia' ? '0 2px 4px rgba(0,0,0,0.1)' : 'none'};">Serif</button>
                <button data-action="set-reader-font" data-font="Inter" style="padding: 8px 16px; border: none; border-radius: 4px; background: ${settings.font !== 'Georgia' ? '#fff' : 'transparent'}; color: ${settings.font !== 'Georgia' ? '#111' : 'inherit'}; font-weight: bold; font-family: Inter, sans-serif; cursor: pointer; box-shadow: ${settings.font !== 'Georgia' ? '0 2px 4px rgba(0,0,0,0.1)' : 'none'};">Sans-serif</button>
              </div>
            </div>

            <div>
              <span style="font-weight: bold; display: block; margin-bottom: 12px;">Text Size</span>
              <div style="display: flex; align-items: center; gap: 16px;">
                <span style="font-size: 1rem; font-weight: bold;">A-</span>
                <input data-setting="size" type="range" min="16" max="28" value="${settings.size}" style="flex: 1; accent-color: var(--app-purple);" />
                <span style="font-size: 1.4rem; font-weight: bold;">A+</span>
              </div>
            </div>

            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span style="font-weight: bold;">Theme</span>
              <div style="display: flex; gap: 16px;">
                <button data-action="set-reader-theme" data-theme="light" style="width: 40px; height: 40px; border-radius: 50%; background: #ffffff; border: ${settings.theme === 'light' ? '2px solid var(--app-purple)' : '1px solid #ccc'}; cursor: pointer;" aria-label="Light"></button>
                <button data-action="set-reader-theme" data-theme="sepia" style="width: 40px; height: 40px; border-radius: 50%; background: #f4ecd8; border: ${settings.theme === 'sepia' ? '2px solid var(--app-purple)' : '1px solid #ccc'}; cursor: pointer;" aria-label="Sepia"></button>
                <button data-action="set-reader-theme" data-theme="dark" style="width: 40px; height: 40px; border-radius: 50%; background: #1c1c1e; border: ${settings.theme === 'dark' ? '2px solid var(--app-purple)' : '1px solid #555'}; cursor: pointer;" aria-label="Dark"></button>
              </div>
            </div>

            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span style="font-weight: bold;">Page turning layout</span>
              <label style="display: inline-flex; align-items: center; cursor: pointer;">
                <input type="checkbox" style="appearance: none; width: 44px; height: 24px; background: #ccc; border-radius: 12px; position: relative; transition: 0.3s;" class="toggle-switch" />
              </label>
            </div>

            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span style="font-weight: bold;">Audio auto-play</span>
              <label style="display: inline-flex; align-items: center; cursor: pointer;">
                <input type="checkbox" ${settings.autoplay ? 'checked' : ''} data-action="toggle-autoplay" style="appearance: none; width: 44px; height: 24px; background: ${settings.autoplay ? 'var(--app-purple)' : '#ccc'}; border-radius: 12px; position: relative; transition: 0.3s;" class="toggle-switch active-purple" />
              </label>
            </div>
          </div>
        </aside>
      </div>

      <article class="reader-body" id="reader-body" style="padding-bottom: 100px;">
        <h2>${escapeHtml(item.chapter.subtitle)}</h2>
        ${item.chapter.content.map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join("")}
        
        <div style="display: flex; justify-content: space-between; margin-top: 40px; padding-top: 20px; border-top: 1px solid rgba(128,105,90,0.2);">
          <button class="ghost-btn" ${!prev ? 'disabled' : ''} data-route="${prev ? `reader/${prev.chapter.id}` : ''}">Previous</button>
          <button class="ghost-btn" ${!next ? 'disabled' : ''} data-action="${next ? (hasBookAccess(next.book, next.chapter) ? 'read' : 'unlock') : ''}" data-book-id="${next?.book.id}" data-chapter-id="${next?.chapter.id}">Next</button>
        </div>
      </article>

      <div class="reader-bottom-bar" style="position: fixed; bottom: 0; left: 0; right: 0; background: ${settings.theme === 'dark' ? '#111' : '#fff'}; border-top: 1px solid rgba(128,105,90,0.2); padding: 16px 24px; display: flex; justify-content: space-between; align-items: center; z-index: 50;">
        <label style="display: flex; align-items: center; gap: 12px; cursor: pointer; font-weight: bold; color: ${settings.theme === 'dark' ? '#fff' : '#111'};">
          Audio auto-play
          <input type="checkbox" ${settings.autoplay ? 'checked' : ''} data-action="toggle-autoplay" style="appearance: none; width: 44px; height: 24px; background: ${settings.autoplay ? 'var(--app-purple)' : '#ccc'}; border-radius: 12px; position: relative;" class="toggle-switch active-purple" />
        </label>
        <button onclick="document.getElementById('settings-drawer').style.display='flex'" style="background: transparent; border: none; font-weight: bold; font-size: 1.2rem; color: ${settings.theme === 'dark' ? '#fff' : '#111'}; cursor: pointer;">Aa</button>
      </div>
    </div>
  `;
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

function renderCommunity() {
  const query = state.communityQuery || "";
  const sort = state.communitySort || "newest";
  const surface = state.communitySurface || "feed";
  const selectedPostId = state.selectedPostId || null;
  const composerOpen = state.composerOpen || false;
  const shareSuccessPost = state.shareSuccessPost || null;
  const historyType = state.historyType || "posts";

  const posts = state.posts || [];
  const leaders = getCommunityLeaders(posts).slice(0, 5);

  const sortedPosts = [...posts].sort((a, b) => {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;

    if (sort === "oldest") return new Date(a.createdAt) - new Date(b.createdAt);
    if (sort === "liked") return (b.likes || 0) - (a.likes || 0);
    if (sort === "replied") return (b.comments?.length || 0) - (a.comments?.length || 0);
    return new Date(b.createdAt) - new Date(a.createdAt);
  }).filter((post) => {
    const searchStr = `${post.username} ${post.content}`.toLowerCase();
    return searchStr.includes(query.toLowerCase());
  });

  const selectedPost = selectedPostId ? posts.find((p) => p.id === selectedPostId) : null;
  const userPosts = posts.filter((p) => p.userId === state.user?.id);
  const userComments = posts.flatMap((post) => 
    (post.comments || [])
      .filter((c) => c.userId === state.user?.id || c.user === (state.user?.username || state.user?.fullName))
      .map((c) => ({ ...c, post }))
  );

  let mainContent = "";

  if (surface === "feed" && !selectedPost) {
    mainContent = html`
      <div class="feed-toolbar" style="display: flex; gap: 12px; justify-content: space-between; align-items: center; margin-bottom: 16px; flex-wrap: wrap;">
        <label style="display: flex; align-items: center; gap: 8px; font-size: 0.9rem;">
          Search: 
          <input type="text" id="community-search" value="${escapeHtml(query)}" placeholder="Search reviews..." style="padding: 6px 10px; border: 1px solid var(--line); border-radius: 6px; background: transparent; color: inherit;" />
        </label>
        <button class="ghost-btn" id="btn-open-sort" style="color: #b01834; font-weight: bold;">Sort <span>▼</span></button>
      </div>

      <div class="community-feed" style="display: grid; gap: 16px;">
        ${sortedPosts.length ? sortedPosts.map((post) => {
          const liked = post.likedBy?.includes(state.user?.id);
          const copy = splitPostContent(post.content);
          return html`
            <article class="post-card" style="border: 1px solid rgba(128, 105, 90, 0.16); border-radius: 12px; padding: 16px; background: color-mix(in srgb, var(--reader-bg, #fff) 98%, transparent); text-align: left;">
              <div class="review-author" style="display: flex; gap: 12px; align-items: center; margin-bottom: 12px;">
                <div class="avatar" style="width: 36px; height: 36px; background: #b01834; color: #fff; display: flex; align-items: center; justify-content: center; border-radius: 50%; font-weight: bold;">
                  ${escapeHtml((post.avatar || post.username || "A").slice(0, 1))}
                </div>
                <div>
                  <strong style="display: block; font-size: 0.95rem;">${escapeHtml(post.username)}</strong>
                  <span style="font-size: 0.75rem; color: var(--muted);">${escapeHtml(post.country)} · ${new Date(post.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
              <h3 style="margin: 0 0 8px; font-size: 1.15rem; font-family: Georgia, serif; color: var(--ink);">${escapeHtml(copy.title)}</h3>
              <p style="margin: 0 0 14px; font-size: 0.92rem; line-height: 1.5; color: var(--ink); white-space: pre-wrap;">${escapeHtml(copy.body)}</p>
              
              <div class="inline-actions" style="display: flex; gap: 16px; border-top: 1px solid rgba(128, 105, 90, 0.1); padding-top: 12px;">
                <button class="ghost-btn" data-action="like-post" data-post-id="${post.id}" style="min-height: auto; padding: 4px 8px; font-size: 0.85rem;">
                  ${liked ? "Liked" : "Like"} (${post.likes || 0})
                </button>
                <button class="ghost-btn" data-action="comment-post-details" data-post-id="${post.id}" style="min-height: auto; padding: 4px 8px; font-size: 0.85rem;">
                  Replies (${post.comments?.length || 0})
                </button>
                <button class="ghost-btn" data-action="share-post" data-post-id="${post.id}" style="min-height: auto; padding: 4px 8px; font-size: 0.85rem;">
                  Share
                </button>
              </div>
            </article>
          `;
        }).join("") : `<div class="empty-state">No reviews match your search query.</div>`}
      </div>

      <button class="compose-fab" id="btn-compose-fab" style="position: fixed; right: 24px; bottom: 90px; width: 56px; height: 56px; border-radius: 50%; background: #b01834; color: #fff; border: none; font-size: 1.5rem; font-weight: bold; cursor: pointer; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(176,24,52,0.4); z-index: 99;">+</button>
    `;

  } else if (surface === "feed" && selectedPost) {
    const copy = splitPostContent(selectedPost.content);
    const commentsList = selectedPost.comments || [];
    const rootComments = commentsList.filter((c) => !c.parentId);

    mainContent = html`
      <section class="review-detail" style="text-align: left; display: grid; gap: 20px;">
        <button class="ghost-btn" id="btn-back-to-reviews" style="width: fit-content; min-height: auto; padding: 6px 12px;">← Back to reviews</button>
        
        <article class="post-card" style="border: 1px solid rgba(128, 105, 90, 0.28); border-radius: 12px; padding: 16px; background: color-mix(in srgb, var(--reader-bg, #fff) 98%, transparent);">
          <div class="review-author" style="display: flex; gap: 12px; align-items: center; margin-bottom: 12px;">
            <div class="avatar" style="width: 36px; height: 36px; background: #b01834; color: #fff; display: flex; align-items: center; justify-content: center; border-radius: 50%; font-weight: bold;">
              ${escapeHtml((selectedPost.avatar || selectedPost.username || "A").slice(0, 1))}
            </div>
            <div>
              <strong style="display: block; font-size: 0.95rem;">${escapeHtml(selectedPost.username)}</strong>
              <span style="font-size: 0.75rem; color: var(--muted);">${escapeHtml(selectedPost.country)} · ${new Date(selectedPost.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
          <h3 style="margin: 0 0 8px; font-size: 1.35rem; font-family: Georgia, serif; color: var(--ink);">${escapeHtml(copy.title)}</h3>
          <p style="margin: 0 0 14px; font-size: 1rem; line-height: 1.6; color: var(--ink); white-space: pre-wrap;">${escapeHtml(copy.body)}</p>
          
          <div class="inline-actions" style="display: flex; gap: 16px; border-top: 1px solid rgba(128, 105, 90, 0.1); padding-top: 12px;">
            <button class="ghost-btn" data-action="like-post" data-post-id="${selectedPost.id}" style="min-height: auto; padding: 4px 8px; font-size: 0.85rem;">
              ${selectedPost.likedBy?.includes(state.user?.id) ? "Liked" : "Like"} (${selectedPost.likes || 0})
            </button>
            <button class="ghost-btn" data-action="share-post" data-post-id="${selectedPost.id}" style="min-height: auto; padding: 4px 8px; font-size: 0.85rem;">
              Share
            </button>
          </div>
        </article>

        <div class="reply-heading" style="display: flex; align-items: center; gap: 8px; margin-top: 8px;">
          <h2 style="margin: 0; font-size: 1.25rem;">Replies</h2>
          <span style="background: rgba(128, 105, 90, 0.16); padding: 2px 8px; border-radius: 12px; font-size: 0.8rem; font-weight: bold;">${commentsList.length}</span>
        </div>

        <div class="comment-form-panel" style="border: 1px solid rgba(128, 105, 90, 0.16); border-radius: 12px; padding: 12px; background: color-mix(in srgb, var(--reader-bg, #fff) 99%, transparent);">
          <form id="top-comment-form" style="display: flex; gap: 8px;">
            <input type="text" name="commentText" placeholder="Add a comment..." required style="flex: 1; padding: 8px 12px; border: 1px solid var(--line); border-radius: 8px; background: transparent; color: inherit;" />
            <button class="primary-btn" type="submit" style="min-height: auto; padding: 8px 16px; border-radius: 8px;">Send</button>
          </form>
        </div>

        <div class="comment-list" style="display: grid; gap: 16px; margin-top: 8px;">
          ${rootComments.length ? rootComments.map((comment) => {
            const replies = commentsList.filter((r) => r.parentId === comment.id);
            return html`
              <div class="comment-item" style="border-left: 2px solid #b01834; padding-left: 12px; margin-bottom: 8px;">
                <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
                  <div style="width: 24px; height: 24px; border-radius: 50%; background: #b01834; color: #fff; display: flex; align-items: center; justify-content: center; font-size: 0.75rem; font-weight: bold;">
                    ${escapeHtml((comment.avatar || comment.user || "A").slice(0, 1))}
                  </div>
                  <div>
                    <strong style="font-size: 0.85rem;">${escapeHtml(comment.user)}</strong>
                    <span style="font-size: 0.7rem; color: var(--muted); margin-left: 6px;">${escapeHtml(comment.country)}</span>
                  </div>
                </div>
                <p style="margin: 0 0 6px; font-size: 0.9rem; color: var(--ink);">${escapeHtml(comment.text)}</p>
                <button class="reply-link" data-comment-id="${comment.id}" style="border: none; background: transparent; color: #b01834; font-size: 0.8rem; font-weight: bold; cursor: pointer; padding: 0; margin-bottom: 8px;">Reply</button>
                
                <div class="reply-form-container" id="reply-form-${comment.id}" style="display: none; margin: 8px 0;">
                  <form class="nested-comment-form" data-parent-id="${comment.id}" style="display: flex; gap: 8px;">
                    <input type="text" name="replyText" placeholder="Write a reply..." required style="flex: 1; padding: 6px 10px; border: 1px solid var(--line); border-radius: 6px; background: transparent; color: inherit; font-size: 0.85rem;" />
                    <button class="primary-btn" type="submit" style="min-height: auto; padding: 6px 12px; border-radius: 6px; font-size: 0.85rem;">Send</button>
                  </form>
                </div>

                <div class="nested-replies" style="margin-left: 16px; display: grid; gap: 10px; margin-top: 10px;">
                  ${replies.map((reply) => html`
                    <div class="comment-item nested" style="border-left: 2px dashed var(--line); padding-left: 8px;">
                      <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
                        <div style="width: 20px; height: 20px; border-radius: 50%; background: var(--muted); color: #fff; display: flex; align-items: center; justify-content: center; font-size: 0.7rem; font-weight: bold;">
                          ${escapeHtml((reply.avatar || reply.user || "A").slice(0, 1))}
                        </div>
                        <div>
                          <strong style="font-size: 0.8rem;">${escapeHtml(reply.user)}</strong>
                          <span style="font-size: 0.65rem; color: var(--muted); margin-left: 6px;">${escapeHtml(reply.country)}</span>
                        </div>
                      </div>
                      <p style="margin: 0; font-size: 0.85rem; color: var(--ink);">${escapeHtml(reply.text)}</p>
                    </div>
                  `).join("")}
                </div>
              </div>
            `;
          }).join("") : `<div class="empty-state">No replies yet. Be the first to comment!</div>`}
        </div>
      </section>
    `;

  } else if (surface === "history") {
    mainContent = html`
      <section class="history-screen" style="text-align: left; display: grid; gap: 16px; margin-top: 24px;">
        <div style="display: grid; gap: 16px;">
          ${historyType === "posts"
            ? (userPosts.length ? userPosts.map((post) => {
                const copy = splitPostContent(post.content);
                return html`
                  <article class="post-card btn-view-historical-post" data-post-id="${post.id}" style="border: 1px solid #111; border-radius: 12px; padding: 16px; background: transparent; cursor: pointer;">
                    <h3 style="margin: 0 0 8px; font-size: 1.2rem; color: #b01834;">${escapeHtml(copy.title)}</h3>
                    <p style="margin: 0 0 12px; font-size: 0.95rem; color: #4b5563; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden;">${escapeHtml(copy.body)}</p>
                    <span style="font-size: 0.8rem; color: var(--muted); display: block;">${new Date(post.createdAt).toLocaleDateString()}</span>
                  </article>
                `;
              }).join("") : `<div class="empty-state">You haven't posted any reviews yet.</div>`)
            : (userComments.length ? userComments.map((comment) => {
                const copy = splitPostContent(comment.post.content);
                return html`
                  <article class="history-comment btn-view-historical-post" data-post-id="${comment.post.id}" style="border: 1px solid #111; border-radius: 12px; padding: 16px; background: transparent; cursor: pointer;">
                    <p style="margin: 0 0 8px; font-size: 0.95rem; color: #4b5563;">${escapeHtml(comment.text)}</p>
                    <span style="font-size: 0.8rem; color: var(--muted); display: block;">${new Date(comment.createdAt || Date.now()).toLocaleDateString()}</span>
                  </article>
                `;
              }).join("") : `<div class="empty-state">You haven't posted any comments yet.</div>`)
          }
        </div>
      </section>
    `;

  } else if (surface === "notifications") {
    const myPostIds = userPosts.map((p) => p.id);
    const notificationsList = posts
      .flatMap((p) => (p.comments || []).map((c) => ({ ...c, post: p })))
      .filter((c) => myPostIds.includes(c.post.id) && c.user !== (state.user?.username || state.user?.fullName))
      .slice(0, 12);

    mainContent = html`
      <section class="notification-list" style="margin-top: 24px; display: grid; gap: 12px; text-align: left;">
        ${state.posts.flatMap((post) => (post.comments || []).map((comment) => ({ ...comment, post }))).slice(0, 12).map((notice, index) => html`
          <article class="notification-item" style="display: flex; gap: 16px; padding: 16px; background: #1c1c1e; color: white; border-radius: 12px; align-items: flex-start;">
            <div class="avatar" style="width: 40px; height: 40px; border-radius: 50%; background: #b01834; color: white; display: flex; align-items: center; justify-content: center; font-weight: bold; flex-shrink: 0;">${notice.avatar || notice.user?.slice(0, 1) || "A"}</div>
            <div>
              <p style="margin: 0 0 4px; font-size: 0.95rem;"><strong>${escapeHtml(notice.user)}</strong> replied to “${escapeHtml(splitPostContent(notice.post.content).title)}”</p>
              <p style="margin: 0 0 8px; font-size: 0.9rem; color: #9ca3af;">"${escapeHtml(notice.text)}"</p>
              <span style="font-size: 0.8rem; color: #6b7280;">${new Date(notice.createdAt || Date.now()).toLocaleDateString()}</span>
            </div>
          </article>
        `).join("")}
        ${!state.posts.some((post) => post.comments?.length) ? `<div class="empty-state">No notifications yet.</div>` : ""}
      </section>
    `;
  } else if (surface === "compose") {
    mainContent = html`
      <section class="compose-screen">
        <form class="review-composer" id="review-composer-form" style="display: grid; gap: 20px;">
          <label style="display: grid; gap: 8px; color: #b01834;">Title
            <input name="composerTitle" id="composer-title-input" maxLength="30" placeholder="What is the headline?" required style="padding: 16px; border-radius: 8px; border: 1px solid #111; background: transparent;" />
          </label>
          <label style="display: grid; gap: 8px; color: #b01834;">Review
            <textarea name="composerReview" id="composer-review-input" maxLength="250" placeholder="What is your experience?" required style="padding: 16px; border-radius: 8px; border: 1px solid #111; background: transparent; min-height: 160px;"></textarea>
          </label>
          <button class="ghost-btn" type="submit" style="border-color: #b01834; color: #b01834; font-weight: bold;">Post</button>
        </form>
      </section>
    `;
  } else if (surface === "sort") {
    mainContent = html`
      <section class="sort-screen" style="margin-top: 24px;">
        <form style="display: grid; gap: 16px;">
          ${["newest", "oldest", "liked", "replied"].map((sortOption) => html`
            <label style="display: flex; align-items: center; gap: 12px; padding: 16px; border-radius: 8px; border: 1px solid #111; cursor: pointer; background: ${sort === sortOption ? 'rgba(0,0,0,0.05)' : 'transparent'};">
              <input type="radio" name="sort" value="${sortOption}" ${sort === sortOption ? "checked" : ""} class="community-sort-radio" style="transform: scale(1.5); accent-color: #b01834;" />
              <span style="font-size: 1.1rem; text-transform: capitalize;">
                ${sortOption === "liked" ? "Most Liked" : sortOption === "replied" ? "Most Replied" : sortOption}
              </span>
            </label>
          `).join("")}
        </form>
      </section>
    `;
  }

  return shell(html`
    <div class="community-screen" style="max-width: 800px; margin: 0 auto; display: grid; gap: 20px; padding: 16px;">
      <header class="community-header" style="display: flex; justify-content: space-between; align-items: center; text-align: left;">
        <h1 style="font-family: Georgia, serif; font-size: 2.2rem; margin: 0; color: #b01834;">
          ${surface === "notifications" ? "Notifications" : surface === "history" ? "History" : surface === "compose" ? "Write a Review" : surface === "sort" ? "Sort" : "Community"}
        </h1>
        <div class="community-tools" style="display: flex; gap: 12px;">
          ${surface !== "feed" || selectedPostId ? html`<button class="circle-icon-btn" id="btn-community-back" aria-label="Back">
            <svg viewBox="0 0 24 24"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
          </button>` : ""}
          ${surface === "feed" && !selectedPostId ? html`
            <button class="circle-icon-btn" onclick="document.getElementById('community-search')?.focus()" aria-label="Search">
              <svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            </button>
            <button class="circle-icon-btn" id="btn-community-alerts" aria-label="Alerts">
              <svg viewBox="0 0 24 24"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
            </button>
            <button class="circle-icon-btn" id="btn-community-history" aria-label="History">
              <svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
            </button>
          ` : ""}
          ${surface === "history" ? html`
            <select id="community-history-type" style="padding: 8px 12px; border-radius: 8px; border: none; background: #b01834; color: white; font-weight: bold;">
              <option value="posts" ${historyType === "posts" ? "selected" : ""}>Posts ▼</option>
              <option value="comments" ${historyType === "comments" ? "selected" : ""}>Comments ▼</option>
            </select>
          ` : ""}
        </div>
      </header>

      <section class="leader-section community-leaders" aria-label="Community leaders" style="text-align: left; border: 1px solid rgba(128, 105, 90, 0.16); border-radius: 12px; padding: 12px; background: color-mix(in srgb, var(--reader-bg, #fff) 99%, transparent);">
        <div class="leader-title" style="display: flex; align-items: center; gap: 10px; margin-bottom: 12px;">
          <div class="leader-title-copy">
            <h2 style="margin: 0; font-family: Georgia, serif; font-size: 1.15rem; color: #b01834;">Community Leaders</h2>
            <p style="margin: 0; font-size: 0.75rem; color: var(--muted);">Top contributors this week (tap to filter feed)</p>
          </div>
          ${query ? html`<button class="ghost-btn" id="btn-clear-leader-filter" style="min-height: auto; padding: 2px 6px; font-size: 0.75rem; border-radius: 4px;">Clear filter</button>` : ""}
        </div>
        
        <div class="leader-strip" style="display: flex; gap: 8px; overflow-x: auto; padding-bottom: 6px; scrollbar-width: thin;" role="list">
          ${leaders.map((leader, idx) => html`
            <button class="leader-chip btn-leader-chip" data-name="${escapeHtml(leader.name)}" style="flex: 0 0 auto; display: flex; flex-direction: column; align-items: center; width: 88px; border: 1px solid ${query.toLowerCase() === leader.name.toLowerCase() ? "#b01834" : "rgba(128,105,90,0.15)"}; border-radius: 8px; background: ${query.toLowerCase() === leader.name.toLowerCase() ? "rgba(176,24,52,0.05)" : "transparent"}; padding: 8px; cursor: pointer; color: inherit;" role="listitem">
              <div class="leader-avatar" style="width: 44px; height: 44px; border-radius: 50%; background: #b01834; color: #fff; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 0.9rem; margin-bottom: 6px;">
                ${escapeHtml((leader.avatar || leader.name || "A").slice(0, 1))}
              </div>
              <span style="font-size: 0.75rem; font-weight: bold; overflow: hidden; text-overflow: ellipsis; width: 100%; text-align: center;">${escapeHtml(leader.name)}</span>
              <span style="font-size: 0.65rem; color: var(--muted);">${leader.points} pts</span>
            </button>
          `).join("")}
        </div>
      </section>

      ${mainContent}
    </div>

    ${shareSuccessPost ? html`
      <div class="modal-backdrop" role="presentation" id="share-success-backdrop" style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000;">
        <section class="share-success" role="dialog" aria-modal="true" style="background: #f3f4f6; padding: 32px 24px; border-radius: 16px; text-align: left; width: min(360px, 90vw);" onmousedown="event.stopPropagation()">
          <h2 style="color: #b01834; margin: 0 0 16px; font-size: 1.4rem;">Post Successful.</h2>
          <p style="margin: 0 0 24px; color: #4b5563; line-height: 1.5;">Your Review/Comment has been posted in the Community.<br/><br/>You may also share your Review with friends on your social media channels.</p>
          <div class="share-actions" style="display: flex; gap: 12px; justify-content: center;">
            <button class="circle-icon-btn btn-share-platform" data-platform="facebook" style="background: #1877F2; border: none; color: white;">f</button>
            <button class="circle-icon-btn btn-share-platform" data-platform="x" style="background: #000; border: none; color: white;">X</button>
            <button class="circle-icon-btn btn-share-platform" data-platform="instagram" style="background: #E4405F; border: none; color: white;">in</button>
            <button class="circle-icon-btn btn-share-platform" data-platform="whatsapp" style="background: #25D366; border: none; color: white;">W</button>
            <button class="circle-icon-btn btn-share-platform" data-platform="linkedin" style="background: #0A66C2; border: none; color: white;">in</button>
          </div>
          <button class="primary-btn" id="btn-share-done" style="width: 100%; border-radius: 8px; font-weight: bold; margin-top: 24px; display: none;">Done</button>
        </section>
      </div>
    ` : ""}
  `, "community");
}

function renderNotices() {
  const userNotices = state.notifications.filter((notice) => !notice.userId || notice.userId === state.user?.id);
  const userGifts = state.gifts.filter((gift) => gift.senderUserId === state.user?.id || gift.recipientEmail === state.user?.email);
  return shell(html`
    <div class="content-stack">
      <section class="form-panel">
        <div class="section-heading">
          <div>
            <h2>Gifts and Notices</h2>
            <p>Send the trilogy, redeem access codes, and track recipient milestones.</p>
          </div>
        </div>
        <div class="two-col">
          <div class="form-grid">
            <label>Recipient email<input name="giftEmail" type="email" placeholder="friend@example.com"></label>
            <label>Gift message<input name="giftMessage" placeholder="I thought you would love this."></label>
            <button class="primary-btn" data-action="send-gift">Send Gift ${currency(state.settings.giftPrice)}</button>
          </div>
          <div class="form-grid">
            <label>Access code<input name="accessCode" placeholder="8-character code"></label>
            <button class="ghost-btn" data-action="redeem-gift">Redeem Code</button>
          </div>
        </div>
      </section>
      <section class="grid">
        ${userGifts.length ? userGifts.map(renderGift).join("") : `<div class="empty-state">No gift activity yet.</div>`}
        ${userNotices.map((notice) => `<article class="notice-card"><h3>${escapeHtml(notice.title)}</h3><p>${escapeHtml(notice.body)}</p></article>`).join("")}
      </section>
    </div>
  `, "notices");
}

function renderGift(gift) {
  return html`
    <article class="notice-card">
      <div class="chapter-meta"><span>${gift.status}</span><span>${gift.accessCode}</span></div>
      <h3>${escapeHtml(gift.recipientEmail)}</h3>
      <p>Email sent · Code generated · ${gift.redeemedByUserId ? "Redeemed" : "Waiting for recipient"} · Started reading: ${gift.started ? "Yes" : "No"}</p>
    </article>
  `;
}

function renderProfile() {
  const purchases = currentUserPurchases();
  return shell(html`
    <div class="profile-screen" style="max-width: 800px; margin: 0 auto; padding: 16px; background: var(--reader-bg, #fff); min-height: 100vh;">
      <header class="profile-header" style="display: flex; align-items: center; margin-bottom: 32px;">
        <button class="circle-icon-btn" onclick="window.history.back()" aria-label="Back" style="border: none; background: transparent; cursor: pointer;">
          <svg viewBox="0 0 24 24" width="24" height="24"><path d="M19 12H5M12 19l-7-7 7-7" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </button>
        <h1 style="font-family: Georgia, serif; color: #b01834; margin: 0 auto; font-size: 1.6rem;">ASCENDANCE</h1>
        <div style="width: 40px;"></div>
      </header>

      <section class="profile-form-section" style="display: grid; gap: 20px; margin-bottom: 32px;">
        <form onsubmit="event.preventDefault();" style="display: grid; gap: 20px;">
          <label style="display: grid; gap: 8px; color: #b01834;">Phone number
            <input name="profilePhone" value="${escapeHtml(state.user.phone || "")}" placeholder="+1 9289 982 928" style="padding: 16px; border-radius: 8px; border: 1px solid #111; background: transparent; color: inherit;" />
          </label>
          <label style="display: grid; gap: 8px; color: #b01834;">Country
            <input name="profileCountry" value="${escapeHtml(state.user.country || "")}" placeholder="United States" style="padding: 16px; border-radius: 8px; border: 1px solid #111; background: transparent; color: inherit;" />
          </label>
          <button class="primary-btn" data-action="update-profile" style="min-height: 56px; border-radius: 8px; font-weight: bold;">Save Profile</button>
          <button class="ghost-btn" data-action="logout" style="border: none; color: #b01834; font-weight: bold;">Log Out</button>
        </form>
      </section>

      <section class="profile-stats" style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 32px;">
        <article style="border: 1px solid #111; border-radius: 12px; padding: 16px; display: flex; align-items: center; gap: 12px;">
          <strong style="font-size: 1.5rem; color: #b01834;">${purchases.length}</strong>
          <span style="font-size: 0.9rem; color: var(--ink);">Purchases</span>
        </article>
        <article style="border: 1px solid #111; border-radius: 12px; padding: 16px; display: flex; align-items: center; gap: 12px;">
          <strong style="font-size: 1.5rem; color: #b01834;">${Object.keys(state.progress).length}</strong>
          <span style="font-size: 0.9rem; color: var(--ink);">Saved chapters</span>
        </article>
      </section>

      <section class="profile-share" style="text-align: center; display: grid; gap: 16px; margin-bottom: 32px;">
        <p style="margin: 0; color: var(--ink); font-size: 0.95rem;">Help more people to read these book by sharing out this webapp with your friends</p>
        <button class="ghost-btn" data-action="share-app-modal" style="border-color: #b01834; color: #b01834; font-weight: bold;">Share WebApp Link</button>
      </section>

      <section class="profile-install" style="text-align: center;">
        <button data-action="install" style="background: transparent; border: none; color: #b01834; font-weight: bold; font-size: 1rem; cursor: pointer; display: inline-flex; align-items: center; gap: 8px;">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
          Install icon on Device
        </button>
      </section>
    </div>
  `, "profile");
}

function renderAdmin() {
  const tab = state.adminTab || "dashboard";
  const tabs = ["dashboard", "books", "readers", "analytics", "transactions", "settings", "community"];
  return html`
    <div class="admin-shell">
      <header class="topbar">
        <div class="brand-lockup"><strong>Ascendance Admin</strong><span>Publisher backend</span></div>
        <div class="top-actions"><button class="ghost-btn" data-route="home">Reader App</button></div>
      </header>
      <main class="main">
        <div class="admin-heading">
          <p class="eyebrow">Secure backend prototype</p>
          <h1>${tab[0].toUpperCase()}${tab.slice(1)}</h1>
        </div>
        <nav class="admin-tabs">
          ${tabs.map((item) => `<button class="pill-btn ${tab === item ? "is-active" : ""}" data-action="admin-tab" data-tab="${item}">${item}</button>`).join("")}
        </nav>
        ${renderAdminTab(tab)}
      </main>
    </div>
  `;
}

function renderAdminTab(tab) {
  if (tab === "books") return renderAdminBooks();
  if (tab === "readers") return renderAdminReaders();
  if (tab === "analytics") return renderAdminAnalytics();
  if (tab === "transactions") return renderAdminTransactions();
  if (tab === "settings") return renderAdminSettings();
  if (tab === "community") return renderAdminCommunity();

  const revenue = state.transactions.filter((tx) => tx.status === "Successful").reduce((sum, tx) => sum + tx.amount, 0);
  return html`
    <div class="grid dashboard-grid">
      <article class="stat-card"><strong>${state.users.length}</strong><span>Total readers</span></article>
      <article class="stat-card"><strong>${state.books.length}</strong><span>Books uploaded</span></article>
      <article class="stat-card"><strong>${state.purchases.length}</strong><span>Total purchases</span></article>
      <article class="stat-card"><strong>${currency(revenue)}</strong><span>Total revenue</span></article>
      <article class="stat-card"><strong>${state.gifts.length}</strong><span>Gifts sent</span></article>
      <article class="stat-card"><strong>${state.gifts.filter((gift) => gift.status === "Redeemed").length}</strong><span>Redeemed codes</span></article>
    </div>
  `;
}

function renderAdminBooks() {
  return html`
    <div class="content-stack">
      <section class="form-panel">
        <h2>Create Book</h2>
        <div class="two-col">
          <label>Title<input name="adminBookTitle" placeholder="New book title"></label>
          <label>Subtitle<input name="adminBookSubtitle" placeholder="Book Four"></label>
          <label>Price<input name="adminBookPrice" type="number" placeholder="4500"></label>
          <label>Status<select name="adminBookStatus"><option>Draft</option><option>Published</option><option>Hidden</option></select></label>
        </div>
        <label>Blurb<textarea name="adminBookBlurb" placeholder="Short description"></textarea></label>
        <button class="primary-btn" data-action="admin-create-book">Save Book</button>
      </section>
      ${state.books.map((book) => `
        <section class="admin-panel">
          <div class="section-heading">
            <div><h2>${escapeHtml(book.title)}</h2><p>${book.sections.length} sections · ${currency(book.price)} · ${book.status}</p></div>
            <button class="ghost-btn" data-action="admin-add-chapter" data-book-id="${book.id}">Add Chapter</button>
          </div>
        </section>
      `).join("")}
    </div>
  `;
}

function renderAdminReaders() {
  return renderTable(["Name", "Email", "Phone", "Country", "Last login"], state.users.map((user) => [user.fullName, user.email, user.phone || "-", user.country || "-", user.lastLogin || "-"]));
}

function renderAdminAnalytics() {
  const rows = state.users.map((user) => {
    const last = user.lastChapterId ? findChapter(user.lastChapterId) : null;
    return [user.fullName, last?.book.title || "-", last?.chapter.title || "-", last ? `${state.progress[last.chapter.id]?.percentage || 0}%` : "0%", user.lastLogin || "-"];
  });
  return renderTable(["Reader", "Current book", "Current chapter", "Progress", "Last login"], rows);
}

function renderAdminTransactions() {
  return renderTable(
    ["Reader", "Amount", "Product", "Gateway", "Reference", "Status", "Date"],
    state.transactions.map((tx) => [tx.email, currency(tx.amount), tx.product, tx.gateway, tx.reference, tx.status, new Date(tx.createdAt).toLocaleString()])
  );
}

function renderAdminSettings() {
  const s = state.settings;
  return html`
    <section class="form-panel">
      <h2>Pricing and Rules</h2>
      <div class="two-col">
        <label>Book One price<input name="settingBookOnePrice" type="number" value="${s.bookOnePrice}"></label>
        <label>Book Two price<input name="settingBookTwoPrice" type="number" value="${s.bookTwoPrice}"></label>
        <label>Book Three price<input name="settingBookThreePrice" type="number" value="${s.bookThreePrice}"></label>
        <label>Trilogy price<input name="settingTrilogyPrice" type="number" value="${s.trilogyPrice}"></label>
        <label>Gift price<input name="settingGiftPrice" type="number" value="${s.giftPrice}"></label>
        <label>Weekly gift limit<input name="settingGiftLimit" type="number" value="${s.giftLimit}"></label>
      </div>
      <button class="primary-btn" data-action="save-settings">Save Settings</button>
    </section>
  `;
}

function renderAdminCommunity() {
  return html`
    <div class="grid">
      ${state.posts.map((post) => `
        <article class="post-card">
          <div class="chapter-meta"><span>${post.status}</span><span>${post.likes} likes</span></div>
          <h3>${escapeHtml(post.username)}</h3>
          <p>${escapeHtml(post.content)}</p>
          <div class="inline-actions">
            <button class="ghost-btn" data-action="admin-pin-post" data-post-id="${post.id}">${post.pinned ? "Unpin" : "Pin"}</button>
            <button class="danger-btn" data-action="admin-hide-post" data-post-id="${post.id}">${post.status === "Hidden" ? "Show" : "Hide"}</button>
          </div>
        </article>
      `).join("")}
    </div>
  `;
}

function renderTable(headers, rows) {
  if (!rows.length) return `<div class="empty-state">No records yet.</div>`;
  return html`
    <section class="admin-panel table-wrap">
      <table>
        <thead><tr>${headers.map((header) => `<th>${header}</th>`).join("")}</tr></thead>
        <tbody>${rows.map((row) => `<tr>${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join("")}</tr>`).join("")}</tbody>
      </table>
    </section>
  `;
}

function bindEvents() {
  app.querySelectorAll("[data-route]").forEach((node) => node.addEventListener("click", (event) => routeTo(event.currentTarget.dataset.route)));
  app.querySelectorAll("[data-action]").forEach((node) => node.addEventListener("click", handleAction));
  app.querySelectorAll("[data-setting]").forEach((node) => node.addEventListener("input", updateReaderSetting));
  app.querySelectorAll(".store-deal-radio").forEach((node) => node.addEventListener("change", (e) => {
    state.storeDealSelection = e.target.value;
    render();
  }));
  if (getRoute().startsWith("reader/")) {
    window.addEventListener("scroll", saveReaderProgress, { passive: true });
  } else {
    window.removeEventListener("scroll", saveReaderProgress);
  }

  if (route.startsWith("auth")) {
    const audio = document.getElementById("auth-audio-element");
    const playBtn = document.getElementById("auth-audio-play-btn");
    const statusText = document.getElementById("auth-audio-status");
    const timeText = document.getElementById("auth-audio-time");
    const durationText = document.getElementById("auth-audio-duration");
    const seekSlider = document.getElementById("auth-audio-seek");
    const volSlider = document.getElementById("auth-audio-volume");

    if (audio && playBtn) {
      const formatTime = (time) => {
        if (isNaN(time)) return "0:00";
        const mins = Math.floor(time / 60);
        const secs = Math.floor(time % 60);
        return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
      };

      playBtn.addEventListener("click", () => {
        if (audio.paused) {
          audio.play().then(() => {
            playBtn.textContent = "Ⅱ";
            statusText.textContent = "Playing drama preview";
          }).catch(() => {});
        } else {
          audio.pause();
          playBtn.textContent = "▶";
          statusText.textContent = "Tap play to listen";
        }
      });

      audio.addEventListener("timeupdate", () => {
        seekSlider.value = audio.duration ? (audio.currentTime / audio.duration) * 100 : 0;
        timeText.textContent = formatTime(audio.currentTime);
      });

      audio.addEventListener("loadedmetadata", () => {
        durationText.textContent = formatTime(audio.duration);
      });

      seekSlider.addEventListener("input", () => {
        if (audio.duration) {
          audio.currentTime = (seekSlider.value / 100) * audio.duration;
        }
      });

      if (volSlider) {
        volSlider.addEventListener("input", () => {
          audio.volume = Number(volSlider.value);
        });
      }

      if (location.hash.includes("play=true") && audio.paused) {
        audio.play().then(() => {
          playBtn.textContent = "Ⅱ";
          statusText.textContent = "Playing drama preview";
        }).catch(() => {});
      }
    }
  }

  // --- Overhauled Community Binding ---
  const route = getRoute();
  if (route === "home") {
    document.querySelectorAll(".btn-leader-chip").forEach((chip) => {
      chip.addEventListener("click", (e) => {
        state.communityQuery = e.currentTarget.dataset.name;
        state.communitySurface = "feed";
        state.selectedPostId = null;
        saveState();
        routeTo("community");
      });
    });
  }
  if (route === "community") {
    const sortEl = document.querySelector("#community-sort");
    if (sortEl) {
      sortEl.addEventListener("change", (e) => {
        state.communitySort = e.target.value;
        saveState();
        render();
      });
    }

    const searchEl = document.querySelector("#community-search");
    if (searchEl) {
      searchEl.addEventListener("input", (e) => {
        state.communityQuery = e.target.value;
        render();
        const searchInput = document.querySelector("#community-search");
        if (searchInput) {
          searchInput.focus();
          searchInput.selectionStart = searchInput.selectionEnd = searchInput.value.length;
        }
      });
    }

    const clearLeaderFilter = document.querySelector("#btn-clear-leader-filter");
    if (clearLeaderFilter) {
      clearLeaderFilter.addEventListener("click", () => {
        state.communityQuery = "";
        render();
      });
    }

    document.querySelectorAll(".btn-leader-chip").forEach((chip) => {
      chip.addEventListener("click", (e) => {
        state.communityQuery = e.currentTarget.dataset.name;
        state.communitySurface = "feed";
        state.selectedPostId = null;
        render();
      });
    });

    const btnHistory = document.querySelector("#btn-community-history");
    if (btnHistory) {
      btnHistory.addEventListener("click", () => {
        state.communitySurface = "history";
        state.selectedPostId = null;
        render();
      });
    }

    const btnAlerts = document.querySelector("#btn-community-alerts");
    if (btnAlerts) {
      btnAlerts.addEventListener("click", () => {
        state.communitySurface = "notifications";
        state.selectedPostId = null;
        render();
      });
    }

    const btnSort = document.querySelector("#btn-open-sort");
    if (btnSort) {
      btnSort.addEventListener("click", () => {
        state.communitySurface = "sort";
        state.selectedPostId = null;
        render();
      });
    }

    document.querySelectorAll(".community-sort-radio").forEach((radio) => {
      radio.addEventListener("change", (e) => {
        state.communitySort = e.target.value;
        state.communitySurface = "feed";
        render();
      });
    });

    const btnBack = document.querySelector("#btn-community-back") || document.querySelector("#btn-back-to-reviews");
    if (btnBack) {
      btnBack.addEventListener("click", () => {
        state.communitySurface = "feed";
        state.selectedPostId = null;
        state.communityQuery = "";
        render();
      });
    }

    const selectHistoryType = document.querySelector("#community-history-type");
    if (selectHistoryType) {
      selectHistoryType.addEventListener("change", (e) => {
        state.historyType = e.target.value;
        render();
      });
    }

    document.querySelectorAll(".btn-view-historical-post").forEach((link) => {
      link.addEventListener("click", (e) => {
        state.selectedPostId = e.currentTarget.dataset.postId;
        state.communitySurface = "feed";
        render();
      });
    });

    const btnComposeFab = document.querySelector("#btn-compose-fab");
    if (btnComposeFab) {
      btnComposeFab.addEventListener("click", () => {
        state.communitySurface = "compose";
        render();
      });
    }

    const btnCloseComposer = document.querySelector("#btn-close-composer");
    if (btnCloseComposer) {
      btnCloseComposer.addEventListener("click", () => {
        state.composerOpen = false;
        render();
      });
    }

    const formComposer = document.querySelector("#review-composer-form");
    if (formComposer) {
      formComposer.addEventListener("submit", (e) => {
        e.preventDefault();
        const title = document.querySelector("#composer-title-input").value.trim();
        const review = document.querySelector("#composer-review-input").value.trim();
        if (title.length < 3 || review.length < 8) {
          toast("Please write a valid title and review.");
          return;
        }

        const newPost = {
          id: uid("post"),
          userId: state.user.id,
          username: state.user.username || state.user.fullName,
          country: state.user.country || "NG",
          bookId: state.user.lastBookId || "book-1",
          content: `${title}\n${review}`,
          likes: 0,
          likedBy: [],
          comments: [],
          status: state.settings.autoApprovePosts ? "Visible" : "Pending",
          pinned: false,
          createdAt: new Date().toISOString()
        };

        state.posts.unshift(newPost);
        addNotification("Review posted", "Your review is live.");
        state.communitySurface = "feed";
        state.shareSuccessPost = newPost;
        saveState();
        render();
      });
    }

    const topCommentForm = document.querySelector("#top-comment-form");
    if (topCommentForm) {
      topCommentForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const input = topCommentForm.querySelector('input[name="commentText"]');
        const text = input.value.trim();
        if (!text) return;
        
        const post = state.posts.find((p) => p.id === state.selectedPostId);
        if (post) {
          post.comments.push({
            id: uid("comment"),
            userId: state.user.id,
            user: state.user.username || state.user.fullName,
            country: state.user.country || "NG",
            avatar: state.user.avatar || "A",
            text: text,
            parentId: null,
            createdAt: new Date().toISOString()
          });
          saveState();
          render();
        }
      });
    }

    document.querySelectorAll(".reply-link").forEach((link) => {
      link.addEventListener("click", (e) => {
        const commentId = e.currentTarget.dataset.commentId;
        const formContainer = document.querySelector(`#reply-form-${commentId}`);
        if (formContainer) {
          formContainer.style.display = formContainer.style.display === "none" ? "flex" : "none";
        }
      });
    });

    document.querySelectorAll(".nested-comment-form").forEach((form) => {
      form.addEventListener("submit", (e) => {
        e.preventDefault();
        const parentId = e.currentTarget.dataset.parentId;
        const input = form.querySelector('input[name="replyText"]');
        const text = input.value.trim();
        if (!text) return;

        const post = state.posts.find((p) => p.id === state.selectedPostId);
        if (post) {
          post.comments.push({
            id: uid("comment"),
            userId: state.user.id,
            user: state.user.username || state.user.fullName,
            country: state.user.country || "NG",
            avatar: state.user.avatar || "A",
            text: text,
            parentId: parentId,
            createdAt: new Date().toISOString()
          });
          saveState();
          render();
        }
      });
    });

    document.querySelectorAll(".btn-share-platform").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const platform = e.currentTarget.dataset.platform;
        const post = state.shareSuccessPost;
        if (!post) return;
        const copy = splitPostContent(post.content);
        const text = `"${copy.body}" - Read more on Ascendance: The Trilogy`;
        const url = location.href;
        
        if (platform === "native") {
          if (navigator.share) {
            navigator.share({ title: copy.title, text, url }).catch(() => {});
          } else {
            navigator.clipboard?.writeText(text);
            toast("Link copied to clipboard.");
          }
        } else if (platform === "whatsapp") {
          window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text + " " + url)}`, "_blank");
        } else if (platform === "facebook") {
          window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, "_blank");
        } else if (platform === "x") {
          window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, "_blank");
        }
        
        awardSharePoints();
      });
    });

    const btnShareDone = document.querySelector("#btn-share-done");
    if (btnShareDone) {
      btnShareDone.addEventListener("click", () => {
        state.shareSuccessPost = null;
        render();
      });
    }
  }
}

function awardSharePoints() {
  if (state.user) {
    state.user.points = (state.user.points || 0) + 50;
    addNotification("Share reward", "You earned 50 points for sharing!");
    saveState();
    toast("Earned 50 points!");
  }
}

function formValue(name) {
  return app.querySelector(`[name="${name}"]`)?.value.trim() || "";
}

function handleAction(event) {
  event.preventDefault();
  const action = event.currentTarget.dataset.action;
  const data = event.currentTarget.dataset;
  const actions = {
    login,
    signup,
    "switch-to-signup": () => {
      state.authMode = "signup";
      saveState();
      render();
    },
    "switch-to-login": () => {
      state.authMode = "login";
      saveState();
      render();
    },
    oauth: () => oauthSignup(data.provider),
    "verify-email": verifyEmail,
    "resend-code": resendCode,
    "save-phone": savePhone,
    "save-profile": saveProfile,
    "open-book": () => openBook(data.bookId),
    unlock: () => showUnlockModal(data.bookId),
    "show-summary": () => showSummaryModal(data.bookId),
    "unlock-trilogy": showTrilogyModal,
    read: () => routeTo(`reader/${data.chapterId}`),
    "view-leaderboard": () => {
      state.communitySurface = "leaderboard";
      state.communityQuery = "";
      saveState();
      routeTo("community");
    },
    "set-reader-font": () => {
      state.readerSettings.font = data.font;
      saveState();
      render();
      document.getElementById('settings-drawer').style.display='flex';
    },
    "set-reader-theme": () => {
      state.readerSettings.theme = data.theme;
      saveState();
      render();
      document.getElementById('settings-drawer').style.display='flex';
    },
    "toggle-autoplay": () => {
      state.readerSettings.autoplay = !state.readerSettings.autoplay;
      saveState();
      render();
      document.getElementById('settings-drawer').style.display='flex';
    },
    "speak-chapter": speakChapter,
    speak: () => speakText(data.text),
    "save-progress": () => { saveReaderProgress(); toast("Progress saved."); },
    "auto-scroll": toggleAutoScroll,
    "create-post": createPost,
    "like-post": () => likePost(data.postId),
    "share-post": () => sharePost(data.postId),
    "comment-post": () => commentPost(data.postId),
    "comment-post-details": () => {
      state.selectedPostId = data.postId;
      state.communitySurface = "feed";
      saveState();
      render();
    },
    "send-gift": sendGift,
    "redeem-gift": redeemGift,
    logout,
    "update-profile": updateProfile,
    "share-app-modal": showShareAppModal,
    "play-audio-drama": () => {
      const audio = document.getElementById("auth-audio-element");
      const playBtn = document.getElementById("auth-audio-play-btn");
      const statusText = document.getElementById("auth-audio-status");
      if (audio) {
        if (audio.paused) {
          audio.play().then(() => {
            if (playBtn) playBtn.textContent = "Ⅱ";
            if (statusText) statusText.textContent = "Playing drama preview";
          }).catch(() => {});
        } else {
          audio.pause();
          if (playBtn) playBtn.textContent = "▶";
          if (statusText) statusText.textContent = "Tap play to listen";
        }
      }
    },
    "admin-tab": () => {
      state.adminTab = data.tab;
      saveState();
      render();
    },
    "admin-create-book": adminCreateBook,
    "admin-add-chapter": () => adminAddChapter(data.bookId),
    "save-settings": saveSettings,
    "admin-pin-post": () => adminPinPost(data.postId),
    "admin-hide-post": () => adminHidePost(data.postId),
    install: installPrompt
  };
  actions[action]?.();
}

function login() {
  const email = formValue("email").toLowerCase();
  const password = formValue("password");
  
  if (!email.includes("@") || !password) {
    toast("Enter a valid email and password.");
    return;
  }
  
  const existing = state.users.find((user) => user.email === email);
  if (!existing) {
    toast("Invalid email or password.");
    return;
  }
  
  existing.lastLogin = new Date().toLocaleString();
  state.user = existing;
  state.surface = "home";
  saveState();
  render();
  toast("Welcome back.");
}

function signup() {
  const email = formValue("email").toLowerCase();
  const fullName = formValue("fullName") || "Ascendance Reader";
  const password = formValue("password");
  if (!email.includes("@") || password.length < 6) {
    toast("Enter a valid email and a password with at least 6 characters.");
    return;
  }
  const existing = state.users.find((user) => user.email === email);
  const user = existing || {
    id: uid("reader"),
    fullName,
    username: "",
    email,
    phone: "",
    country: "NG",
    avatar: "A",
    emailVerified: false,
    verificationCode: "123456",
    onboardingStep: "verify",
    createdAt: new Date().toISOString(),
    lastLogin: new Date().toLocaleString()
  };
  if (!existing) state.users.push(user);
  state.user = user;
  toast("Verification code: 123456");
  saveState();
  render();
}

function oauthSignup(provider) {
  const email = `${provider.toLowerCase()}reader@example.com`;
  state.user = {
    id: uid("reader"),
    fullName: `${provider} Reader`,
    username: "",
    email,
    phone: "",
    country: "NG",
    avatar: "A",
    emailVerified: true,
    onboardingStep: "phone",
    createdAt: new Date().toISOString(),
    lastLogin: new Date().toLocaleString()
  };
  state.users.push(state.user);
  saveState();
  render();
}

function verifyEmail() {
  if (formValue("code") !== "123456") {
    toast("Use 123456 for this prototype.");
    return;
  }
  state.user.emailVerified = true;
  state.user.onboardingStep = "phone";
  saveState();
  render();
}

function resendCode() {
  toast("Verification code: 123456");
}

function savePhone() {
  const phone = formValue("phone");
  if (phone.length < 7) {
    toast("Add a valid telephone number.");
    return;
  }
  state.user.phone = phone;
  state.user.onboardingStep = "profile";
  saveState();
  render();
}

function saveProfile() {
  state.user.username = formValue("username") || state.user.fullName;
  state.user.country = formValue("country") || "NG";
  state.user.avatar = formValue("avatar") || "A";
  state.user.onboardingStep = "done";
  addNotification("Welcome to Ascendance", "Your reading profile is ready.");
  saveState();
  routeTo("home");
}

function openBook(bookId) {
  const book = findBook(bookId);
  const first = flattenChapters().find((item) => item.book.id === bookId && hasBookAccess(book, item.chapter));
  if (first) routeTo(`reader/${first.chapter.id}`);
  else showUnlockModal(bookId);
}

function usdCurrency(amount) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);
}

function showUnlockModal(bookId) {
  const book = findBook(bookId);
  if (!book) return;
  const isBook1 = book.id === "book-1";
  
  if (isBook1) {
    openModal(html`
      <div class="unlock-dialog-content" style="display: flex; flex-direction: column; align-items: center; text-align: center; gap: 16px; width: 100%;">
        <button class="modal-close" data-modal-action="close" style="align-self: flex-end; margin-bottom: -20px; font-weight: bold; border: none; background: transparent; cursor: pointer; padding: 4px 8px; color: var(--ink);">Close</button>
        <img src="/assets/branding/wordmark.png" alt="Ascendance" style="height: 36px; object-fit: contain; margin-top: 10px;" onerror="this.style.display='none'" />
        <h2 style="margin: 0; font-family: Georgia, serif; font-size: 1.4rem; color: #b01834;">The free chapters end here.</h2>
        <p style="margin: 0; font-size: 0.95rem; color: var(--ink); line-height: 1.5;">The story is only getting started. Unlock Book One, or choose the complete trilogy for the full journey.</p>
        
        <div class="unlock-covers" style="display: flex; gap: 10px; justify-content: center; margin: 10px 0;">
          <img src="/assets/books/disciples-inverted-cross.jpeg" alt="" style="width: 70px; height: 100px; border-radius: 4px; box-shadow: 0 4px 8px rgba(0,0,0,0.15);" />
          <img src="/assets/books/merchants-ivory-towers.jpeg" alt="" style="width: 70px; height: 100px; border-radius: 4px; box-shadow: 0 4px 8px rgba(0,0,0,0.15);" />
          <img src="/assets/books/rhapsodies-coming-regent.jpeg" alt="" style="width: 70px; height: 100px; border-radius: 4px; box-shadow: 0 4px 8px rgba(0,0,0,0.15);" />
        </div>

        <div style="width: 100%; display: flex; flex-direction: column; gap: 10px; text-align: left;">
          <label style="display: flex; gap: 10px; align-items: center; border: 1.5px solid #b01834; padding: 12px; border-radius: 8px; cursor: pointer; background: rgba(176, 24, 52, 0.05);" id="opt-trilogy-label">
            <input type="radio" name="unlock-opt" value="trilogy" checked style="accent-color: #b01834;" id="opt-trilogy" />
            <div style="flex: 1;">
              <strong style="display: block; font-size: 0.95rem; color: var(--ink);">Unlock all three books (Trilogy)</strong>
              <small style="color: var(--muted); font-size: 0.8rem;">${currency(8962)} / ${usdCurrency(6.59)} · Best value</small>
            </div>
          </label>
          <label style="display: flex; gap: 10px; align-items: center; border: 1.5px solid var(--line, #ccc); padding: 12px; border-radius: 8px; cursor: pointer;" id="opt-book-label">
            <input type="radio" name="unlock-opt" value="book" style="accent-color: #b01834;" id="opt-book" />
            <div style="flex: 1;">
              <strong style="display: block; font-size: 0.95rem; color: var(--ink);">Unlock Book One: Disciples of the Inverted Cross</strong>
              <small style="color: var(--muted); font-size: 0.8rem;">${currency(3522)} / ${usdCurrency(2.59)}</small>
            </div>
          </label>
        </div>

        <button class="primary-btn" id="btn-continue-checkout" style="width: 100%; min-height: 48px; border-radius: 8px; font-weight: bold; margin-top: 10px;">Continue to checkout</button>
        <small style="color: var(--muted); font-size: 0.75rem;">Paystack displays the supported settlement currency at checkout.</small>
      </div>
    `);

    const optTrilogy = document.getElementById("opt-trilogy");
    const optBook = document.getElementById("opt-book");
    const optTrilogyLabel = document.getElementById("opt-trilogy-label");
    const optBookLabel = document.getElementById("opt-book-label");
    const btnContinue = document.getElementById("btn-continue-checkout");

    const updateSelectionStyles = () => {
      if (optTrilogy.checked) {
        optTrilogyLabel.style.borderColor = "#b01834";
        optTrilogyLabel.style.background = "rgba(176, 24, 52, 0.05)";
        optBookLabel.style.borderColor = "var(--line, #ccc)";
        optBookLabel.style.background = "transparent";
      } else {
        optBookLabel.style.borderColor = "#b01834";
        optBookLabel.style.background = "rgba(176, 24, 52, 0.05)";
        optTrilogyLabel.style.borderColor = "var(--line, #ccc)";
        optTrilogyLabel.style.background = "transparent";
      }
    };

    optTrilogy.addEventListener("change", updateSelectionStyles);
    optBook.addEventListener("change", updateSelectionStyles);
    optTrilogyLabel.addEventListener("click", () => { optTrilogy.checked = true; updateSelectionStyles(); });
    optBookLabel.addEventListener("click", () => { optBook.checked = true; updateSelectionStyles(); });

    btnContinue.addEventListener("click", () => {
      if (optTrilogy.checked) {
        purchase("trilogy", null, 8962);
      } else {
        purchase("book", "book-1", 3522);
      }
    });

  } else {
    const bookPrice = book.price || 4882;
    const usdVal = book.id === "book-2" || book.id === "book-3" ? 3.59 : 3.59;
    
    openModal(html`
      <div class="unlock-dialog-content" style="display: flex; flex-direction: column; align-items: center; text-align: center; gap: 16px; width: 100%;">
        <button class="modal-close" data-modal-action="close" style="align-self: flex-end; margin-bottom: -20px; font-weight: bold; border: none; background: transparent; cursor: pointer; padding: 4px 8px; color: var(--ink);">Close</button>
        <h2 style="margin: 0; font-family: Georgia, serif; font-size: 1.4rem; color: #b01834;">Unlock ${escapeHtml(book.title)}</h2>
        <p style="margin: 0; font-size: 0.95rem; color: var(--ink); line-height: 1.5;">To continue reading, unlock this sequel volume or purchase the complete trilogy.</p>
        
        <div class="unlock-covers" style="margin: 10px 0;">
          <img src="${book.cover}" alt="" style="width: 100px; height: 140px; border-radius: 6px; box-shadow: 0 4px 8px rgba(0,0,0,0.15);" />
        </div>

        <div style="display: grid; gap: 12px; width: 100%; margin-top: 10px;">
          <button class="primary-btn" id="btn-unlock-sequel" style="min-height: 48px; border-radius: 8px; font-weight: bold;">
            Unlock ${escapeHtml(book.title)} (${currency(bookPrice)} / ${usdCurrency(usdVal)})
          </button>
          <button class="ghost-btn" id="btn-gift-sequel" style="min-height: 48px; border-radius: 8px;">
            Gift this Book
          </button>
        </div>
        <small style="color: var(--muted); font-size: 0.75rem;">Paystack displays the supported settlement currency at checkout.</small>
      </div>
    `);

    document.getElementById("btn-unlock-sequel").addEventListener("click", () => {
      purchase("book", book.id, bookPrice);
    });

    document.getElementById("btn-gift-sequel").addEventListener("click", () => {
      closeModal();
      routeTo("notices");
    });
  }
}


function showTrilogyModal() {
  openModal(html`
    <h2>Unlock Trilogy</h2>
    <p>All three books become available permanently for this reader profile.</p>
    <div class="form-grid">
      <button class="primary-btn" data-modal-action="purchase-trilogy">Pay ${currency(state.settings.trilogyPrice)}</button>
      <button class="ghost-btn" data-modal-action="close">Close</button>
    </div>
  `);
}

function showShareAppModal() {
  openModal(html`
    <div class="share-dialog-content" style="display: flex; flex-direction: column; align-items: center; text-align: center; gap: 16px; width: 100%;">
      <button class="modal-close" data-modal-action="close" style="align-self: flex-end; margin-bottom: -20px; font-weight: bold; border: none; background: transparent; cursor: pointer; padding: 4px 8px; color: var(--ink);">Close</button>
      <h2 style="margin: 0; font-family: Georgia, serif; font-size: 1.4rem; color: #b01834;">Share Ascendance</h2>
      <p style="margin: 0; font-size: 0.95rem; color: var(--ink); line-height: 1.5;">Invite someone to discover Ascendance and earn 50 contribution points!</p>
      
      <div class="share-actions" style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; width: 100%; margin-top: 10px;">
        ${["native", "whatsapp", "facebook", "x"].map((platform) => html`
          <button class="ghost-btn btn-share-app-platform" data-platform="${platform}" style="min-height: 38px; border-radius: 6px; color: var(--ink);">
            ${platform === "native" ? "Share Link" : platform.toUpperCase()}
          </button>
        `).join("")}
      </div>
      <button class="primary-btn" data-modal-action="close" style="width: 100%; min-height: 44px; border-radius: 8px; font-weight: bold; margin-top: 10px;">Cancel</button>
    </div>
  `);

  document.querySelectorAll(".btn-share-app-platform").forEach((btn) => {
    btn.addEventListener("click", async (e) => {
      const platform = e.currentTarget.dataset.platform;
      const text = "Discover Ascendance - The Trilogy, a guided digital reading experience.";
      const url = location.origin;
      
      if (platform === "native") {
        if (navigator.share) {
          try {
            await navigator.share({ title: "Ascendance - The Trilogy", text, url });
          } catch (err) {}
        } else {
          navigator.clipboard?.writeText(`${text} ${url}`);
          toast("Link copied to clipboard.");
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
      closeModal();
      awardSharePoints();
    });
  });
}

function purchase(productType, bookId = null, amount = state.settings.trilogyPrice) {
  if (productType === "book") {
    if (bookId === "book-2") {
      const ownsBook1 = state.purchases.some(
        (p) =>
          p.userId === state.user.id &&
          p.status === "Successful" &&
          (p.productType === "trilogy" || p.productType === "gift-trilogy" || p.bookId === "book-1")
      );
      if (!ownsBook1) {
        toast("You must unlock Volume 1 first.");
        return;
      }
    }
    if (bookId === "book-3") {
      const ownsBook2 = state.purchases.some(
        (p) =>
          p.userId === state.user.id &&
          p.status === "Successful" &&
          (p.productType === "trilogy" || p.productType === "gift-trilogy" || p.bookId === "book-2")
      );
      if (!ownsBook2) {
        toast("You must unlock Volume 2 first.");
        return;
      }
    }
  }

  const product = productType === "trilogy" ? "Full Trilogy" : findBook(bookId)?.title || "Gift Trilogy";
  const reference = `ASC-${Date.now()}`;
  state.purchases.push({
    id: uid("purchase"),
    userId: state.user.id,
    productType,
    bookId,
    amount,
    paymentReference: reference,
    paymentGateway: "Prototype Paystack",
    status: "Successful",
    createdAt: new Date().toISOString()
  });
  state.transactions.push({
    id: uid("tx"),
    email: state.user.email,
    amount,
    product,
    gateway: "Prototype Paystack",
    reference,
    status: "Successful",
    createdAt: new Date().toISOString()
  });
  addNotification("Payment successful", `${product} is now unlocked.`);
  saveState();
  closeModal();
  toast(`${product} unlocked.`);
  render();
}

function openModal(content) {
  modalRoot.innerHTML = `<section class="modal-card">${content}</section>`;
  modalRoot.classList.add("is-open");
  modalRoot.querySelectorAll("[data-modal-action]").forEach((button) => button.addEventListener("click", handleModalAction));
}

function closeModal() {
  modalRoot.classList.remove("is-open");
  modalRoot.innerHTML = "";
}

function showSummaryModal(bookId) {
  const book = findBook(bookId);
  if (!book) return;
  openModal(html`
    <div style="display: grid; gap: 16px; padding: 12px;">
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <h2 style="margin: 0; font-family: Georgia, serif; font-size: 1.4rem; color: #b01834;">Book Summary</h2>
        <button class="modal-close" data-modal-action="close" style="min-height: auto; padding: 4px 8px; cursor: pointer; border: none; background: transparent; font-size: 0.9rem; font-weight: bold;">Close</button>
      </div>
      <h3 style="margin: 0; font-size: 1.1rem; font-weight: bold;">${escapeHtml(book.title)}</h3>
      <p style="margin: 0; color: var(--ink); line-height: 1.6; text-align: left;">${escapeHtml(book.blurb)}</p>
      <div style="display: flex; gap: 12px; margin-top: 12px;">
        <button class="primary-btn" data-modal-action="speak-summary" data-text="${escapeHtml(book.blurb)}" style="flex: 1; min-height: 44px; border-radius: 8px;">
          Listen (TTS)
        </button>
        <button class="ghost-btn" data-modal-action="stop-speak" style="flex: 1; min-height: 44px; border-radius: 8px;">
          Stop
        </button>
      </div>
    </div>
  `);
}

function handleModalAction(event) {
  const action = event.currentTarget.dataset.modalAction;
  const bookId = event.currentTarget.dataset.bookId;
  if (action === "purchase-book") purchase("book", bookId, findBook(bookId).price);
  if (action === "purchase-trilogy") purchase("trilogy", null, state.settings.trilogyPrice);
  if (action === "speak-summary") speakText(event.currentTarget.dataset.text);
  if (action === "stop-speak") window.speechSynthesis?.cancel();
  if (action === "close") {
    window.speechSynthesis?.cancel();
    closeModal();
  }
}

function toggleSettings() {
  document.querySelector("#settings-drawer")?.classList.toggle("is-open");
}

function updateReaderSetting(event) {
  const key = event.currentTarget.dataset.setting;
  const value = event.currentTarget.type === "range" ? Number(event.currentTarget.value) : event.currentTarget.value;
  state.readerSettings[key] = value;
  saveState();
  render();
  document.getElementById('settings-drawer').style.display='flex';
}

function saveReaderProgress() {
  const chapterId = state.currentChapter;
  if (!chapterId) return;
  const doc = document.documentElement;
  const max = doc.scrollHeight - window.innerHeight;
  const percentage = max <= 0 ? 100 : Math.min(100, Math.round((window.scrollY / max) * 100));
  state.progress[chapterId] = {
    chapterId,
    scrollPosition: window.scrollY,
    percentage,
    lastReadAt: new Date().toISOString(),
    deviceType: /Mobi|Android/i.test(navigator.userAgent) ? "mobile" : "desktop"
  };
  state.user.lastChapterId = chapterId;
  saveState();
}

function restoreReaderPosition(chapterId) {
  const progress = state.progress[chapterId];
  if (progress?.scrollPosition) setTimeout(() => window.scrollTo(0, progress.scrollPosition), 120);
}

function toggleAutoScroll() {
  if (autoScrollTimer) {
    stopAutoScroll();
    toast("Auto-scroll paused.");
    return;
  }
  autoScrollTimer = setInterval(() => {
    window.scrollBy({ top: state.readerSettings.scrollSpeed, behavior: "smooth" });
    if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 12) stopAutoScroll();
  }, 55);
  toast("Auto-scroll started.");
}

function stopAutoScroll() {
  if (autoScrollTimer) clearInterval(autoScrollTimer);
  autoScrollTimer = null;
}

function speakChapter() {
  const item = findChapter(state.currentChapter);
  if (!item?.section.tts) {
    toast("Text-to-speech is disabled for this section.");
    return;
  }
  speakText(item.chapter.content.join(" "));
}

function speakText(text) {
  if (!("speechSynthesis" in window)) {
    toast("Text-to-speech is not supported in this browser.");
    return;
  }
  if (window.speechSynthesis.speaking) {
    window.speechSynthesis.cancel();
    return;
  }
  currentUtterance = new SpeechSynthesisUtterance(text);
  currentUtterance.rate = Math.min(1.8, 0.75 + state.readerSettings.scrollSpeed / 6);
  window.speechSynthesis.speak(currentUtterance);
}

function createPost() {
  const content = formValue("postContent");
  if (content.length < 8) {
    toast("Write a fuller review first.");
    return;
  }
  state.posts.unshift({
    id: uid("post"),
    userId: state.user.id,
    username: state.user.username || state.user.fullName,
    country: state.user.country || "NG",
    bookId: state.user.lastBookId || "book-1",
    content,
    likes: 0,
    likedBy: [],
    comments: [],
    status: state.settings.autoApprovePosts ? "Visible" : "Pending",
    pinned: false,
    createdAt: new Date().toISOString()
  });
  addNotification("Review posted", "Your review is live in the community.");
  saveState();
  render();
}

function likePost(postId) {
  const post = state.posts.find((item) => item.id === postId);
  if (!post) return;
  if (post.likedBy.includes(state.user.id)) {
    post.likedBy = post.likedBy.filter((id) => id !== state.user.id);
    post.likes = Math.max(0, post.likes - 1);
  } else {
    post.likedBy.push(state.user.id);
    post.likes += 1;
  }
  saveState();
  render();
}

function sharePost(postId) {
  const post = state.posts.find((item) => item.id === postId);
  const text = `"${post.content}" - ${post.username} on Ascendance: The Trilogy`;
  if (navigator.share) {
    navigator.share({ title: "Ascendance Review", text, url: location.href }).catch(() => {});
  } else {
    navigator.clipboard?.writeText(text);
    toast("Share caption copied.");
  }
}

function commentPost(postId) {
  const comment = prompt("Add a comment");
  if (!comment) return;
  const post = state.posts.find((item) => item.id === postId);
  post.comments.push({ user: state.user.username || state.user.fullName, text: comment });
  saveState();
  render();
}

function weeklyGiftCount() {
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  return state.gifts.filter((gift) => gift.senderUserId === state.user.id && new Date(gift.createdAt).getTime() > weekAgo).length;
}

function sendGift() {
  const hasPurchase = currentUserPurchases().length > 0;
  if (!state.user.emailVerified || !hasPurchase) {
    toast("Verified readers with at least one purchase can send gifts.");
    return;
  }
  if (weeklyGiftCount() >= Number(state.settings.giftLimit)) {
    toast("Weekly gift limit reached.");
    return;
  }
  const recipientEmail = formValue("giftEmail").toLowerCase();
  if (!recipientEmail.includes("@")) {
    toast("Enter a valid recipient email.");
    return;
  }
  const accessCode = Math.random().toString(36).replace(/[^a-z0-9]/gi, "").slice(0, 8).toUpperCase();
  state.gifts.unshift({
    id: uid("gift"),
    senderUserId: state.user.id,
    senderName: state.user.fullName,
    recipientEmail,
    accessCode,
    giftPackage: "trilogy",
    paymentReference: `GIFT-${Date.now()}`,
    status: "Sent",
    redeemedByUserId: null,
    redeemedAt: null,
    started: false,
    completedBookOne: false,
    completedTrilogy: false,
    reviewPosted: false,
    createdAt: new Date().toISOString()
  });
  state.transactions.push({
    id: uid("tx"),
    email: state.user.email,
    amount: Number(state.settings.giftPrice),
    product: `Gift Trilogy for ${recipientEmail}`,
    gateway: "Prototype Paystack",
    reference: `GIFT-${Date.now()}`,
    status: "Successful",
    createdAt: new Date().toISOString()
  });
  addNotification("Gift sent", `You have gifted Ascendance to ${recipientEmail}. Code: ${accessCode}`);
  saveState();
  render();
}

function redeemGift() {
  const code = formValue("accessCode").toUpperCase();
  const gift = state.gifts.find((item) => item.accessCode === code);
  if (!gift || gift.status === "Redeemed") {
    toast("Gift code is invalid or already used.");
    return;
  }
  if (gift.recipientEmail !== state.user.email) {
    toast("This code is linked to another email address.");
    return;
  }
  gift.status = "Redeemed";
  gift.redeemedByUserId = state.user.id;
  gift.redeemedAt = new Date().toISOString();
  state.purchases.push({
    id: uid("purchase"),
    userId: state.user.id,
    productType: "gift-trilogy",
    amount: 0,
    paymentReference: gift.paymentReference,
    paymentGateway: "Gift Code",
    status: "Successful",
    createdAt: new Date().toISOString()
  });
  addNotification("Gift code accepted", "The Ascendance trilogy has been unlocked.");
  saveState();
  render();
}

function logout() {
  state.user = null;
  saveState();
  routeTo("auth");
}

function updateProfile() {
  state.user.fullName = formValue("profileFullName") || state.user.fullName;
  state.user.username = formValue("profileUsername") || state.user.username;
  state.user.phone = formValue("profilePhone") || state.user.phone;
  state.user.country = formValue("profileCountry") || state.user.country;
  const user = state.users.find((item) => item.id === state.user.id);
  Object.assign(user, state.user);
  saveState();
  toast("Profile updated.");
  render();
}

function adminCreateBook() {
  const title = formValue("adminBookTitle");
  if (!title) {
    toast("Add a book title.");
    return;
  }
  const price = Number(formValue("adminBookPrice") || 0);
  state.books.push({
    id: uid("book"),
    order: state.books.length + 1,
    title,
    subtitle: formValue("adminBookSubtitle") || `Book ${state.books.length + 1}`,
    author: "BrandZilla Technologies",
    cover: "assets/cover-book-1.svg",
    price,
    status: formValue("adminBookStatus") || "Draft",
    preview: false,
    blurb: formValue("adminBookBlurb") || "New Ascendance entry.",
    sections: [{ id: uid("section"), title: "Opening Section", subtitle: "Draft", order: 1, price: 0, tts: true, voice: "Female", chapters: [] }]
  });
  saveState();
  render();
}

function adminAddChapter(bookId) {
  const book = findBook(bookId);
  const title = prompt("Chapter title");
  const content = prompt("Chapter opening paragraph");
  if (!title || !content) return;
  const section = book.sections[0] || { id: uid("section"), title: "Opening Section", subtitle: "Draft", order: 1, price: 0, tts: true, voice: "Female", chapters: [] };
  if (!book.sections.length) book.sections.push(section);
  section.chapters.push({
    id: uid("chapter"),
    title,
    subtitle: "Draft chapter",
    isPreview: false,
    status: "Draft",
    content: [content]
  });
  saveState();
  render();
}

function saveSettings() {
  state.settings.bookOnePrice = Number(formValue("settingBookOnePrice"));
  state.settings.bookTwoPrice = Number(formValue("settingBookTwoPrice"));
  state.settings.bookThreePrice = Number(formValue("settingBookThreePrice"));
  state.settings.trilogyPrice = Number(formValue("settingTrilogyPrice"));
  state.settings.giftPrice = Number(formValue("settingGiftPrice"));
  state.settings.giftLimit = Number(formValue("settingGiftLimit"));
  state.books[0].price = state.settings.bookOnePrice;
  state.books[1].price = state.settings.bookTwoPrice;
  state.books[2].price = state.settings.bookThreePrice;
  saveState();
  toast("Settings saved.");
  render();
}

function adminPinPost(postId) {
  const post = state.posts.find((item) => item.id === postId);
  post.pinned = !post.pinned;
  saveState();
  render();
}

function adminHidePost(postId) {
  const post = state.posts.find((item) => item.id === postId);
  post.status = post.status === "Hidden" ? "Visible" : "Hidden";
  saveState();
  render();
}

function installPrompt() {
  toast("Use your browser menu to install Ascendance on this device.");
}

window.addEventListener("hashchange", render);
modalRoot.addEventListener("click", (event) => {
  if (event.target === modalRoot) closeModal();
});

window.addEventListener("beforeunload", saveReaderProgress);

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch(() => {});
  });
}

setTimeout(() => {
  hydrateFromBackend().finally(() => {
    splash.classList.add("is-hidden");
    state.booted = true;
    saveState();
    render();
  });
}, 2300);
