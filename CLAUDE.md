# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Workflow rules

### Branching
- Every new feature goes in its own branch: `feature/<name>`
- Never commit directly to `main`
- Merge to `main` only after the user has tested and explicitly approved
- Always merge with `--no-ff` to preserve branch history: `git merge --no-ff feature/<name>`

### Commits
- Never commit until the solution is verified and stable by the user
- If a correction is needed before the user validates, edit the staged files and wait — do not commit
- If a premature commit was already made, use `git reset HEAD~N` to undo it before the user tests
- If a fix is needed after a commit that has not been pushed yet, squash with `git reset HEAD~N` + recommit
- Never add `Co-Authored-By` lines to commit messages

### Documentation
- After merging a feature to `main`, always update `FORK.md` (changelog + feature section) and `CLAUDE.md` if new architectural patterns were introduced

## Commands

```bash
# Run the app (requires MongoDB running and .env configured)
npm start

# Development with auto-restart
npx nodemon app.js

# Build Tailwind CSS (watches for changes)
npm run build:css

# Docker (recommended)
docker compose up -d
```

There are no automated tests (`npm test` exits with error). Verify changes manually by running the app.

## Environment Setup

Copy `.env.example` to `.env`. Required variables:
- `MONGODB_URL` — MongoDB connection string
- `PASSJWT` / `SESSION_SECRET` — JWT/session secrets (must differ)
- `DISCOGS_TOKEN` — for music search and market valuations
- `HARDCOVER_API_KEY` — for book search
- `TMDB_API_KEY` — for DVD/movie search
- `TWITCH_CLIENT_ID` / `TWITCH_CLIENT_SECRET` — for IGDB game search
- `BASE_URL` — optional sub-path prefix (e.g. `/dvinyl`); leave empty to serve from root
- `PROD=true` — only for HTTPS deployments (affects secure cookies)

On first run with no users in the DB, the app redirects all requests to `/setup`.

## Architecture

**Stack:** Node.js + Express 5 / MongoDB (Mongoose) / EJS templates / Tailwind CSS / Socket.io

**Entry point:** [app.js](app.js) — sets up i18n, middleware chain, route mounting, MongoDB connection, and HTTP server with Socket.io.

### Data model — Mongoose Discriminator pattern

All collection items (music, books, DVDs, games) share a single MongoDB collection (`albums`) via a Mongoose discriminator. The `kind` field distinguishes types:

- [models/Item.js](models/Item.js) — base schema (`kind` discriminator key, shared fields: `title`, `year`, `cover_image`, `owner`, `in_wishlist`, `quantity`, `barcode`, `genres`, `styles`, etc.)
- [models/Vinyl.js](models/Vinyl.js) — discriminator `kind: 'Music'` (adds `artist`, `media_type` enum: `vinyl|cd|cassette`, `discogs_id`, `tracklist`, `is_bootleg`, etc.)
- [models/Book.js](models/Book.js) — discriminator `kind: 'Book'`
- [models/Dvd.js](models/Dvd.js) — discriminator `kind: 'Dvd'`
- [models/Game.js](models/Game.js) — discriminator `kind: 'Game'`

Always query/create through `Item` for cross-type queries, or through the specific model (`Vinyl`, `Book`, etc.) when inserting type-specific records.

### Authentication & authorization

JWT stored in a cookie (`jwt`). Two middleware functions in [middleware/authMiddleware.js](middleware/authMiddleware.js):
- `checkUser` — runs on every request; populates `res.locals.user` and `req.user` (null if unauthenticated). Applied globally in `app.js`.
- `requireAuth` — protects routes; redirects to `/login` if no valid JWT.
- `requireAdmin` — further restricts to `user.isAdmin === true`.

The app is single-admin: all collection items belong to the one admin user. Non-admin users can view (with visibility filters) but cannot add/edit/delete.

### Settings & visibility

[middleware/settingsMiddleware.js](middleware/settingsMiddleware.js) runs on every request: loads the singleton `Settings` document and populates `res.locals.settings`. Settings control:
- Which modules are enabled (`music`, `books`, `dvd`, `games`, `advancedCD`)
- Navbar shortcuts and dashboard stat widgets
- Per-section themes (from [config/themes.js](config/themes.js))
- Visibility filters: hidden items/genres/types (see [utils/visibilityHelper.js](utils/visibilityHelper.js))
- Fork-specific flags: `jackSparrowMode` (enable bootleg marking), `jackSparrowHideFromPublic` (hide bootlegs from non-admin visitors)

Disabled modules return a 404 for their routes.

### BASE_URL / sub-path deployment

`BASE_URL` (from [config/constants.js](config/constants.js)) is prefixed on all routes and static assets. `res.redirect` is monkey-patched in `app.js` to auto-prepend `BASE_URL`. Always import `BASE_URL` from `config/constants` when constructing paths in routes.

### Route structure

Routes are mounted in `app.js`:
- `albumRoutes` — music collection (vinyl/CD/cassette), Discogs search/import, market estimates
- `bookRoutes` — books via Hardcover API
- `dvdRoutes` — DVDs/Blu-ray via TMDB API
- `gameRoutes` — games via IGDB (Twitch auth)
- `adminRoutes` — admin panel, user management, IP blocking
- `settingsRoutes` — app configuration, theme, module toggles, visibility
- `backupRoutes` — JSON export/import of the full collection
- `authRoutes` — login/logout
- `setupRoutes` — first-run setup wizard

### Collection query pattern (`albumRoutes.js`)

Filters in the music collection route are built using a `conditions` array. All active filters (genre, artist, bootleg, etc.) are pushed as individual objects into `conditions`. At the end, `filterMode` determines how they're applied:

- `show` (default): `query.$and = conditions` — items must match all conditions
- `hide`: `query.$and = [{ $nor: [{ $and: conditions }] }]` — items must NOT match all conditions combined

This means any new filter must be pushed into `conditions` **before** the filterMode block, never set directly on `query`, or the eye-icon inversion won't work.

### Manual vinyl entry

`GET /add-vinyl/manual` renders `confirm-vinyl.ejs` with an empty `vinyl` object and `isManual: true`. The cover panel opens by default and an info banner indicates Discogs features are unavailable. Saves via the existing `POST /save-vinyl` without `discogs_id`.

### Tracklist editor

`views/partials/tracklist-editor.ejs` — self-contained component included in both `confirm-vinyl.ejs` and `edit-vinyl.ejs`. Manages its own `<input name="tracklist_json">` hidden field. Duration fields are normalized on blur (`"5"` → `"5:00"`, invalid text → cleared). Total album duration is calculated from the tracklist directly in `vinyl-detail.ejs` and shown as a pill.

### Real-time imports

Discogs and Musik-Sammler CSV imports run asynchronously after returning a `202` response. Progress is pushed to the frontend via Socket.io events: `import_progress`, `import_finished`, `import_error`. Socket.io is initialized in `app.js` and exposed to routes via `req.io = io`.

### Localization

i18next with 5 languages: `fr` (fallback), `en`, `es`, `it`, `de`. Translation files are in [locales/](locales/). Detection order: querystring → cookie → Accept-Language header. The user's saved `language` preference overrides detection. Use `req.t('key')` in routes and `t('key')` in EJS views.

### Tailwind CSS

Source at `website/src/input.css` (referenced in `package.json`'s `build:css` script), output to `public/styles/tailwind.css`. Run `npm run build:css` after modifying styles. The `public/` folder is served as static at `BASE_URL`.
