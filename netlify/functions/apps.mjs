// Public read-only catalog endpoint: GET /api/apps
// Only apps with an approved, malware-screened, published release are visible.
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
      SELECT a.id, a.slug, a.name, a.developer_name,
             a.short_description, a.featured, a.icon_object_key,
             ('/api/download/' || a.slug) AS download_path,
             c.name AS category, r.version_name, r.file_size_bytes,
             r.published_at
      FROM apps a
      INNER JOIN releases r ON r.app_id = a.id
      LEFT JOIN categories c ON c.id = a.category_id
      WHERE a.is_listed = TRUE
        AND r.workflow_status = 'published'
        AND r.scan_status = 'passed'
        AND r.sha256 IS NOT NULL
        AND r.approved_by IS NOT NULL
        AND r.storage_provider = 'github_releases'
        AND r.github_release_id IS NOT NULL
        AND r.github_asset_id IS NOT NULL
      ORDER BY a.featured DESC, r.published_at DESC NULLS LAST
      LIMIT ${limit}
    `;
    return json({ apps, count: apps.length });
  } catch (error) {
    console.error('Public catalog query failed', error?.name ?? 'error');
    return json({ error: 'Catalog is temporarily unavailable' }, 503);
  }
}

export const config = { path: '/api/apps', method: ['GET'] };