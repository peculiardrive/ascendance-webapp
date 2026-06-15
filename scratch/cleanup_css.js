import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const cssPath = join(process.cwd(), "app/globals.css");
let css = readFileSync(cssPath, "utf8");

// Find the start of our custom reader CSS section
const anchor = ".shell.is-reading .nav-tabs {";
const index = css.indexOf(anchor);

if (index === -1) {
  console.error("Could not find the clean CSS anchor point in globals.css.");
  process.exit(1);
}

// Truncate the file at that point
const baseCss = css.slice(0, index);

// Clean CSS block to append
const cleanCss = `.shell.is-reading .nav-tabs {
  display: none !important;
}

/* Midnight Gold Theme Specifics */
.reader-shell.midnight-gold {
  --reader-bg: #16161a !important;
  --reader-ink: #e8dcc4 !important;
  min-height: calc(100vh - var(--nav-height));
  background: var(--reader-bg);
  color: var(--reader-ink);
}
.reader-shell.midnight-gold .reader-topbar,
.reader-shell.midnight-gold .reader-brand {
  background: #16161a !important;
  border-bottom: 1px solid rgba(201, 157, 66, 0.25) !important;
}
.reader-shell.midnight-gold .reader-title h1,
.reader-shell.midnight-gold .reader-body h2 {
  color: #c99d42 !important;
}
.reader-shell.midnight-gold .reader-command {
  border-color: #c99d42 !important;
  color: #c99d42 !important;
}
.reader-shell.midnight-gold .reader-command.is-active {
  background: #c99d42 !important;
  color: #16161a !important;
}
.reader-shell.midnight-gold input[type="range"] {
  accent-color: #c99d42 !important;
}

/* Royal Forest Theme Specifics */
.reader-shell.royal-forest {
  --reader-bg: #0b1a11 !important;
  --reader-ink: #e8f5ec !important;
  min-height: calc(100vh - var(--nav-height));
  background: var(--reader-bg);
  color: var(--reader-ink);
}
.reader-shell.royal-forest .reader-topbar,
.reader-shell.royal-forest .reader-brand {
  background: #0b1a11 !important;
  border-bottom: 1px solid rgba(60, 94, 71, 0.25) !important;
}
.reader-shell.royal-forest .reader-title h1,
.reader-shell.royal-forest .reader-body h2 {
  color: #62aa7b !important;
}
.reader-shell.royal-forest .reader-command {
  border-color: #3c5e47 !important;
  color: #62aa7b !important;
}
.reader-shell.royal-forest .reader-command.is-active {
  background: #3c5e47 !important;
  color: #e8f5ec !important;
}
.reader-shell.royal-forest input[type="range"] {
  accent-color: #62aa7b !important;
}

/* Custom Reusable Toggle Switch */
.toggle-switch {
  appearance: none !important;
  width: 44px !important;
  height: 24px !important;
  background: #ccc !important;
  border-radius: 12px !important;
  position: relative !important;
  transition: background 0.3s, transform 0.3s !important;
  outline: none !important;
  cursor: pointer !important;
  flex-shrink: 0 !important;
}

.toggle-switch::after {
  content: '' !important;
  position: absolute !important;
  top: 2px !important;
  left: 2px !important;
  width: 20px !important;
  height: 20px !important;
  border-radius: 50% !important;
  background: #ffffff !important;
  transition: transform 0.3s !important;
  box-shadow: 0 1px 3px rgba(0,0,0,0.2) !important;
}

.toggle-switch:checked {
  background: var(--app-purple, #8b5cf6) !important;
}

.toggle-switch:checked::after {
  transform: translateX(20px) !important;
}

.reader-shell.midnight-gold .toggle-switch:checked {
  background: #c99d42 !important;
}
.reader-shell.royal-forest .toggle-switch:checked {
  background: #3c5e47 !important;
}

/* Reader Bottom Bar */
.reader-bottom-bar {
  position: fixed !important;
  bottom: 0 !important;
  left: 0 !important;
  right: 0 !important;
  height: 72px !important;
  background: #ffffff !important;
  border-top: 1px solid rgba(128,105,90,0.15) !important;
  padding: 0 24px !important;
  display: flex !important;
  justify-content: space-between !important;
  align-items: center !important;
  z-index: 95 !important;
}

.reader-bottom-bar-label {
  display: flex !important;
  align-items: center !important;
  gap: 12px !important;
  cursor: pointer !important;
  font-weight: 700 !important;
  color: #111111 !important;
  font-size: 0.95rem !important;
}

.reader-bottom-bar-btn {
  background: transparent !important;
  border: none !important;
  font-weight: 700 !important;
  font-size: 1.25rem !important;
  color: #111111 !important;
  cursor: pointer !important;
  padding: 8px 12px !important;
  border-radius: 8px !important;
  transition: background 0.2s ease !important;
}

.reader-bottom-bar-btn:hover {
  background: rgba(0, 0, 0, 0.05) !important;
}

/* Theme overrides for Reader Bottom Bar */
.reader-shell.sepia .reader-bottom-bar {
  background: #f4ead8 !important;
  border-top-color: rgba(62, 52, 44, 0.15) !important;
}
.reader-shell.sepia .reader-bottom-bar-label,
.reader-shell.sepia .reader-bottom-bar-btn {
  color: #3e342c !important;
}
.reader-shell.sepia .reader-bottom-bar-btn:hover {
  background: rgba(62, 52, 44, 0.06) !important;
}

.reader-shell.dark .reader-bottom-bar {
  background: #17151c !important;
  border-top-color: rgba(238, 232, 240, 0.15) !important;
}
.reader-shell.dark .reader-bottom-bar-label,
.reader-shell.dark .reader-bottom-bar-btn {
  color: #eee8f0 !important;
}
.reader-shell.dark .reader-bottom-bar-btn:hover {
  background: rgba(238, 232, 240, 0.08) !important;
}

.reader-shell.midnight-gold .reader-bottom-bar {
  background: #16161a !important;
  border-top-color: rgba(201, 157, 66, 0.2) !important;
}
.reader-shell.midnight-gold .reader-bottom-bar-label,
.reader-shell.midnight-gold .reader-bottom-bar-btn {
  color: #e8dcc4 !important;
}
.reader-shell.midnight-gold .reader-bottom-bar-btn:hover {
  background: rgba(201, 157, 66, 0.08) !important;
}

.reader-shell.royal-forest .reader-bottom-bar {
  background: #0b1a11 !important;
  border-top-color: rgba(60, 94, 71, 0.2) !important;
}
.reader-shell.royal-forest .reader-bottom-bar-label,
.reader-shell.royal-forest .reader-bottom-bar-btn {
  color: #e8f5ec !important;
}
.reader-shell.royal-forest .reader-bottom-bar-btn:hover {
  background: rgba(60, 94, 71, 0.08) !important;
}

/* Typography select container in Settings Drawer */
.typography-toggle-container {
  display: flex !important;
  border-radius: 8px !important;
  padding: 4px !important;
  background: #f1f1f1 !important;
}
.reader-shell.sepia .typography-toggle-container {
  background: rgba(62, 52, 44, 0.1) !important;
}
.reader-shell.dark .typography-toggle-container {
  background: #2c2c2e !important;
}
.reader-shell.midnight-gold .typography-toggle-container {
  background: #252529 !important;
}
.reader-shell.royal-forest .typography-toggle-container {
  background: #152b1d !important;
}

.font-select-btn {
  padding: 8px 16px !important;
  border: none !important;
  border-radius: 6px !important;
  background: transparent !important;
  color: inherit !important;
  font-weight: 700 !important;
  cursor: pointer !important;
  transition: all 0.2s ease !important;
}

.font-select-btn.is-active {
  background: #ffffff !important;
  color: #111111 !important;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1) !important;
}

.reader-shell.dark .font-select-btn.is-active {
  background: #3a3a3c !important;
  color: #ffffff !important;
}
.reader-shell.midnight-gold .font-select-btn.is-active {
  background: #c99d42 !important;
  color: #16161a !important;
}
.reader-shell.royal-forest .font-select-btn.is-active {
  background: #3c5e47 !important;
  color: #e8f5ec !important;
}

/* Overlays & Drawers size/positioning constraints */
.reader-settings-overlay, .reader-glossary-overlay, .quote-card-overlay {
  position: fixed !important;
  inset: 0 !important;
  background: rgba(0, 0, 0, 0.4) !important;
  backdrop-filter: blur(8px) !important;
  -webkit-backdrop-filter: blur(8px) !important;
  z-index: 150 !important;
  display: flex !important;
  flex-direction: column !important;
  justify-content: flex-end !important;
}

/* Settings Drawer Layout overrides */
.settings-drawer {
  position: fixed !important;
  bottom: 0 !important;
  left: 0 !important;
  right: 0 !important;
  top: auto !important;
  background: #ffffff !important;
  padding: 24px !important;
  border-top-left-radius: 24px !important;
  border-top-right-radius: 24px !important;
  color: #111111 !important;
  z-index: 160 !important;
  display: flex !important;
  flex-direction: column !important;
  box-shadow: 0 -10px 40px rgba(0, 0, 0, 0.15) !important;
  animation: slideUp 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
}

@keyframes slideUp {
  from {
    transform: translateY(100%);
  }
  to {
    transform: translateY(0);
  }
}

/* Theme overrides for Settings Drawer */
.reader-shell.sepia .settings-drawer {
  background: #f4ead8 !important;
  color: #3e342c !important;
}
.reader-shell.dark .settings-drawer {
  background: #1c1c1e !important;
  color: #ffffff !important;
}
.reader-shell.midnight-gold .settings-drawer {
  background: #16161a !important;
  color: #e8dcc4 !important;
  border-top: 1px solid rgba(201, 157, 66, 0.2) !important;
}
.reader-shell.royal-forest .settings-drawer {
  background: #0b1a11 !important;
  color: #e8f5ec !important;
  border-top: 1px solid rgba(60, 94, 71, 0.2) !important;
}

/* Quote card sharing overlays */
.floating-quote-btn {
  position: absolute !important;
  z-index: 90 !important;
  background: var(--app-purple, #8b5cf6) !important;
  color: #ffffff !important;
  border: none !important;
  border-radius: 20px !important;
  padding: 8px 14px !important;
  font-size: 0.85rem !important;
  font-weight: 700 !important;
  box-shadow: 0 4px 12px rgba(139, 92, 246, 0.4) !important;
  cursor: pointer !important;
  display: inline-flex !important;
  align-items: center !important;
  gap: 4px !important;
  transition: transform 0.15s ease, background 0.15s ease !important;
}
.floating-quote-btn:hover {
  background: #7c3aed !important;
  transform: translate(-50%, -100%) scale(1.05) !important;
}
.floating-quote-btn:active {
  transform: translate(-50%, -100%) scale(0.95) !important;
}

.quote-card-overlay {
  position: fixed !important;
  inset: 0 !important;
  background: rgba(0, 0, 0, 0.6) !important;
  backdrop-filter: blur(12px) !important;
  -webkit-backdrop-filter: blur(12px) !important;
  z-index: 200 !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  padding: 24px !important;
}

.quote-card-box {
  width: 100% !important;
  max-width: 400px !important;
  background: #ffffff !important;
  border-radius: 24px !important;
  padding: 24px !important;
  box-shadow: 0 20px 40px rgba(0,0,0,0.3) !important;
  display: flex !important;
  flex-direction: column !important;
  gap: 20px !important;
  animation: modalScaleIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) !important;
}

@keyframes modalScaleIn {
  from {
    transform: scale(0.9);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}

.quote-card-preview {
  background: linear-gradient(135deg, #2e0854, #130326) !important;
  color: #ffffff !important;
  border-radius: 16px !important;
  padding: 32px 24px !important;
  text-align: center !important;
  position: relative !important;
  overflow: hidden !important;
  box-shadow: inset 0 0 40px rgba(0,0,0,0.3) !important;
}
.quote-card-preview::before {
  content: '“' !important;
  position: absolute !important;
  top: -10px !important;
  left: 10px !important;
  font-size: 8rem !important;
  color: rgba(255,255,255,0.06) !important;
  font-family: 'Georgia', serif !important;
  line-height: 1 !important;
}

.quote-card-text {
  font-family: 'Georgia', serif !important;
  font-size: 1.25rem !important;
  line-height: 1.6 !important;
  font-style: italic !important;
  margin-bottom: 20px !important;
  position: relative !important;
  z-index: 2 !important;
  word-break: break-word !important;
  text-shadow: 0 2px 4px rgba(0,0,0,0.2) !important;
}

.quote-card-attribution {
  font-family: 'Outfit', sans-serif !important;
  font-size: 0.85rem !important;
  text-transform: uppercase !important;
  letter-spacing: 2px !important;
  color: #c99d42 !important;
  font-weight: 700 !important;
  position: relative !important;
  z-index: 2 !important;
}

.quote-card-watermark {
  font-family: 'Outfit', sans-serif !important;
  font-size: 0.7rem !important;
  color: rgba(255,255,255,0.4) !important;
  letter-spacing: 1px !important;
  margin-top: 12px !important;
  position: relative !important;
  z-index: 2 !important;
}

.quote-card-actions {
  display: flex !important;
  gap: 10px !important;
  justify-content: flex-end !important;
}

/* Glossary Drawer Base (Mobile first) */
.glossary-drawer {
  position: fixed !important;
  bottom: 0 !important;
  left: 0 !important;
  right: 0 !important;
  height: 75vh !important;
  background: #ffffff !important;
  border-top-left-radius: 24px !important;
  border-top-right-radius: 24px !important;
  z-index: 180 !important;
  display: flex !important;
  flex-direction: column !important;
  box-shadow: 0 -10px 40px rgba(0, 0, 0, 0.15) !important;
  transform: translateY(100%) !important;
  transition: transform 0.35s cubic-bezier(0.4, 0, 0.2, 1) !important;
  overflow: hidden !important;
}

.glossary-drawer.is-open {
  transform: translateY(0) !important;
}

/* Dark mode and themed overrides for Glossary Drawer */
.reader-shell.dark .glossary-drawer,
.reader-shell.midnight-gold .glossary-drawer,
.reader-shell.royal-forest .glossary-drawer {
  background: #1c1c1e !important;
  color: #ffffff !important;
  box-shadow: 0 -10px 40px rgba(0, 0, 0, 0.5) !important;
}

.glossary-header {
  display: flex !important;
  align-items: center !important;
  justify-content: space-between !important;
  padding: 20px 24px !important;
  border-bottom: 1px solid rgba(0, 0, 0, 0.08) !important;
}

.reader-shell.dark .glossary-header,
.reader-shell.midnight-gold .glossary-header,
.reader-shell.royal-forest .glossary-header {
  border-bottom: 1px solid rgba(255, 255, 255, 0.08) !important;
}

.glossary-header h2 {
  margin: 0 !important;
  font-size: 1.25rem !important;
  font-weight: 700 !important;
  font-family: 'Georgia', serif !important;
  letter-spacing: -0.5px !important;
}

.glossary-close {
  background: transparent !important;
  border: none !important;
  font-size: 1.8rem !important;
  font-weight: 300 !important;
  line-height: 1 !important;
  color: var(--muted) !important;
  cursor: pointer !important;
  padding: 4px !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  transition: color 0.15s ease !important;
}
.glossary-close:hover {
  color: var(--brand) !important;
}

.glossary-content {
  flex: 1 !important;
  overflow-y: auto !important;
  padding: 20px 24px 100px !important;
  display: flex !important;
  flex-direction: column !important;
  gap: 16px !important;
}

.glossary-card {
  background: #f8f6f2 !important;
  border: 1px solid rgba(0, 0, 0, 0.04) !important;
  border-radius: 16px !important;
  padding: 16px !important;
  transition: transform 0.2s ease, box-shadow 0.2s ease !important;
}
.glossary-card:hover {
  transform: translateY(-2px) !important;
  box-shadow: 0 4px 12px rgba(0,0,0,0.05) !important;
}

.reader-shell.dark .glossary-card {
  background: #2c2c2e !important;
}
.reader-shell.midnight-gold .glossary-card {
  background: #252529 !important;
  border-color: rgba(201, 157, 66, 0.15) !important;
}
.reader-shell.royal-forest .glossary-card {
  background: #1e3626 !important;
  border-color: rgba(60, 94, 71, 0.15) !important;
}

.glossary-card-top {
  display: flex !important;
  align-items: center !important;
  gap: 12px !important;
  margin-bottom: 12px !important;
}

.glossary-avatar-circle {
  width: 44px !important;
  height: 44px !important;
  border-radius: 50% !important;
  background: var(--brand-soft) !important;
  color: var(--brand) !important;
  font-size: 1.2rem !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  font-weight: 750 !important;
  border: 2px solid #ffffff !important;
  box-shadow: 0 2px 6px rgba(0,0,0,0.08) !important;
}

.reader-shell.dark .glossary-avatar-circle {
  border-color: #2c2c2e !important;
}
.reader-shell.midnight-gold .glossary-avatar-circle {
  border-color: #252529 !important;
  background: rgba(201, 157, 66, 0.15) !important;
  color: #c99d42 !important;
}
.reader-shell.royal-forest .glossary-avatar-circle {
  border-color: #1e3626 !important;
  background: rgba(60, 94, 71, 0.15) !important;
  color: #62aa7b !important;
}

.glossary-card-info {
  display: flex !important;
  flex-direction: column !important;
}

.glossary-card-info h3 {
  margin: 0 !important;
  font-size: 1rem !important;
  font-weight: 700 !important;
}

.glossary-card-info span {
  font-size: 0.78rem !important;
  color: var(--muted) !important;
  text-transform: uppercase !important;
  letter-spacing: 0.5px !important;
  font-weight: 600 !important;
}

.reader-shell.midnight-gold .glossary-card-info span {
  color: #a39274 !important;
}
.reader-shell.royal-forest .glossary-card-info span {
  color: #8fa697 !important;
}

.glossary-card p {
  margin: 0 !important;
  font-size: 0.88rem !important;
  line-height: 1.5 !important;
  color: #555555 !important;
}

.reader-shell.dark .glossary-card p,
.reader-shell.midnight-gold .glossary-card p,
.reader-shell.royal-forest .glossary-card p {
  color: #dddddd !important;
}

/* ==========================================
   Desktop / Shell Width Constraints for Overlays
   ========================================== */
@media (min-width: 760px) {
  .reader-settings-overlay, 
  .reader-glossary-overlay, 
  .quote-card-overlay {
    left: 50% !important;
    right: auto !important;
    width: min(var(--app-width), 100%) !important;
    transform: translateX(-50%) !important;
  }

  .settings-drawer {
    left: 50% !important;
    right: auto !important;
    width: min(var(--app-width), 100%) !important;
    transform: translateX(-50%) !important;
  }

  .glossary-drawer {
    left: 50% !important;
    right: auto !important;
    width: min(var(--app-width), 100%) !important;
    transform: translate(-50%, 100%) !important;
  }
  .glossary-drawer.is-open {
    transform: translate(-50%, 0) !important;
  }

  .reader-bottom-bar {
    left: 50% !important;
    right: auto !important;
    width: min(var(--app-width), 100%) !important;
    transform: translateX(-50%) !important;
  }
}

/* Store Book Footer Container */
.store-book-footer {
  display: flex !important;
  justify-content: space-between !important;
  align-items: center !important;
  margin-top: 12px !important;
}

.store-book-footer button {
  margin: 0 !important;
}

.support-email-link {
  color: var(--brand) !important;
  text-decoration: none !important;
  font-weight: 600 !important;
}

.support-email-link:hover {
  text-decoration: underline !important;
  opacity: 0.8 !important;
}
`;

writeFileSync(cssPath, `${baseCss}${cleanCss}`, "utf8");
console.log("Successfully cleaned up globals.css duplicate blocks!");
