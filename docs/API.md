# Ascendance API Draft

The current backend uses `data/state.json` as temporary storage. These endpoints are shaped so they can move to PostgreSQL without changing the frontend contract.

## Auth

- `POST /api/auth/signup`
  - Body: `{ "email": "reader@example.com", "fullName": "Reader Name" }`
  - Creates or returns a reader with `onboardingStep: "verify"`.

- `POST /api/auth/verify-email`
  - Body: `{ "email": "reader@example.com", "code": "123456" }`
  - Marks the email verified and advances onboarding.

- `PATCH /api/users/me`
  - Header: `x-user-id: <reader id>`
  - Body: `{ "phone": "+234...", "username": "AdaReads", "country": "NG" }`
  - Updates profile and finishes onboarding when required fields are present.

## Books and Content

- `GET /api/books`
  - Optional header: `x-user-id`
  - Returns books, sections, chapters, and lock status. Locked chapters omit `content`.

- `GET /api/chapters/:chapterId`
  - Optional header: `x-user-id`
  - Returns chapter content only if the reader has preview, purchase, trilogy, or gift access.

- `POST /api/admin/books`
  - Creates a book.

- `POST /api/admin/books/:bookId/sections`
  - Creates a section inside a book.

- `POST /api/admin/sections/:sectionId/chapters`
  - Creates a chapter inside a section.

## Purchases and Progress

- `POST /api/purchases`
  - Header: `x-user-id`
  - Body: `{ "productType": "book", "bookId": "...", "amount": 4500 }`
  - Records a successful prototype purchase and transaction.

- `PUT /api/progress`
  - Header: `x-user-id`
  - Body: `{ "bookId": "...", "sectionId": "...", "chapterId": "...", "scrollPosition": 120, "percentage": 42 }`
  - Saves reading progress.

## Gifts

- `POST /api/gifts`
  - Header: `x-user-id`
  - Body: `{ "recipientEmail": "friend@example.com" }`
  - Enforces verified sender, at least one purchase, and weekly gift limit.

- `POST /api/gifts/redeem`
  - Header: `x-user-id`
  - Body: `{ "accessCode": "ABCDEFGH" }`
  - Redeems a gift code linked to the recipient email.

## Community

- `GET /api/community/posts`
  - Returns visible community posts.

- `POST /api/community/posts`
  - Header: `x-user-id`
  - Body: `{ "content": "My review...", "bookId": "..." }`
  - Creates a reader review.

- `POST /api/community/posts/:postId/like`
  - Header: `x-user-id`
  - Toggles a reader like.

- `POST /api/community/posts/:postId/comments`
  - Header: `x-user-id`
  - Body: `{ "comment": "Reply text" }`
  - Adds a comment.

## Compatibility

- `GET /api/state`
- `PUT /api/state`

These remain for the current prototype UI sync. They should be removed once the frontend fully uses resource endpoints.
