import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { buildConfig } from 'payload'
import { sqliteAdapter } from '@payloadcms/db-sqlite'
import { postgresAdapter } from '@payloadcms/db-postgres'
import {
  lexicalEditor,
  BoldFeature,
  ItalicFeature,
  UnderlineFeature,
  StrikethroughFeature,
  HeadingFeature,
  LinkFeature,
  OrderedListFeature,
  UnorderedListFeature,
  BlockquoteFeature,
  InlineCodeFeature,
  AlignFeature,
  IndentFeature,
  SubscriptFeature,
  SuperscriptFeature,
  HorizontalRuleFeature,
  ChecklistFeature,
  ParagraphFeature,
  FixedToolbarFeature,
} from '@payloadcms/richtext-lexical'
import { s3Storage } from '@payloadcms/storage-s3'
import sharp from 'sharp'
import { Articles, Categories, Media, Site, Users } from './cms/collections'

const dirname = path.dirname(fileURLToPath(import.meta.url))
const isPostgres = Boolean(process.env.DATABASE_URL) || process.env.GENERATE_POSTGRES_MIGRATIONS === '1'
const isMigration = process.argv.some(a => a.startsWith('migrate'))
if (!process.env.PAYLOAD_SECRET) throw new Error('PAYLOAD_SECRET is missing. Run npm run setup first.')
if (process.env.VERCEL && !isPostgres) throw new Error('Set DATABASE_URL to your Supabase connection before deploying.')
if (process.env.VERCEL && ['S3_ENDPOINT', 'S3_ACCESS_KEY_ID', 'S3_SECRET_ACCESS_KEY', 'MEDIA_PUBLIC_URL'].some(key => !process.env[key])) {
  throw new Error('Configure Supabase S3 storage and MEDIA_PUBLIC_URL before deploying; Vercel cannot persist local uploads.')
}

export default buildConfig({
  secret: process.env.PAYLOAD_SECRET,
  serverURL: process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000',
  admin: { user: 'users', theme: 'dark', meta: { titleSuffix: '— Kolkata Brand News' },
    importMap: { baseDir: dirname }, components: { providers: ['/components/admin/AdminTheme#AdminTheme'], beforeDashboard: ['/components/admin/Dashboard#Dashboard'] } },
  collections: [Users, Articles, Categories, Media], globals: [Site],
  editor: lexicalEditor({
    features: [
      ParagraphFeature(),
      HeadingFeature({ enabledHeadingSizes: ['h2', 'h3'] }),
      BoldFeature(),
      ItalicFeature(),
      UnderlineFeature(),
      StrikethroughFeature(),
      InlineCodeFeature(),
      SubscriptFeature(),
      SuperscriptFeature(),
      AlignFeature(),
      IndentFeature(),
      UnorderedListFeature(),
      OrderedListFeature(),
      ChecklistFeature(),
      BlockquoteFeature(),
      HorizontalRuleFeature(),
      LinkFeature({ enabledCollections: ['articles'] }),
      FixedToolbarFeature(),
    ],
  }),
  sharp,
  typescript: { outputFile: path.resolve(dirname, 'payload-types.ts') },
  db: isPostgres ? postgresAdapter({
    pool: { connectionString: (isMigration && process.env.DATABASE_MIGRATION_URL) || process.env.DATABASE_URL || 'postgresql://unused:unused@localhost:5432/unused', max: 3 },
    schemaName: 'payload', push: false, migrationDir: path.resolve(dirname, 'migrations'),
  }) : sqliteAdapter({ client: { url: process.env.LOCAL_DATABASE_URL || 'file:./lookback.db' }, push: true }),
  plugins: process.env.S3_ENDPOINT ? [s3Storage({
    collections: { media: { generateFileURL: ({ filename }) => `${process.env.MEDIA_PUBLIC_URL}/${encodeURIComponent(filename)}` } },
    bucket: process.env.S3_BUCKET || 'lookback-media', clientUploads: true,
    config: { endpoint: process.env.S3_ENDPOINT, region: process.env.S3_REGION || 'ap-south-1', forcePathStyle: true,
      credentials: { accessKeyId: process.env.S3_ACCESS_KEY_ID || '', secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || '' } },
  })] : [],
})
