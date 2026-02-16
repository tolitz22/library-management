# Google Sheets Implementation Prompt (Copy-Paste)

Use this prompt with your coding agent to implement the integration end-to-end.

---

Act as a senior full-stack engineer. Upgrade my existing Next.js (App Router) + TypeScript + Tailwind + shadcn-style Personal Library app with:

1) Multi-user authentication
2) Google Sheets as backend datastore
3) ISBN auto-add with imageUrl from ISBN search response

## Requirements

### Auth
- Implement user registration + login + logout using NextAuth/Auth.js credentials provider.
- Store users in Google Sheet `users`.
- Hash password securely (bcrypt or argon2).
- Session must include userId.
- Protect all library routes and APIs to logged-in users only.

### Google Sheets backend
- Use Google Sheets API via service account.
- Create reusable data access layer in `src/lib/sheets.ts`.
- Sheets:
  - users(userId,email,name,passwordHash,createdAt)
  - books(id,userId,title,author,isbn,imageUrl,shelf,tags,currentPage,totalPages,progress,status,createdAt,updatedAt)
  - notes(id,bookId,userId,content,createdAt)
  - highlights(id,bookId,userId,content,createdAt)
- Enforce per-user isolation in all queries (filter by userId from session).

### ISBN auto-add
- ISBN search endpoint should fetch book metadata (OpenLibrary or Google Books).
- On success, create a row in `books` for the current user.
- Persist imageUrl from the ISBN API result.
- Return created book to UI and render immediately.

### Existing app behavior
- Keep current UI style and theme system.
- Keep grid/list toggle and book detail flow.
- Keep page-based progress (currentPage/totalPages -> computed progress).
- Save progress updates to Sheets (not local-only).

### API routes
Implement or refactor:
- POST /api/auth/register
- GET /api/books
- POST /api/books
- POST /api/books/isbn-add
- PATCH /api/books/[id]
- POST /api/notes
- POST /api/highlights

### Validation and safety
- Use Zod for request validation.
- Return typed JSON responses.
- Add basic rate-limiting for write endpoints.
- Handle Sheets API errors gracefully with actionable messages.

### Environment variables
Add `.env.example` entries for:
- NEXTAUTH_SECRET
- NEXTAUTH_URL
- GOOGLE_SERVICE_ACCOUNT_EMAIL
- GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY
- GOOGLE_SHEET_ID

### Deliverables
- File-by-file code changes
- Any new dependencies
- Setup instructions (Google Cloud + Sheets sharing to service account)
- Test checklist (register, login, ISBN add, multi-user isolation)

### Extra implementation constraints
- Keep TypeScript strict and avoid `any` unless unavoidable.
- Create mapping utilities between sheet rows and domain models.
- Do not expose Google credentials to client-side code.
- Replace current localStorage persistence for books with API-backed persistence.
- Preserve existing UI/UX behavior while changing data source.

### Suggested implementation order
1. sheets adapter + env wiring
2. auth + register
3. books APIs + isbn add
4. frontend data fetching/mutations
5. notes/highlights APIs
6. route protection + QA
