# Google Sheets + Multi-User Integration Plan

## Goal
Integrate the Personal Library app with:
1. Google Sheets as backend datastore
2. User registration/login
3. ISBN auto-add where `imageUrl` comes from ISBN search

---

## 0) Install dependencies

```bash
npm i next-auth bcryptjs googleapis nanoid zod
npm i -D @types/bcryptjs
```

---

## 1) Environment setup

Update `.env.example`:

```env
NEXTAUTH_SECRET=
NEXTAUTH_URL=http://localhost:3000

GOOGLE_SHEET_ID=
GOOGLE_SERVICE_ACCOUNT_EMAIL=
GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY=
```

> Note: for `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY`, keep newline escapes (`\n`) when stored in `.env`.

---

## 2) Data model in Google Sheets

Create tabs:

### `users`
- `userId`
- `email`
- `name`
- `passwordHash`
- `createdAt`

### `books`
- `id`
- `userId`
- `title`
- `author`
- `isbn`
- `imageUrl`
- `shelf`
- `tags`
- `currentPage`
- `totalPages`
- `progress`
- `status`
- `createdAt`
- `updatedAt`

### `notes`
- `id`
- `bookId`
- `userId`
- `content`
- `createdAt`

### `highlights`
- `id`
- `bookId`
- `userId`
- `content`
- `createdAt`

---

## 3) Types and mappings

### Update `src/lib/types.ts`
Add/ensure:
- `Book.isbn?: string`
- `Book.imageUrl?: string` (or map to existing `coverUrl`)
- `Book.userId?: string`
- `Book.currentPage?: number`
- `Book.totalPages?: number`

Add row types for Sheets:
- `UserRow`
- `BookRow`
- `NoteRow`
- `HighlightRow`

### Create `src/lib/mappers.ts`
- `sheetBookRowToBook(row)`
- `bookToSheetRow(book)`

Keep a single canonical UI field (`coverUrl`), map from Sheet `imageUrl`.

---

## 4) Google Sheets adapter

Create `src/lib/sheets.ts` with:
- `getSheetsClient()`
- `getSheetValues(sheetName)`
- `appendSheetRow(sheetName, row)`
- `findRowsByField(sheetName, field, value)`
- `findRowsByUser(sheetName, userId)`
- `updateSheetRowById(sheetName, id, patchObj)`

Use `googleapis` + service account credentials from env.

---

## 5) Authentication

### Create `src/lib/auth.ts`
- `hashPassword(password)` using `bcryptjs`
- `verifyPassword(password, hash)`
- `findUserByEmail(email)` from `users` sheet
- `createUser({name,email,password})`

### Create auth options
- `src/lib/auth-options.ts` (or `src/auth.config.ts`)
- Credentials provider
- JWT session strategy
- Include `user.id` in session callback

### Create NextAuth route
- `src/app/api/auth/[...nextauth]/route.ts`

### Registration route
- `src/app/api/auth/register/route.ts`
- Validate with Zod
- Prevent duplicate email
- Hash password before save

---

## 6) Route protection

Create `src/middleware.ts`:

Protect:
- `/library/:path*`
- `/collections/:path*`
- `/settings/:path*`
- `/billing/:path*`

Allow public:
- `/login`
- `/register`
- `/api/auth/*`

---

## 7) Auth pages

Create:
- `src/app/login/page.tsx`
- `src/app/register/page.tsx`

Features:
- Register -> POST `/api/auth/register`
- Login -> `signIn("credentials")`
- Redirect to `/library`

---

## 8) Books API

Create:

### `src/app/api/books/route.ts`
- `GET`: list books for current `userId`
- `POST`: add manual book for current `userId`

### `src/app/api/books/[id]/route.ts`
- `PATCH`: update book (progress/pages/shelf/tags)
- Enforce ownership by `userId`

### `src/app/api/books/isbn-add/route.ts`
- Input ISBN
- Fetch metadata from OpenLibrary (or Google Books)
- Save book row with `imageUrl` from ISBN result
- Return created book

---

## 9) Notes and highlights API

Create:
- `src/app/api/notes/route.ts` (`POST`)
- `src/app/api/highlights/route.ts` (`POST`)

Rules:
- Require auth
- Save `userId` + `bookId`
- Validate payloads with Zod

---

## 10) Frontend refactor (replace localStorage source of truth)

### `src/components/library-client.tsx`
- Load books from `GET /api/books`
- Update state from API responses
- Keep view mode + shelf filter UI

### `src/components/book-search-add.tsx`
- ISBN add => `POST /api/books/isbn-add`
- Use returned book object (with image URL)

### `src/components/book-form.tsx`
- Save => `POST /api/books`

### `src/app/library/[id]/page.tsx`
- Persist page tracking via `PATCH /api/books/[id]`
- Progress computed from `currentPage/totalPages`

---

## 11) Validation + reliability

- Use Zod in every write API
- Graceful error responses
- Optional lightweight rate limit helper (`src/lib/rate-limit.ts`)

Apply rate-limits to:
- register
- isbn-add
- add/update books
- add notes/highlights

---

## 12) Cleanup

- Deprecate/remove old ISBN stub route if replaced
- Keep `search` route for keyword search only
- Ensure no sensitive keys are exposed client-side

---

## 13) Test checklist

1. Register user A
2. Login user A
3. Add book via ISBN (cover from ISBN metadata)
4. Add manual book via Quick Add
5. Update current/total pages -> progress auto-calculates
6. Add note/highlight
7. Logout/login persists data
8. Register user B -> cannot see user A data
9. Verify dark/light and template UI still readable

---

## 14) Suggested order of implementation

1. `sheets.ts` + env wiring
2. auth (`register` + `nextauth`)
3. books APIs (`GET/POST/PATCH/isbn-add`)
4. frontend switch from localStorage to API
5. notes/highlights APIs
6. middleware protection
7. final QA and polish

---

## Notes
- Keep Google Sheets as MVP datastore; if usage grows, migrate to Postgres.
- Maintain `userId` filtering everywhere to avoid data leakage.
- For production, prefer `argon2` over bcrypt if infra supports it.
