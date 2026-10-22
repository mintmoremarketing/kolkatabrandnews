import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE SCHEMA IF NOT EXISTS "payload";
   CREATE TYPE "payload"."enum_users_role" AS ENUM('admin', 'editor');
  CREATE TYPE "payload"."enum_articles_status" AS ENUM('draft', 'published');
  CREATE TYPE "payload"."enum__articles_v_version_status" AS ENUM('draft', 'published');
  CREATE TABLE "payload"."users_sessions" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"created_at" timestamp(3) with time zone,
  	"expires_at" timestamp(3) with time zone NOT NULL
  );
  
  CREATE TABLE "payload"."users" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"role" "payload"."enum_users_role" DEFAULT 'editor' NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"email" varchar NOT NULL,
  	"reset_password_token" varchar,
  	"reset_password_expiration" timestamp(3) with time zone,
  	"salt" varchar,
  	"hash" varchar,
  	"reset_password_requested_at" timestamp(3) with time zone,
  	"login_attempts" numeric DEFAULT 0,
  	"lock_until" timestamp(3) with time zone
  );
  
  CREATE TABLE "payload"."articles_gallery" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"media_id" integer,
  	"caption" varchar
  );
  
  CREATE TABLE "payload"."articles_blocks_text" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"content" jsonb,
  	"block_name" varchar
  );
  
  CREATE TABLE "payload"."articles_blocks_image" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"media_id" integer,
  	"caption" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "payload"."articles_blocks_pair" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"left_id" integer,
  	"right_id" integer,
  	"caption" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "payload"."articles_blocks_embed" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"url" varchar,
  	"title" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "payload"."articles" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"slug" varchar,
  	"category_id" integer,
  	"archive_date" timestamp(3) with time zone,
  	"order" numeric DEFAULT 0,
  	"source_url" varchar,
  	"description" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "payload"."enum_articles_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "payload"."_articles_v_version_gallery" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"media_id" integer,
  	"caption" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "payload"."_articles_v_blocks_text" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"content" jsonb,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "payload"."_articles_v_blocks_image" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"media_id" integer,
  	"caption" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "payload"."_articles_v_blocks_pair" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"left_id" integer,
  	"right_id" integer,
  	"caption" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "payload"."_articles_v_blocks_embed" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"url" varchar,
  	"title" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "payload"."_articles_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_title" varchar,
  	"version_slug" varchar,
  	"version_category_id" integer,
  	"version_archive_date" timestamp(3) with time zone,
  	"version_order" numeric DEFAULT 0,
  	"version_source_url" varchar,
  	"version_description" varchar,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "payload"."enum__articles_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean,
  	"autosave" boolean
  );
  
  CREATE TABLE "payload"."categories" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"slug" varchar NOT NULL,
  	"color" varchar DEFAULT '#eee2f7',
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload"."media" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"alt" varchar NOT NULL,
  	"caption" varchar,
  	"source_url" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"url" varchar,
  	"thumbnail_u_r_l" varchar,
  	"filename" varchar,
  	"mime_type" varchar,
  	"filesize" numeric,
  	"width" numeric,
  	"height" numeric,
  	"focal_x" numeric,
  	"focal_y" numeric,
  	"sizes_thumbnail_url" varchar,
  	"sizes_thumbnail_width" numeric,
  	"sizes_thumbnail_height" numeric,
  	"sizes_thumbnail_mime_type" varchar,
  	"sizes_thumbnail_filesize" numeric,
  	"sizes_thumbnail_filename" varchar,
  	"sizes_card_url" varchar,
  	"sizes_card_width" numeric,
  	"sizes_card_height" numeric,
  	"sizes_card_mime_type" varchar,
  	"sizes_card_filesize" numeric,
  	"sizes_card_filename" varchar,
  	"sizes_large_url" varchar,
  	"sizes_large_width" numeric,
  	"sizes_large_height" numeric,
  	"sizes_large_mime_type" varchar,
  	"sizes_large_filesize" numeric,
  	"sizes_large_filename" varchar
  );
  
  CREATE TABLE "payload"."payload_kv" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar NOT NULL,
  	"data" jsonb NOT NULL
  );
  
  CREATE TABLE "payload"."payload_locked_documents" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"global_slug" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload"."payload_locked_documents_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"users_id" integer,
  	"articles_id" integer,
  	"categories_id" integer,
  	"media_id" integer
  );
  
  CREATE TABLE "payload"."payload_preferences" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar,
  	"value" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload"."payload_preferences_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"users_id" integer
  );
  
  CREATE TABLE "payload"."payload_migrations" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"batch" numeric,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload"."site_credits" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar NOT NULL,
  	"name" varchar NOT NULL,
  	"url" varchar
  );
  
  CREATE TABLE "payload"."site_playlist" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"artist" varchar NOT NULL,
  	"audio_id" integer NOT NULL,
  	"artwork_id" integer
  );
  
  CREATE TABLE "payload"."site" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"brand" varchar DEFAULT 'Better Off®' NOT NULL,
  	"title" varchar DEFAULT 'THE LOOKBACK' NOT NULL,
  	"abbreviation" varchar DEFAULT 'BO®S' NOT NULL,
  	"year" varchar DEFAULT '2026' NOT NULL,
  	"contact_email" varchar DEFAULT 'hello@betteroff.studio',
  	"studio_url" varchar,
  	"about_title" varchar DEFAULT '“THE LOOKBACK”
  (TLB/2026)
  YOUR LIVING
  ARCHIVE OF
  BETTER OFF®',
  	"about_intro" varchar,
  	"about_text" varchar,
  	"about_video_id" integer,
  	"thanks" varchar,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  ALTER TABLE "payload"."users_sessions" ADD CONSTRAINT "users_sessions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."articles_gallery" ADD CONSTRAINT "articles_gallery_media_id_media_id_fk" FOREIGN KEY ("media_id") REFERENCES "payload"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."articles_gallery" ADD CONSTRAINT "articles_gallery_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."articles"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."articles_blocks_text" ADD CONSTRAINT "articles_blocks_text_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."articles"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."articles_blocks_image" ADD CONSTRAINT "articles_blocks_image_media_id_media_id_fk" FOREIGN KEY ("media_id") REFERENCES "payload"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."articles_blocks_image" ADD CONSTRAINT "articles_blocks_image_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."articles"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."articles_blocks_pair" ADD CONSTRAINT "articles_blocks_pair_left_id_media_id_fk" FOREIGN KEY ("left_id") REFERENCES "payload"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."articles_blocks_pair" ADD CONSTRAINT "articles_blocks_pair_right_id_media_id_fk" FOREIGN KEY ("right_id") REFERENCES "payload"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."articles_blocks_pair" ADD CONSTRAINT "articles_blocks_pair_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."articles"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."articles_blocks_embed" ADD CONSTRAINT "articles_blocks_embed_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."articles"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."articles" ADD CONSTRAINT "articles_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "payload"."categories"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."_articles_v_version_gallery" ADD CONSTRAINT "_articles_v_version_gallery_media_id_media_id_fk" FOREIGN KEY ("media_id") REFERENCES "payload"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."_articles_v_version_gallery" ADD CONSTRAINT "_articles_v_version_gallery_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."_articles_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."_articles_v_blocks_text" ADD CONSTRAINT "_articles_v_blocks_text_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."_articles_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."_articles_v_blocks_image" ADD CONSTRAINT "_articles_v_blocks_image_media_id_media_id_fk" FOREIGN KEY ("media_id") REFERENCES "payload"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."_articles_v_blocks_image" ADD CONSTRAINT "_articles_v_blocks_image_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."_articles_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."_articles_v_blocks_pair" ADD CONSTRAINT "_articles_v_blocks_pair_left_id_media_id_fk" FOREIGN KEY ("left_id") REFERENCES "payload"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."_articles_v_blocks_pair" ADD CONSTRAINT "_articles_v_blocks_pair_right_id_media_id_fk" FOREIGN KEY ("right_id") REFERENCES "payload"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."_articles_v_blocks_pair" ADD CONSTRAINT "_articles_v_blocks_pair_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."_articles_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."_articles_v_blocks_embed" ADD CONSTRAINT "_articles_v_blocks_embed_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."_articles_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."_articles_v" ADD CONSTRAINT "_articles_v_parent_id_articles_id_fk" FOREIGN KEY ("parent_id") REFERENCES "payload"."articles"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."_articles_v" ADD CONSTRAINT "_articles_v_version_category_id_categories_id_fk" FOREIGN KEY ("version_category_id") REFERENCES "payload"."categories"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "payload"."payload_locked_documents"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "payload"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_articles_fk" FOREIGN KEY ("articles_id") REFERENCES "payload"."articles"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_categories_fk" FOREIGN KEY ("categories_id") REFERENCES "payload"."categories"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "payload"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "payload"."payload_preferences"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "payload"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."site_credits" ADD CONSTRAINT "site_credits_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."site"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."site_playlist" ADD CONSTRAINT "site_playlist_audio_id_media_id_fk" FOREIGN KEY ("audio_id") REFERENCES "payload"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."site_playlist" ADD CONSTRAINT "site_playlist_artwork_id_media_id_fk" FOREIGN KEY ("artwork_id") REFERENCES "payload"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."site_playlist" ADD CONSTRAINT "site_playlist_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."site"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."site" ADD CONSTRAINT "site_about_video_id_media_id_fk" FOREIGN KEY ("about_video_id") REFERENCES "payload"."media"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "users_sessions_order_idx" ON "payload"."users_sessions" USING btree ("_order");
  CREATE INDEX "users_sessions_parent_id_idx" ON "payload"."users_sessions" USING btree ("_parent_id");
  CREATE INDEX "users_updated_at_idx" ON "payload"."users" USING btree ("updated_at");
  CREATE INDEX "users_created_at_idx" ON "payload"."users" USING btree ("created_at");
  CREATE UNIQUE INDEX "users_email_idx" ON "payload"."users" USING btree ("email");
  CREATE INDEX "articles_gallery_order_idx" ON "payload"."articles_gallery" USING btree ("_order");
  CREATE INDEX "articles_gallery_parent_id_idx" ON "payload"."articles_gallery" USING btree ("_parent_id");
  CREATE INDEX "articles_gallery_media_idx" ON "payload"."articles_gallery" USING btree ("media_id");
  CREATE INDEX "articles_blocks_text_order_idx" ON "payload"."articles_blocks_text" USING btree ("_order");
  CREATE INDEX "articles_blocks_text_parent_id_idx" ON "payload"."articles_blocks_text" USING btree ("_parent_id");
  CREATE INDEX "articles_blocks_text_path_idx" ON "payload"."articles_blocks_text" USING btree ("_path");
  CREATE INDEX "articles_blocks_image_order_idx" ON "payload"."articles_blocks_image" USING btree ("_order");
  CREATE INDEX "articles_blocks_image_parent_id_idx" ON "payload"."articles_blocks_image" USING btree ("_parent_id");
  CREATE INDEX "articles_blocks_image_path_idx" ON "payload"."articles_blocks_image" USING btree ("_path");
  CREATE INDEX "articles_blocks_image_media_idx" ON "payload"."articles_blocks_image" USING btree ("media_id");
  CREATE INDEX "articles_blocks_pair_order_idx" ON "payload"."articles_blocks_pair" USING btree ("_order");
  CREATE INDEX "articles_blocks_pair_parent_id_idx" ON "payload"."articles_blocks_pair" USING btree ("_parent_id");
  CREATE INDEX "articles_blocks_pair_path_idx" ON "payload"."articles_blocks_pair" USING btree ("_path");
  CREATE INDEX "articles_blocks_pair_left_idx" ON "payload"."articles_blocks_pair" USING btree ("left_id");
  CREATE INDEX "articles_blocks_pair_right_idx" ON "payload"."articles_blocks_pair" USING btree ("right_id");
  CREATE INDEX "articles_blocks_embed_order_idx" ON "payload"."articles_blocks_embed" USING btree ("_order");
  CREATE INDEX "articles_blocks_embed_parent_id_idx" ON "payload"."articles_blocks_embed" USING btree ("_parent_id");
  CREATE INDEX "articles_blocks_embed_path_idx" ON "payload"."articles_blocks_embed" USING btree ("_path");
  CREATE UNIQUE INDEX "articles_slug_idx" ON "payload"."articles" USING btree ("slug");
  CREATE INDEX "articles_category_idx" ON "payload"."articles" USING btree ("category_id");
  CREATE INDEX "articles_updated_at_idx" ON "payload"."articles" USING btree ("updated_at");
  CREATE INDEX "articles_created_at_idx" ON "payload"."articles" USING btree ("created_at");
  CREATE INDEX "articles__status_idx" ON "payload"."articles" USING btree ("_status");
  CREATE INDEX "_articles_v_version_gallery_order_idx" ON "payload"."_articles_v_version_gallery" USING btree ("_order");
  CREATE INDEX "_articles_v_version_gallery_parent_id_idx" ON "payload"."_articles_v_version_gallery" USING btree ("_parent_id");
  CREATE INDEX "_articles_v_version_gallery_media_idx" ON "payload"."_articles_v_version_gallery" USING btree ("media_id");
  CREATE INDEX "_articles_v_blocks_text_order_idx" ON "payload"."_articles_v_blocks_text" USING btree ("_order");
  CREATE INDEX "_articles_v_blocks_text_parent_id_idx" ON "payload"."_articles_v_blocks_text" USING btree ("_parent_id");
  CREATE INDEX "_articles_v_blocks_text_path_idx" ON "payload"."_articles_v_blocks_text" USING btree ("_path");
  CREATE INDEX "_articles_v_blocks_image_order_idx" ON "payload"."_articles_v_blocks_image" USING btree ("_order");
  CREATE INDEX "_articles_v_blocks_image_parent_id_idx" ON "payload"."_articles_v_blocks_image" USING btree ("_parent_id");
  CREATE INDEX "_articles_v_blocks_image_path_idx" ON "payload"."_articles_v_blocks_image" USING btree ("_path");
  CREATE INDEX "_articles_v_blocks_image_media_idx" ON "payload"."_articles_v_blocks_image" USING btree ("media_id");
  CREATE INDEX "_articles_v_blocks_pair_order_idx" ON "payload"."_articles_v_blocks_pair" USING btree ("_order");
  CREATE INDEX "_articles_v_blocks_pair_parent_id_idx" ON "payload"."_articles_v_blocks_pair" USING btree ("_parent_id");
  CREATE INDEX "_articles_v_blocks_pair_path_idx" ON "payload"."_articles_v_blocks_pair" USING btree ("_path");
  CREATE INDEX "_articles_v_blocks_pair_left_idx" ON "payload"."_articles_v_blocks_pair" USING btree ("left_id");
  CREATE INDEX "_articles_v_blocks_pair_right_idx" ON "payload"."_articles_v_blocks_pair" USING btree ("right_id");
  CREATE INDEX "_articles_v_blocks_embed_order_idx" ON "payload"."_articles_v_blocks_embed" USING btree ("_order");
  CREATE INDEX "_articles_v_blocks_embed_parent_id_idx" ON "payload"."_articles_v_blocks_embed" USING btree ("_parent_id");
  CREATE INDEX "_articles_v_blocks_embed_path_idx" ON "payload"."_articles_v_blocks_embed" USING btree ("_path");
  CREATE INDEX "_articles_v_parent_idx" ON "payload"."_articles_v" USING btree ("parent_id");
  CREATE INDEX "_articles_v_version_version_slug_idx" ON "payload"."_articles_v" USING btree ("version_slug");
  CREATE INDEX "_articles_v_version_version_category_idx" ON "payload"."_articles_v" USING btree ("version_category_id");
  CREATE INDEX "_articles_v_version_version_updated_at_idx" ON "payload"."_articles_v" USING btree ("version_updated_at");
  CREATE INDEX "_articles_v_version_version_created_at_idx" ON "payload"."_articles_v" USING btree ("version_created_at");
  CREATE INDEX "_articles_v_version_version__status_idx" ON "payload"."_articles_v" USING btree ("version__status");
  CREATE INDEX "_articles_v_created_at_idx" ON "payload"."_articles_v" USING btree ("created_at");
  CREATE INDEX "_articles_v_updated_at_idx" ON "payload"."_articles_v" USING btree ("updated_at");
  CREATE INDEX "_articles_v_latest_idx" ON "payload"."_articles_v" USING btree ("latest");
  CREATE INDEX "_articles_v_autosave_idx" ON "payload"."_articles_v" USING btree ("autosave");
  CREATE UNIQUE INDEX "categories_slug_idx" ON "payload"."categories" USING btree ("slug");
  CREATE INDEX "categories_updated_at_idx" ON "payload"."categories" USING btree ("updated_at");
  CREATE INDEX "categories_created_at_idx" ON "payload"."categories" USING btree ("created_at");
  CREATE INDEX "media_updated_at_idx" ON "payload"."media" USING btree ("updated_at");
  CREATE INDEX "media_created_at_idx" ON "payload"."media" USING btree ("created_at");
  CREATE UNIQUE INDEX "media_filename_idx" ON "payload"."media" USING btree ("filename");
  CREATE INDEX "media_sizes_thumbnail_sizes_thumbnail_filename_idx" ON "payload"."media" USING btree ("sizes_thumbnail_filename");
  CREATE INDEX "media_sizes_card_sizes_card_filename_idx" ON "payload"."media" USING btree ("sizes_card_filename");
  CREATE INDEX "media_sizes_large_sizes_large_filename_idx" ON "payload"."media" USING btree ("sizes_large_filename");
  CREATE UNIQUE INDEX "payload_kv_key_idx" ON "payload"."payload_kv" USING btree ("key");
  CREATE INDEX "payload_locked_documents_global_slug_idx" ON "payload"."payload_locked_documents" USING btree ("global_slug");
  CREATE INDEX "payload_locked_documents_updated_at_idx" ON "payload"."payload_locked_documents" USING btree ("updated_at");
  CREATE INDEX "payload_locked_documents_created_at_idx" ON "payload"."payload_locked_documents" USING btree ("created_at");
  CREATE INDEX "payload_locked_documents_rels_order_idx" ON "payload"."payload_locked_documents_rels" USING btree ("order");
  CREATE INDEX "payload_locked_documents_rels_parent_idx" ON "payload"."payload_locked_documents_rels" USING btree ("parent_id");
  CREATE INDEX "payload_locked_documents_rels_path_idx" ON "payload"."payload_locked_documents_rels" USING btree ("path");
  CREATE INDEX "payload_locked_documents_rels_users_id_idx" ON "payload"."payload_locked_documents_rels" USING btree ("users_id");
  CREATE INDEX "payload_locked_documents_rels_articles_id_idx" ON "payload"."payload_locked_documents_rels" USING btree ("articles_id");
  CREATE INDEX "payload_locked_documents_rels_categories_id_idx" ON "payload"."payload_locked_documents_rels" USING btree ("categories_id");
  CREATE INDEX "payload_locked_documents_rels_media_id_idx" ON "payload"."payload_locked_documents_rels" USING btree ("media_id");
  CREATE INDEX "payload_preferences_key_idx" ON "payload"."payload_preferences" USING btree ("key");
  CREATE INDEX "payload_preferences_updated_at_idx" ON "payload"."payload_preferences" USING btree ("updated_at");
  CREATE INDEX "payload_preferences_created_at_idx" ON "payload"."payload_preferences" USING btree ("created_at");
  CREATE INDEX "payload_preferences_rels_order_idx" ON "payload"."payload_preferences_rels" USING btree ("order");
  CREATE INDEX "payload_preferences_rels_parent_idx" ON "payload"."payload_preferences_rels" USING btree ("parent_id");
  CREATE INDEX "payload_preferences_rels_path_idx" ON "payload"."payload_preferences_rels" USING btree ("path");
  CREATE INDEX "payload_preferences_rels_users_id_idx" ON "payload"."payload_preferences_rels" USING btree ("users_id");
  CREATE INDEX "payload_migrations_updated_at_idx" ON "payload"."payload_migrations" USING btree ("updated_at");
  CREATE INDEX "payload_migrations_created_at_idx" ON "payload"."payload_migrations" USING btree ("created_at");
  CREATE INDEX "site_credits_order_idx" ON "payload"."site_credits" USING btree ("_order");
  CREATE INDEX "site_credits_parent_id_idx" ON "payload"."site_credits" USING btree ("_parent_id");
  CREATE INDEX "site_playlist_order_idx" ON "payload"."site_playlist" USING btree ("_order");
  CREATE INDEX "site_playlist_parent_id_idx" ON "payload"."site_playlist" USING btree ("_parent_id");
  CREATE INDEX "site_playlist_audio_idx" ON "payload"."site_playlist" USING btree ("audio_id");
  CREATE INDEX "site_playlist_artwork_idx" ON "payload"."site_playlist" USING btree ("artwork_id");
  CREATE INDEX "site_about_video_idx" ON "payload"."site" USING btree ("about_video_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "payload"."users_sessions" CASCADE;
  DROP TABLE "payload"."users" CASCADE;
  DROP TABLE "payload"."articles_gallery" CASCADE;
  DROP TABLE "payload"."articles_blocks_text" CASCADE;
  DROP TABLE "payload"."articles_blocks_image" CASCADE;
  DROP TABLE "payload"."articles_blocks_pair" CASCADE;
  DROP TABLE "payload"."articles_blocks_embed" CASCADE;
  DROP TABLE "payload"."articles" CASCADE;
  DROP TABLE "payload"."_articles_v_version_gallery" CASCADE;
  DROP TABLE "payload"."_articles_v_blocks_text" CASCADE;
  DROP TABLE "payload"."_articles_v_blocks_image" CASCADE;
  DROP TABLE "payload"."_articles_v_blocks_pair" CASCADE;
  DROP TABLE "payload"."_articles_v_blocks_embed" CASCADE;
  DROP TABLE "payload"."_articles_v" CASCADE;
  DROP TABLE "payload"."categories" CASCADE;
  DROP TABLE "payload"."media" CASCADE;
  DROP TABLE "payload"."payload_kv" CASCADE;
  DROP TABLE "payload"."payload_locked_documents" CASCADE;
  DROP TABLE "payload"."payload_locked_documents_rels" CASCADE;
  DROP TABLE "payload"."payload_preferences" CASCADE;
  DROP TABLE "payload"."payload_preferences_rels" CASCADE;
  DROP TABLE "payload"."payload_migrations" CASCADE;
  DROP TABLE "payload"."site_credits" CASCADE;
  DROP TABLE "payload"."site_playlist" CASCADE;
  DROP TABLE "payload"."site" CASCADE;
  DROP TYPE "payload"."enum_users_role";
  DROP TYPE "payload"."enum_articles_status";
  DROP TYPE "payload"."enum__articles_v_version_status";`)
}
