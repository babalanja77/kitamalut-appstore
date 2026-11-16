// Public read-only catalog endpoint: GET /api/apps
// Only officially listed Play apps and/or APK releases that passed approval and security checks are visible.
// IMPORTANT: This does not implement upload, download, admin auth, or scanning.
import { neon } from '@neondatabase/serverless';

const json = (body, status = 200) => Response.json(body, {
  status,
  headers: { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' }
});

export default async function handler(request) {
  if (request.method !== 'GET') return json({ error: 'Method not allowed' }, 405);
  const connectionString = globalThis.Netlify?.env?.get('DATABASE_URL') ?? process.env.DATABASE_URL;
  if (!connectionString) return json({ error: 'Database is not configured' }, 503);

  const query = new URL(request.url).searchParams;
  const limitRaw = Number(query.get('limit') ?? 24);
  const limit = Number.isInteger(limitRaw) ? Math.min(Math.max(limitRaw, 1), 50) : 24;

  try {
    const sql = neon(connectionString);
    const apps = await sql`
      SELECT a.id, a.slug, a.package_id, a.name, a.developer_name,
             a.short_description, a.featured, a.play_store_status,
             CASE WHEN a.play_store_status = 'available'
                       AND a.package_id ~ '^[A-Za-z][A-Za-z0-9_]*(\.[A-Za-z][A-Za-z0-9_]*)+$'
                  THEN ('https://play.google.com/store/apps/details?id=' || a.package_id)
                  ELSE NULL END AS play_store_url,
             (r.id IS NOT NULL) AS apk_available,
             CASE WHEN r.id IS NOT NULL THEN ('/api/download/' || a.slug)
                  ELSE NULL END AS download_path,
             c.name AS category, r.version_name, r.file_size_bytes,
             r.published_at
      FROM apps a
      LEFT JOIN LATERAL (
        SELECT r.* FROM releases r
        WHERE r.app_id = a.id AND r.workflow_status = 'published'
          AND r.scan_status = 'passed' AND r.sha256 IS NOT NULL
          AND r.approved_by IS NOT NULL AND r.storage_provider = 'github_releases'
          AND r.github_release_id IS NOT NULL AND r.github_asset_id IS NOT NULL
        ORDER BY r.published_at DESC LIMIT 1
      ) r ON TRUE
      LEFT JOIN categories c ON c.id = a.category_id
      WHERE a.is_listed = TRUE
        AND (
          (a.play_store_status = 'available' AND
           a.package_id ~ '^[A-Za-z][A-Za-z0-9_]*(\.[A-Za-z][A-Za-z0-9_]*)+$')
          OR r.id IS NOT NULL
        )
      ORDER BY a.featured DESC, r.published_at DESC NULLS LAST, a.name ASC
      LIMIT ${limit}
    `;
    return json({ apps, count: apps.length });
  } catch (error) {
    console.error('Public catalog query failed', error?.name ?? 'error');
    return json({ error: 'Catalog is temporarily unavailable' }, 503);
  }
}

export const config = { path: '/api/apps', method: ['GET'] };