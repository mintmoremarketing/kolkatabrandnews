# The Lookback

A recreation of the Timeline, Surf, Index, About, and article experience, with a Payload editorial CMS. Includes **10 sample articles / 27 gallery cards**. Reference imagery and typography are local assets; article copy is concise demo text intended to be replaced.

## Local development

Requires Node.js 22 or newer.

```sh
npm install
npm run setup
npm run generate:importmap
npm run seed
npm run dev
```

Visit `http://localhost:3000` for the archive and `http://localhost:3000/admin` to create the first administrator. No shared/default password is installed. Local development uses SQLite (`lookback.db`) and the ignored `media/` directory. The random CMS secret is generated in the ignored `.env` file.

`npm run seed` is repeatable: it adds missing sample articles and does not overwrite edits. To remove samples, unpublish or delete them in the CMS; do not rerun the seed afterward if you want them to remain deleted.

## Editing

- **Articles:** title, slug, category, archive date, source URL, description, gallery cards, and editorial body blocks. Drag gallery rows to change their order. Each image creates a card in Timeline, Surf, and Index, all pointing to the same article.
- **Drafts:** save without publishing, open Preview, compare desktop/mobile, restore an earlier version, publish, or unpublish. Preview requires an authenticated CMS session.
- **Media:** upload images, animated images, MP4/WebM video, or audio. Add useful alt text and optional captions. Avoid deleting media that published articles still use.
- **Site & About:** edit masthead identity, About text/video, credits, contact details, and playlist.
- **Users:** administrators manage settings and accounts. Editors manage articles and media.

The archive uses dates in UTC, ordered newest first. `order` resolves stories sharing a date. Article body blocks support rich text, media, media pairs, and YouTube/Vimeo embeds. New requests read published content without a rebuild. Returning focus to an open archive refreshes its content while preserving gallery position. CMS live preview refreshes after draft saves and autosaves.

## Vercel + Supabase

1. Create a Supabase project and a Storage bucket named `lookback-media`. Make this **public media bucket** readable publicly; drafts themselves remain private, but uploaded assets must not contain private information.
2. Generate S3 access credentials in Supabase. Set the server-only environment variables from `.env.example`: `DATABASE_URL`, `DATABASE_MIGRATION_URL`, `S3_ENDPOINT`, `S3_REGION`, `S3_BUCKET`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, `MEDIA_PUBLIC_URL`, and a strong `PAYLOAD_SECRET`.
3. Use the Supabase transaction pooler for `DATABASE_URL`; use a direct/session connection for `DATABASE_MIGRATION_URL`. Payload uses the `payload` schema, which must not be included among schemas exposed by the Supabase public Data API.
4. Apply committed Postgres migrations with `npm run migrate` before deploying. Run `npm run seed` against the configured Supabase database to import the ten samples and upload media to Storage. Do not run the seeder during every build.
5. Create the first administrator privately before exposing production: set `SEED_ADMIN_EMAIL` and `SEED_ADMIN_PASSWORD` for the one-time seed, then remove those variables. Alternatively, create the first account on a protected Vercel preview deployment.
6. Import this directory as a Vercel Next.js project. Set its Root Directory to this folder if deploying the parent monorepo. Build command: `npm run build`. Node runtime: 22 or newer. Set `NEXT_PUBLIC_SERVER_URL` to the deployment origin.
7. Configure storage CORS to permit the production and preview origins for signed direct uploads. Validate uploads, previews, and publishing on the deployment before connecting the final domain.

Local SQLite is never used on Vercel; the app fails explicitly if a Vercel deployment lacks `DATABASE_URL`. Keep Supabase service credentials out of browser code. Configure a Payload email adapter before relying on automated password-reset email; without one, recovery requires an administrator.

## Verification

```sh
npm run typecheck
npm test
npm run test:cms
npm run build
```

Test wheel/trackpad scrolling, touch dragging, ruler scrubbing, keyboard arrow/Home/End navigation, view changes, article close/back/forward, and reduced motion. Inspect desktop at 1440×900, tablet, and mobile at 390×844. Check draft visibility, role restrictions, and media persistence after a production redeploy.

## Reference assets

`scripts/import-reference.mjs` reproduces the bounded reference import. Provenance is recorded in `public/reference/source-manifest.json`. The source is [The Lookback](https://tlb.betteroff.studio/), designed by Gil Huybrecht and developed by Jesper Landberg. Replace the sample articles, imagery, soundtrack, and branding through the CMS when adding your own content.
