# Verification — 16 October 2026

- `npm test`: 4 tests passed (chronology/gallery relationships, cyclic positions, frame-independent damping, external URL validation).
- `npm run test:cms`: passed against an isolated in-memory SQLite database. Covers administrator bootstrap, anonymous write rejection, editor role restrictions, media upload processing, private drafts, publishing, published/draft isolation, revision restore, and unpublishing.
- `npm run build`: passed compilation, TypeScript, page generation, and route optimization.
- Local HTTP checks: 10 published articles / 27 gallery cards; anonymous user listing returns 403; unauthenticated draft preview redirects to CMS login; admin route responds successfully.
- Browser checks: desktop Timeline at 1440×900; responsive layout at 640×844; drag and wheel navigation; keyboard Home/Arrow navigation; Surf; Index; article opening, next article, close back to Index; About video/layout; first-administrator setup screen. No application runtime errors were reported during these checks.

Supabase Postgres migrations, S3 uploads, and Vercel deployment still require the project's credentials and a live deployment check. Local operation uses SQLite and local uploads. No administrator account or default password has been installed in the sample archive.

Two disposable databases from an earlier file-based test remain in ignored `.data/` because automatic approval review blocked cleanup. Current CMS tests use memory and do not create these files.
