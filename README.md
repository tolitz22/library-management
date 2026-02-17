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

## PWA
This app is configured as an installable Progressive Web App (PWA) for production builds.

### Run
```bash
npm run dev
```
- Service worker registration is disabled in dev to avoid cache confusion.

```bash
npm run build
npm run start
```
- Service worker is active in production mode.

### Test installability
1. Open the production app (`npm run start`).
2. In Chrome/Edge, open the URL and look for **Install app** in the address bar/menu.
3. Confirm app installs with icon and standalone window.

### Test offline mode
1. Open app in production mode and navigate a few pages.
2. DevTools → Network → set **Offline**.
3. Refresh or navigate.
4. You should get cached pages/static assets and `/offline` fallback for uncached navigations.

### Service worker update / cache reset
- Trigger update:
  1. Deploy new build.
  2. Reload app once; SW uses `skipWaiting` + `controllerchange` to activate latest worker.
- Force reset manually:
  1. DevTools → Application → Service Workers → **Unregister**.
  2. DevTools → Application → Storage → **Clear site data**.
  3. Hard refresh.

### Caching policy summary
- Navigation: network-first with offline fallback (`/offline`).
- Static assets: stale-while-revalidate.
- Sensitive API routes (`/api/*`, including auth/session endpoints): not runtime-cached by SW.
