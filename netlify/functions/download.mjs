/**
 * GET /api/download/:slug — hanya redirect ke GitHub Releases publik jika
 * metadata Neon telah disetujui dan aset GitHub cocok (ID, nama, ukuran, digest).
 * Tidak ada upload/publish/auth admin di endpoint ini.
 */
import { neon } from '@neondatabase/serverless';
import { resolveApprovedGitHubAsset } from '../../lib/github-releases.mjs';

const reply = (body, status = 200) => Response.json(body, {
  status,
  headers: { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' },
});

export default async function handler(request, context) {
  if (request.method !== 'GET') return reply({ error: 'Method not allowed' }, 405);
  const slug = context?.params?.slug;
  if (typeof slug !== 'string' || !/^[a-z0-9][a-z0-9-]{0,118}[a-z0-9]$/.test(slug)) {
    return reply({ error: 'Invalid application identifier' }, 400);
  }
  const connectionString = globalThis.Netlify?.env?.get('DATABASE_URL') ?? process.env.DATABASE_URL;
  if (!connectionString) return reply({ error: 'Database is not configured' }, 503);
  try {
    const sql = neon(connectionString);
    const rows = await sql`
      SELECT a.id AS app_id, r.id AS release_row_id,
             r.github_release_id, r.github_asset_id, r.github_asset_name,
             r.github_release_tag, r.file_size_bytes, r.sha256
      FROM apps a INNER JOIN releases r ON r.app_id = a.id
      WHERE a.slug = ${slug} AND a.is_listed = TRUE
        AND r.workflow_status = 'published' AND r.scan_status = 'passed'
        AND r.approved_by IS NOT NULL AND r.github_asset_id IS NOT NULL
        AND r.github_release_id IS NOT NULL AND r.github_asset_name IS NOT NULL
        AND r.github_release_tag IS NOT NULL AND r.sha256 IS NOT NULL
        AND r.storage_provider = 'github_releases'
      ORDER BY r.published_at DESC LIMIT 1
    `;
    if (!rows.length) return reply({ error: 'No approved APK available' }, 404);
    const item = rows[0];
    const verifiedUrl = await resolveApprovedGitHubAsset({
      releaseId: item.github_release_id,
      assetId: item.github_asset_id,
      assetName: item.github_asset_name,
      tag: item.github_release_tag,
      sizeBytes: item.file_size_bytes,
      sha256: item.sha256,
    });
    // Log pemberian link, bukan klaim unduhan berhasil.
    await sql`INSERT INTO download_events(app_id, release_id, event_type)
              VALUES (${item.app_id}, ${item.release_row_id}, 'link_issued')`;
    return new Response(null, {
      status: 302,
      headers: {
        Location: verifiedUrl,
        'Cache-Control': 'no-store',
        'Referrer-Policy': 'no-referrer',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (error) {
    console.error('Approved download could not be resolved', error?.message ?? 'unknown error');
    return reply({ error: 'Download temporarily unavailable' }, 503);
  }
}

export const config = { path: '/api/download/:slug', method: ['GET'] };