-- KITAMALUT APP STORE -- RANCANGAN DATABASE POSTGRESQL (BELUM DIJALANKAN)
-- Jalankan hanya setelah review dan setelah lingkungan DEMO dibuat.
-- Tidak mengimplementasikan login / pekerjaan background / scanning dengan sendirinya.
BEGIN;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS admin_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username varchar(60) NOT NULL UNIQUE,
  password_hash text NOT NULL, -- Argon2id hash dari server; JANGAN pernah menyimpan plaintext
  role varchar(12) NOT NULL CHECK (role IN ('owner','admin')),
  is_active boolean NOT NULL DEFAULT true,
  mfa_enabled boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
-- Endpoint pendaftaran admin PUBLIK tidak boleh ada; provisioning owner manual.

CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug varchar(80) NOT NULL UNIQUE,
  name varchar(90) NOT NULL UNIQUE,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS apps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug varchar(120) NOT NULL UNIQUE,
  package_id varchar(180) NOT NULL UNIQUE,
  name varchar(120) NOT NULL,
  developer_name varchar(120) NOT NULL,
  category_id uuid REFERENCES categories(id),
  short_description varchar(200) NOT NULL,
  full_description text NOT NULL,
  app_type varchar(12) NOT NULL DEFAULT 'android' CHECK (app_type IN ('android','web')),
  website_url text,
  icon_object_key text,
  featured boolean NOT NULL DEFAULT false,
  is_listed boolean NOT NULL DEFAULT false,
  owner_id uuid NOT NULL REFERENCES admin_users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (app_type <> 'web' OR website_url IS NOT NULL)
);

CREATE TABLE IF NOT EXISTS releases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  app_id uuid NOT NULL REFERENCES apps(id) ON DELETE RESTRICT,
  version_name varchar(50) NOT NULL,
  version_code bigint NOT NULL CHECK (version_code > 0),
  min_sdk integer,
  target_sdk integer,
  file_size_bytes bigint CHECK (file_size_bytes IS NULL OR file_size_bytes > 0),
  original_filename text,
  -- Object key bukan URL, tidak diekspos ke pengunjung tanpa otorisasi
  quarantined_object_key text,
  public_object_key text,
  sha256 char(64),
  signer_sha256 char(64),
  package_id_verified varchar(180),
  scan_status varchar(16) NOT NULL DEFAULT 'not_started'
    CHECK (scan_status IN ('not_started','queued','scanning','passed','failed','error')),
  workflow_status varchar(20) NOT NULL DEFAULT 'draft'
    CHECK (workflow_status IN ('draft','quarantine','in_review','ready','published','withdrawn','rejected')),
  scanner_details jsonb NOT NULL DEFAULT '{}'::jsonb,
  changelog text,
  submitted_by uuid NOT NULL REFERENCES admin_users(id),
  approved_by uuid REFERENCES admin_users(id),
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(app_id, version_code),
  CHECK (sha256 IS NULL OR sha256 ~ '^[0-9a-f]{64}$'),
  CHECK (signer_sha256 IS NULL OR signer_sha256 ~ '^[0-9a-f]{64}$')
);
CREATE UNIQUE INDEX IF NOT EXISTS one_published_version_per_app
  ON releases(app_id) WHERE workflow_status='published';
CREATE INDEX IF NOT EXISTS releases_app_idx ON releases(app_id, created_at DESC);

CREATE TABLE IF NOT EXISTS app_media (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  app_id uuid NOT NULL REFERENCES apps(id) ON DELETE CASCADE,
  media_type varchar(12) NOT NULL CHECK(media_type IN('icon','screenshot','banner','video')),
  object_key text,
  external_url text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK ((object_key IS NOT NULL) <> (external_url IS NOT NULL))
);

CREATE TABLE IF NOT EXISTS upload_intents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  release_id uuid NOT NULL REFERENCES releases(id) ON DELETE CASCADE,
  requested_by uuid NOT NULL REFERENCES admin_users(id),
  object_key text NOT NULL UNIQUE,
  expected_content_length bigint NOT NULL CHECK(expected_content_length BETWEEN 1 AND 262144000),
  state varchar(16) NOT NULL DEFAULT 'issued'
    CHECK(state IN ('issued','uploaded','expired','rejected')),
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS download_events (
  id bigserial PRIMARY KEY,
  app_id uuid NOT NULL REFERENCES apps(id),
  release_id uuid NOT NULL REFERENCES releases(id),
  event_type varchar(20) NOT NULL CHECK(event_type IN('link_issued','download_started','download_completed')),
  -- Hindari menyimpan IP mentah jangka panjang; gunakan hash anonim/TTL bila dibutuhkan
  anonymous_visitor_hash varchar(120),
  occurred_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS download_events_app_time ON download_events(app_id,occurred_at DESC);

CREATE TABLE IF NOT EXISTS audit_events (
  id bigserial PRIMARY KEY,
  actor_id uuid REFERENCES admin_users(id),
  action varchar(100) NOT NULL,
  entity_type varchar(60) NOT NULL,
  entity_id uuid,
  previous_state jsonb,
  new_state jsonb,
  request_id uuid,
  occurred_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS audit_events_time ON audit_events(occurred_at DESC);
-- Di produksi, aplikasi menggunakan role SQL berhak INSERT/SELECT saja untuk audit_events,
-- bukan UPDATE/DELETE. Owner UI juga tidak diberi hak mutasi audit log.

INSERT INTO categories(slug,name,sort_order) VALUES
('produktivitas','Produktivitas',10),('bisnis','Bisnis',20),
('pendidikan','Pendidikan',30),('alat-utilitas','Alat & Utilitas',40)
ON CONFLICT(slug) DO NOTHING;
COMMIT;