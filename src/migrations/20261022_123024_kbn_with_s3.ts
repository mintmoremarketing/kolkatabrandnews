import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "payload"."site" ALTER COLUMN "title" SET DEFAULT 'KOLKATA BRAND NEWS';
  ALTER TABLE "payload"."site" ALTER COLUMN "about_title" SET DEFAULT 'KOLKATA
  BRAND
  NEWS';
  ALTER TABLE "payload"."media" ADD COLUMN "_objectkey" varchar;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "payload"."site" ALTER COLUMN "title" SET DEFAULT 'THE LOOKBACK';
  ALTER TABLE "payload"."site" ALTER COLUMN "about_title" SET DEFAULT '“THE LOOKBACK”
  (TLB/2026)
  YOUR LIVING
  ARCHIVE OF
  BETTER OFF®';
  ALTER TABLE "payload"."media" DROP COLUMN "_objectkey";`)
}
