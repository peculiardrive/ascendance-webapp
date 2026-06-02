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
    ["notices", "Notices", "◇"],
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
          <button class="ghost-btn" data-route="admin">Admin</button>
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
          : html`
              <label>Email<input name="email" type="email" autocomplete="email" placeholder="reader@example.com"></label>
              <label>Full name<input name="fullName" autocomplete="name" placeholder="Your name"></label>
              <label>Password<input name="password" type="password" autocomplete="current-password" placeholder="Minimum 6 characters"></label>
              <button class="primary-btn" data-action="signup">Continue with Email</button>
              <div class="segmented">
                <button class="ghost-btn" data-action="oauth" data-provider="Google">Google</button>
                <button class="ghost-btn" data-action="oauth" data-provider="Outlook">Outlook</button>
                <button class="ghost-btn" data-action="oauth" data-provider="Apple">Apple</button>
              </div>
            `;

  return html`
    <main class="auth-page">
      <section class="auth-panel">
        <p class="eyebrow">Ascendance WebApp</p>
        <h1>${title}</h1>
        <p>${copy}</p>
        <div class="form-grid" data-auth-form>${form}</div>
      </section>
    </main>
  `;
}

function renderHome() {
  const firstBook = state.books[0];
  const continueChapterId = state.user?.lastChapterId;
  const continueItem = continueChapterId ? findChapter(continueChapterId) : flattenChapters()[0];
  return shell(html`
    <section class="hero-band" data-action="open-book" data-book-id="${firstBook.id}">
      <div class="hero-copy">
        <p class="eyebrow">Premium digital trilogy</p>
        <h1>Ascendance</h1>
        <p>${escapeHtml(firstBook.blurb)}</p>
        <div class="inline-actions">
          <button class="primary-btn" data-route="reader/${continueItem.chapter.id}">${continueChapterId ? "Continue Reading" : "Start Preview"}</button>
          <button class="ghost-btn" data-route="books">Contents</button>
        </div>
      </div>
    </section>

    <div class="content-stack">
      <section>
        <div class="section-heading">
          <div>
            <h2>The Trilogy</h2>
            <p>Unlock, read, gift, and return to your saved place.</p>
          </div>
        </div>
        <div class="grid book-grid">${state.books.map(renderBookCard).join("")}</div>
      </section>

      <section class="form-panel">
        <div class="section-heading">
          <div>
            <h2>Cinematic Blurb</h2>
            <p>${escapeHtml(firstBook.blurb)}</p>
          </div>
          <button class="ghost-btn" data-action="speak" data-text="${escapeHtml(firstBook.blurb)}">Listen</button>
        </div>
      </section>
    </div>
  `, "home");
}

function renderBookCard(book) {
  const firstChapter = book.sections[0]?.chapters[0];
  const owned = ownsBookAccess(book);
  const previewAvailable = Boolean(firstChapter?.isPreview);
  const locked = !owned && !previewAvailable;
  const status = owned ? "Unlocked" : previewAvailable ? "Preview" : "Locked";
  const progress = bookProgress(book.id);
  return html`
    <article class="book-card">
      <img src="${book.cover}" alt="${escapeHtml(book.title)} cover">
      <div class="book-card-body">
        <div class="chapter-meta"><span>${book.subtitle}</span><span>${status}</span><span>${currency(book.price)}</span></div>
        <h3>${escapeHtml(book.title)}</h3>
        <p>${escapeHtml(book.blurb)}</p>
        <div class="progress-track" aria-label="Reading progress"><div class="progress-fill" style="width:${progress}%"></div></div>
        <p>${progress}% complete</p>
        <div class="inline-actions">
          <button class="primary-btn" data-action="${locked ? "unlock" : "open-book"}" data-book-id="${book.id}">${locked ? "Unlock" : owned && progress ? "Continue" : previewAvailable && !owned ? "Start Preview" : "Open"}</button>
          <button class="ghost-btn" data-route="books/${book.id}">Contents</button>
        </div>
      </div>
    </article>
  `;
}

function renderBooks() {
  const [, selectedBookId] = getRoute().split("/");
  const selectedBooks = selectedBookId ? state.books.filter((book) => book.id === selectedBookId) : state.books;
  return shell(html`
    <div class="content-stack">
      <div class="section-heading">
        <div>
          <h2>Contents</h2>
          <p>Free previews open instantly. Purchased and gifted content stays unlocked.</p>
        </div>
        <button class="primary-btn" data-action="unlock-trilogy">Unlock Trilogy</button>
      </div>
      ${selectedBooks
        .map((book) => html`
          <section class="admin-panel">
            <div class="section-heading">
              <div>
                <p class="eyebrow">${book.subtitle}</p>
                <h2>${escapeHtml(book.title)}</h2>
                <p>${escapeHtml(book.blurb)}</p>
              </div>
              <img src="${book.cover}" alt="${escapeHtml(book.title)} cover" style="width:88px;border-radius:8px">
            </div>
            <div class="grid">
              ${book.sections
                .map((section) => html`
                  <div class="form-panel">
                    <h2>${escapeHtml(section.title)}</h2>
                    <p>${escapeHtml(section.subtitle)} · TTS ${section.tts ? "On" : "Off"} · ${section.voice} voice</p>
                    <div class="grid">
                      ${section.chapters
                        .map((chapter) => {
                          const locked = !hasBookAccess(book, chapter);
                          return html`
                            <article class="chapter-row">
                              <div>
                                <div class="chapter-meta"><span>${chapter.isPreview ? "Preview" : locked ? "Locked" : "Unlocked"}</span><span>${state.progress[chapter.id]?.percentage || 0}%</span></div>
                                <h3>${escapeHtml(chapter.title)}: ${escapeHtml(chapter.subtitle)}</h3>
                                <p>${escapeHtml(chapter.content[0])}</p>
                              </div>
                              <button class="${locked ? "ghost-btn" : "primary-btn"}" data-action="${locked ? "unlock" : "read"}" data-book-id="${book.id}" data-chapter-id="${chapter.id}">
                                ${locked ? "Unlock" : "Read"}
                              </button>
                            </article>
                          `;
                        })
                        .join("")}
                    </div>
                  </div>
                `)
                .join("")}
            </div>
          </section>
        `)
        .join("")}
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
        <div class="reader-title">
          <button class="ghost-btn" data-route="books/${item.book.id}">Back</button>
          <h1>${escapeHtml(item.chapter.title)}: ${escapeHtml(item.chapter.subtitle)}</h1>
          <span>${escapeHtml(item.book.title)} · ${escapeHtml(item.section.title)}</span>
        </div>
        <div class="reader-actions">
          <button class="ghost-btn" data-action="toggle-settings">Settings</button>
          <button class="ghost-btn" data-action="speak-chapter">TTS</button>
        </div>
      </header>
      <div class="settings-drawer" id="settings-drawer">
        <div class="two-col">
          <label>Font
            <select data-setting="font">
              ${["Georgia", "Merriweather", "Lora", "Open Sans", "Roboto", "Inter", "Literata"].map((font) => `<option ${settings.font === font ? "selected" : ""}>${font}</option>`).join("")}
            </select>
          </label>
          <label>Theme
            <select data-setting="theme">
              ${["light", "sepia", "dark"].map((theme) => `<option value="${theme}" ${settings.theme === theme ? "selected" : ""}>${theme}</option>`).join("")}
            </select>
          </label>
          <label>Font size
            <input data-setting="size" type="range" min="16" max="28" value="${settings.size}">
          </label>
          <label>Line spacing
            <input data-setting="line" type="range" min="1.35" max="2.1" step="0.05" value="${settings.line}">
          </label>
          <label>Alignment
            <select data-setting="align">
              ${["left", "justify", "center"].map((align) => `<option ${settings.align === align ? "selected" : ""}>${align}</option>`).join("")}
            </select>
          </label>
          <label>Auto-scroll speed
            <input data-setting="scrollSpeed" type="range" min="1" max="6" value="${settings.scrollSpeed}">
          </label>
        </div>
      </div>
      <article class="reader-body" id="reader-body">
        <h2>${escapeHtml(item.chapter.subtitle)}</h2>
        ${item.chapter.content.map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join("")}
      </article>
      <div class="reader-controls">
        ${prev ? `<button class="ghost-btn" data-route="reader/${prev.chapter.id}">Previous</button>` : ""}
        <button class="primary-btn" data-action="auto-scroll">Auto-scroll</button>
        ${next ? `<button class="ghost-btn" data-action="${hasBookAccess(next.book, next.chapter) ? "read" : "unlock"}" data-book-id="${next.book.id}" data-chapter-id="${next.chapter.id}">Next</button>` : ""}
      </div>
    </div>
  `;
}

function renderCommunity() {
  const posts = [...state.posts].sort((a, b) => Number(b.pinned) - Number(a.pinned) || new Date(b.createdAt) - new Date(a.createdAt));
  return shell(html`
    <div class="content-stack">
      <section class="form-panel">
        <div class="section-heading">
          <div>
            <h2>Community</h2>
            <p>Reader reviews, comments, likes, and share-ready captions.</p>
          </div>
        </div>
        <div class="form-grid">
          <label>Your review<textarea name="postContent" placeholder="Write your review"></textarea></label>
          <button class="primary-btn" data-action="create-post">Post Review</button>
        </div>
      </section>
      <section class="grid">
        ${posts
          .map((post) => html`
            <article class="post-card">
              <div class="chapter-meta"><span>${post.pinned ? "Pinned" : "Review"}</span><span>${escapeHtml(post.country)}</span><span>${new Date(post.createdAt).toLocaleDateString()}</span></div>
              <h3>${escapeHtml(post.username)}</h3>
              <p>${escapeHtml(post.content)}</p>
              <div class="inline-actions">
                <button class="ghost-btn" data-action="like-post" data-post-id="${post.id}">Like ${post.likes}</button>
                <button class="ghost-btn" data-action="share-post" data-post-id="${post.id}">Share</button>
                <button class="ghost-btn" data-action="comment-post" data-post-id="${post.id}">Comment</button>
              </div>
              ${post.comments.map((comment) => `<p><strong>${escapeHtml(comment.user)}:</strong> ${escapeHtml(comment.text)}</p>`).join("")}
            </article>
          `)
          .join("")}
      </section>
    </div>
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
    <div class="content-stack">
      <section class="profile-summary">
        <div class="section-heading">
          <div>
            <p class="eyebrow">${escapeHtml(state.user.country || "NG")}</p>
            <h2>${escapeHtml(state.user.username || state.user.fullName)}</h2>
            <p>${escapeHtml(state.user.email)} · ${escapeHtml(state.user.phone || "Telephone pending")}</p>
          </div>
          <button class="danger-btn" data-action="logout">Logout</button>
        </div>
      </section>
      <section class="form-panel">
        <h2>Profile</h2>
        <div class="two-col">
          <label>Full name<input name="profileFullName" value="${escapeHtml(state.user.fullName)}"></label>
          <label>Username<input name="profileUsername" value="${escapeHtml(state.user.username)}"></label>
          <label>Telephone<input name="profilePhone" value="${escapeHtml(state.user.phone || "")}"></label>
          <label>Country code<input name="profileCountry" value="${escapeHtml(state.user.country || "NG")}"></label>
        </div>
        <button class="primary-btn" data-action="update-profile">Save Profile</button>
      </section>
      <section class="grid book-grid">
        <article class="stat-card"><strong>${purchases.length}</strong><span>Purchases</span></article>
        <article class="stat-card"><strong>${state.gifts.filter((g) => g.senderUserId === state.user.id).length}</strong><span>Gifts sent</span></article>
        <article class="stat-card"><strong>${Object.keys(state.progress).length}</strong><span>Saved chapters</span></article>
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
  if (getRoute().startsWith("reader/")) {
    window.addEventListener("scroll", saveReaderProgress, { passive: true });
  } else {
    window.removeEventListener("scroll", saveReaderProgress);
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
    signup,
    oauth: () => oauthSignup(data.provider),
    "verify-email": verifyEmail,
    "resend-code": resendCode,
    "save-phone": savePhone,
    "save-profile": saveProfile,
    "open-book": () => openBook(data.bookId),
    unlock: () => showUnlockModal(data.bookId),
    "unlock-trilogy": showTrilogyModal,
    read: () => routeTo(`reader/${data.chapterId}`),
    "toggle-settings": toggleSettings,
    "speak-chapter": speakChapter,
    speak: () => speakText(data.text),
    "auto-scroll": toggleAutoScroll,
    "create-post": createPost,
    "like-post": () => likePost(data.postId),
    "share-post": () => sharePost(data.postId),
    "comment-post": () => commentPost(data.postId),
    "send-gift": sendGift,
    "redeem-gift": redeemGift,
    logout,
    "update-profile": updateProfile,
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

function showUnlockModal(bookId) {
  const book = findBook(bookId);
  openModal(html`
    <h2>Unlock ${escapeHtml(book.title)}</h2>
    <p>Choose single book access or the discounted trilogy package.</p>
    <div class="form-grid">
      <button class="primary-btn" data-modal-action="purchase-book" data-book-id="${book.id}">Unlock Book · ${currency(book.price)}</button>
      <button class="ghost-btn" data-modal-action="purchase-trilogy">Unlock Trilogy · ${currency(state.settings.trilogyPrice)}</button>
      <button class="ghost-btn" data-modal-action="close">Close</button>
    </div>
  `);
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

function purchase(productType, bookId = null, amount = state.settings.trilogyPrice) {
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

function handleModalAction(event) {
  const action = event.currentTarget.dataset.modalAction;
  const bookId = event.currentTarget.dataset.bookId;
  if (action === "purchase-book") purchase("book", bookId, findBook(bookId).price);
  if (action === "purchase-trilogy") purchase("trilogy", null, state.settings.trilogyPrice);
  if (action === "close") closeModal();
}

function toggleSettings() {
  document.querySelector("#settings-drawer")?.classList.toggle("is-open");
}

function updateReaderSetting(event) {
  const key = event.currentTarget.dataset.setting;
  const value = event.currentTarget.type === "range" ? Number(event.currentTarget.value) : event.currentTarget.value;
  state.readerSettings[key] = value;
  saveState();
  const shellNode = document.querySelector(".reader-shell");
  if (shellNode) {
    shellNode.className = `reader-shell ${state.readerSettings.theme}`;
    shellNode.style.setProperty("--reader-font", state.readerSettings.font);
    shellNode.style.setProperty("--reader-size", `${state.readerSettings.size}px`);
    shellNode.style.setProperty("--reader-line", state.readerSettings.line);
    shellNode.style.setProperty("--reader-align", state.readerSettings.align);
  }
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
