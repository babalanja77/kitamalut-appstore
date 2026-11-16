-- 2026-11-16 — GitHub Releases sebagai distribusi APK publik.
-- HANYA untuk branch Neon DEMO. Tidak memindahkan APK dan tidak menerbitkan release.
BEGIN;
ALTER TABLE releases
  ADD COLUMN IF NOT EXISTS storage_provider varchar(32) NOT NULL DEFAULT 'github_releases',
  ADD COLUMN IF NOT EXISTS github_release_id bigint,
  ADD COLUMN IF NOT EXISTS github_asset_id bigint,
  ADD COLUMN IF NOT EXISTS github_release_tag varchar(200),
  ADD COLUMN IF NOT EXISTS github_asset_name varchar(255);
CREATE UNIQUE INDEX IF NOT EXISTS releases_github_asset_unique ON releases(github_asset_id)
  WHERE github_asset_id IS NOT NULL;
ALTER TABLE releases
  ADD CONSTRAINT releases_github_publication_requires_approval CHECK (
    workflow_status <> 'published' OR (
      storage_provider = 'github_releases'
      AND scan_status = 'passed'
      AND approved_by IS NOT NULL
      AND published_at IS NOT NULL
      AND github_release_id > 0 AND github_asset_id > 0
      AND github_asset_name ~* '\.apk$'
      AND github_release_tag IS NOT NULL
      AND file_size_bytes > 0 AND sha256 IS NOT NULL
      AND signer_sha256 IS NOT NULL
      AND package_id_verified IS NOT NULL
    )
  );
COMMIT;