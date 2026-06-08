# Ascendance WebApp Design Audit

Date: June 7, 2026

## Audit Basis

This review compares:

- The 27-page revised mockup set in `source-pages/mockup-01.png` through `source-pages/mockup-27.png`.
- The annotated journey in `source-pages/wireframe-01.png`.
- The current Next.js implementation in `app/page.jsx`.
- The written redesign requirements supplied with the mockups.

The revised design is a strong improvement in information architecture. It correctly makes reading the primary experience, separates shopping from Home, and gives Community a feed-first structure. It still needs a UI-system and accessibility pass before implementation.

## Executive Verdict

Proceed with the revised direction, with these corrections:

1. Do not reproduce the mockup's oversized typography and controls literally.
2. Protect reading content from fixed headers, controls, and bottom navigation.
3. Make purchase states and sequential book rules explicit.
4. Treat Community as a compact feed, not a leaderboard page with reviews below it.
5. Build History, Notifications, sharing, install, and Audio Drama as real flows.
6. Remove Admin from the reader shell, but keep secure admin authentication at a private route.

## Priority Findings

### P0: Required Before Visual Polish

#### 1. Reader controls obscure the book text

Evidence: `mockup-08.png` and `mockup-14.png`.

The fixed Auto-Scroll/Next bar and global navigation overlap the final lines of text. This can prevent users from reading or selecting content.

Recommendation:

- Reserve layout space for every fixed element using top and bottom content padding.
- Use a compact sticky reader header.
- Keep the reading column between 45 and 75 characters wide on larger screens.
- Use a default mobile body size around 18-20 px, with 1.6-1.8 line height.
- Put font, theme, alignment, line spacing, and scroll speed inside a closed Settings sheet.
- Keep only Back, TTS, Save, and Settings visible in the header.
- Keep Previous/Next and Auto-Scroll in a compact bottom reader toolbar.

Current implementation gap: the settings drawer is permanently open in `app/page.jsx`, and the reader has no settings toggle.

#### 2. Home still renders all books

Evidence: intended design in `mockup-06.png`; current code in `app/page.jsx`.

The requirement is one current/unlocked book on Home. The implementation still renders a `reader-home-list` containing every book after the featured book.

Recommendation:

- Home shows one active book only.
- Book Summary opens a focused summary sheet or page.
- Start/Continue Reading opens the last position.
- All other books and purchase choices belong in Store.
- Move Community Leaders below the main book actions, as shown in the revised mockup.

#### 3. Admin remains exposed in the public shell

Evidence: current `AppShell` includes an Admin button.

Recommendation:

- Remove Admin from reader navigation and public headers.
- Add a dedicated route such as `/admin`.
- Require server-side admin sessions and 2FA.
- A hidden URL is not a security boundary; authorization must remain server-enforced.

#### 4. Purchase rules are not represented as product states

Evidence: `mockup-09.png` through `mockup-13.png`.

The designs show the offers, but do not fully explain disabled and owned states.

Recommendation:

- Trilogy remains purchasable at all times.
- Book Two is disabled until Book One is owned.
- Book Three is disabled until Book Two is owned.
- Disabled cards state why: "Unlock Book One first."
- Owned products replace Unlock with Read.
- Show the USD display price and a brief note that checkout may charge the supported Paystack settlement currency.
- The post-preview screen defaults to Trilogy, but selection must remain clear and reversible.

#### 5. Missing functional destinations

The current implementation has no complete flows for:

- Audio Drama
- Community History
- Reader Notifications
- Share WebApp Link
- Install WebApp action
- Printed copy order

These should not be visual-only controls. Each needs a destination, success/error state, and mobile behavior.

### P1: High-Value UX Corrections

#### 6. Home and Community leaders need a true horizontal strip

Evidence: `mockup-06.png` and `mockup-18.png`.

The circular treatment is much better than the old vertical leaderboard. Five items are still cramped on narrow phones.

Recommendation:

- Use a horizontally scrollable list with 72-88 px items.
- Show rank, avatar, points, and country in a predictable order.
- Keep names to one truncated line.
- Provide keyboard focus and accessible names.
- Tapping a leader opens their Community activity thread.
- "View Full Leaderboard" opens a dedicated leaderboard view.

#### 7. Community feed remains visually oversized

Evidence: `mockup-18.png`.

The header icons, filter, cards, and floating action button are too large for a repeated-use app. The bottom navigation also covers the second card.

Recommendation:

- Reduce the Community heading to a compact app-header scale.
- Use 16-18 px post titles and 15-17 px body text.
- Use compact action icons with counts and tooltips/accessible labels.
- Give the feed bottom padding equal to navigation height plus safe-area inset.
- Keep the composer as a floating pen action, but size it around 48-56 px.
- Place Newest in a small filter control aligned with the feed heading.

#### 8. Review creation needs limits and state feedback

Evidence: `mockup-20.png` and `mockup-21.png`.

Recommendation:

- Title maximum: 30 characters.
- Review maximum: 250 characters.
- Show live character counters.
- Disable Post until valid.
- Preserve draft text if posting fails.
- On success, show the review and then offer user-authorized sharing.
- Native share is primary; platform links are fallback actions.

#### 9. Reply depth needs a visible interaction rule

Evidence: `mockup-19.png`.

Recommendation:

- Post is level 0.
- Comment is level 1.
- Reply to comment is level 2.
- Do not show Reply on level 2.
- Use indentation, a subtle connector, and "Replying to [name]" to clarify context.
- Highlight Admin replies with a label and restrained accent, not a wholly different layout.

#### 10. Profile redesign is incomplete

Evidence: `mockup-27.png`.

The page combines a browser screenshot with proposed app elements, so it cannot be implemented pixel-for-pixel.

Recommendation:

- Rebuild Profile as one consistent app screen.
- Add Share WebApp Link with preview text and native sharing.
- Add Install App only when the PWA install prompt is available.
- Show a helpful installed/unsupported state otherwise.
- Keep purchases, progress, gift history, and account controls in compact sections.

### P2: Consistency and Accessibility

#### 11. Establish a compact type and spacing system

Suggested mobile scale:

- App title: 28-32 px
- Page title: 24-28 px
- Section title: 18-22 px
- Card title: 16-18 px
- Body: 15-17 px
- Reader body: 18-20 px, user adjustable
- Metadata: 12-14 px
- Standard horizontal page padding: 16-20 px
- Minimum touch target: 44 by 44 px

Avoid scaling fonts directly with viewport width. Tablet and desktop layouts should gain whitespace and columns, not dramatically larger text.

#### 12. Improve contrast and icon consistency

- Gray metadata on cream must meet WCAG contrast requirements.
- Do not rely on color alone for locked, selected, active, or error states.
- Use one icon library and one stroke weight.
- Give icon-only controls accessible labels.
- The dark Notifications mockup should either become a deliberate supported theme or use the standard light surface.

#### 13. Handle safe areas and device differences

- Apply `env(safe-area-inset-top)` and `env(safe-area-inset-bottom)` where appropriate.
- Test at 320, 360, 390, 430, 768, 1024, and 1440 px widths.
- Fixed navigation and reader controls must never cover content.
- Long titles and usernames must wrap or truncate without changing control dimensions.

## Screen Group Review

### Splash and Login: Pages 1-4

Keep:

- Ascendance remains the strongest visual signal.
- Trailer-before-login is appropriate.
- Reduced "Presented by" treatment.

Revise:

- Add Skip and sound controls to the trailer.
- Respect reduced-motion and data-saving preferences.
- Keep Create a Reader Profile visually prominent but secondary to Login.
- Avoid a splash delay longer than needed; returning authenticated readers should resume quickly.

### Home: Pages 5-6 and 15-16

Keep:

- One current book.
- Book Summary and Start/Continue Reading.
- Compact Community Leaders below the book.

Revise:

- Reduce cover height so actions and the beginning of Community Leaders remain visible on common phones.
- Show reading progress near Continue Reading.
- Audio Drama must have a label or tooltip and a clear playback destination.

### Reader and Unlock: Pages 7-9 and 14

Keep:

- Simplified top controls.
- Settings moved into a separate control.
- Clear Book and section context.
- End-of-preview purchase decision.

Revise:

- Fix all fixed-element overlap.
- Reduce default text and header dimensions.
- Add explicit TTS play/pause state and unavailable state.
- Confirm whether the free content is Prologue plus Chapters 1-14 as one section.

### Store: Pages 10-13

Keep:

- Trilogy offer first.
- Real book covers.
- Printed copy order.

Revise:

- Use product cards with Owned, Available, and Requires previous book states.
- Do not expose individual chapter unlocks.
- Keep each product's title, included sections, price, and primary action scannable.
- Add transaction loading, success, cancellation, and verification states.

### Community: Pages 17-26

Keep:

- Feed-first layout.
- Leaders strip.
- Newest/Oldest/Most Liked/Most Replied filtering.
- Review details, History, Notifications, and sharing.

Revise:

- Reduce scale and vertical padding.
- Do not let leaderboard content dominate the first viewport.
- Make post cards clickable while preserving distinct action buttons.
- Add report action to the detail/menu flow.
- Use consistent light/dark theming.

### Profile: Page 27

Keep:

- Share WebApp Link.
- Install App action.

Revise:

- Redesign as a complete screen instead of attaching controls beneath a screenshot.
- Add unavailable and already-installed PWA states.
- Include gift history and reading summary from the original requirements.

## Implementation Order

### Phase 1: Core Reading and Navigation

1. Remove public Admin entry and create secure `/admin`.
2. Rebuild app header and bottom navigation dimensions.
3. Rebuild Home around one current book.
4. Rebuild Reader with non-overlapping fixed controls and Settings sheet.
5. Implement preview-end unlock routing.

### Phase 2: Store and Entitlements

1. Replace chapter-level storefront presentation with book-level products.
2. Implement sequential book purchase rules.
3. Add owned/disabled/read states.
4. Add printed-copy order flow.
5. Verify payment success before granting access.

### Phase 3: Community

1. Build compact leaders strip and full leaderboard.
2. Build feed, filters, post details, and constrained composer.
3. Add two-level replies, reporting, and highlighted Admin replies.
4. Add History, Notifications, and user-authorized sharing.

### Phase 4: Profile, PWA, and Media

1. Add Share WebApp Link and tracking.
2. Add contextual Install App control.
3. Add Audio Drama flow.
4. Add gift and reading summaries.
5. Complete responsive and accessibility testing.

## Decisions Needed Before Implementation

1. Confirm that free access is exactly the Prologue plus Chapters 1-14 in "Book One: The Formation."
2. Confirm whether the global bottom navigation remains visible while reading. Recommendation: keep it hidden or collapsed in focused reading mode.
3. Provide the Audio Drama file or streaming URL and expected player behavior.
4. Define how printed-copy orders are fulfilled: WhatsApp, email form, or checkout.
5. Provide or approve Admin dashboard mockups; the uploaded set covers the reader experience only.

## Evidence Limit

The uploaded documents include screenshots of the current authenticated experience, and the current source was inspected. This audit did not perform an authenticated production usability session, so payment completion, email delivery, offline behavior, and real-device PWA installation still require hands-on verification.
