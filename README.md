# Personal Library Management SaaS

A production-leaning personal library app built with:
- Next.js (App Router)
- TypeScript
- Tailwind CSS
- shadcn/ui-style components

## Design Direction
Refined neo-brutalism: clean reading surfaces, hard borders/shadows, calm palette with strong interaction affordances.

## Features
- Dashboard (currently reading + stats)
- Library view (search/filter + grid/list-ready)
- Add/Edit Book form
- Book detail page with:
  - reading progress
  - notes (markdown input)
  - highlights
  - attachments
- Collections / shelves
- Settings + Billing (future-ready SaaS shell)
- Cloudflare R2 upload/download presign API stubs

## Setup
1. Open terminal in `D:\library-management`
2. Install deps:
   ```bash
   npm install
   ```
3. Copy env template:
   ```bash
   copy .env.example .env.local
   ```
4. Fill values in `.env.local`:
   - `R2_ACCOUNT_ID`
   - `R2_ACCESS_KEY_ID`
   - `R2_SECRET_ACCESS_KEY`
   - `R2_BUCKET`
5. Run dev server:
   ```bash
   npm run dev
   ```

## API Stubs
- `POST /api/r2/presign-upload`
- `POST /api/r2/presign-download`

Both return mock signed URL payloads and are ready for replacement with AWS SDK v3 (S3-compatible R2 signing).

## Neo-Brutal Utility Classes
Defined in `src/app/globals.css`:
- `.brutal-card`
- `.brutal-btn`
- `.brutal-input`
- `.brutal-badge`
- `.brutal-modal`

## Notes
- UI is responsive and intentionally personal (not enterprise-heavy).
- Keep reading areas mostly white for focus; accent colors are used for actions and highlights.
