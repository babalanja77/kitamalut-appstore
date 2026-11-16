/**
 * KITAMALUT APP STORE — verifikasi metadata GitHub Releases (tanpa menerbitkan release).
 * GitHub Releases adalah penyimpanan distribusi PUBLIK, bukan tempat karantina.
 */
export const RELEASE_REPOSITORY = 'babalanja77/kitamalut-appstore';
export const GITHUB_API_VERSION = '2026-03-10';

function isPositiveSafeInteger(value) {
  return Number.isSafeInteger(Number(value)) && Number(value) > 0;
}

export function validatePublishedGitHubAsset(release, expected, repository = RELEASE_REPOSITORY) {
  if (repository !== RELEASE_REPOSITORY) throw new Error('Repository not allowed');
  if (!release || release.draft !== false || release.prerelease !== false ||
      !isPositiveSafeInteger(release.id) || Number(release.id) !== Number(expected.releaseId)) {
    throw new Error('Release not published or does not match');
  }
  if (typeof expected.tag !== 'string' || release.tag_name !== expected.tag) {
    throw new Error('Release tag mismatch');
  }
  const assets = Array.isArray(release.assets) ? release.assets : [];
  const asset = assets.find(a => Number(a.id) === Number(expected.assetId));
  if (!asset || asset.state !== 'uploaded') throw new Error('Approved asset not found');
  if (typeof expected.assetName !== 'string' || !/\.apk$/i.test(expected.assetName) ||
      asset.name !== expected.assetName) throw new Error('APK filename mismatch');
  if (!isPositiveSafeInteger(expected.sizeBytes) ||
      Number(asset.size) !== Number(expected.sizeBytes)) throw new Error('APK size mismatch');
  const sha = String(expected.sha256 || '').toLowerCase();
  if (!/^[0-9a-f]{64}$/.test(sha) || String(asset.digest || '').toLowerCase() !== `sha256:${sha}`) {
    throw new Error('APK SHA256 mismatch or unavailable on GitHub');
  }
  const url = new URL(asset.browser_download_url);
  if (url.protocol !== 'https:' || url.hostname !== 'github.com' || url.username ||
      url.password || url.search || url.hash ||
      !url.pathname.startsWith(`/${RELEASE_REPOSITORY}/releases/download/`)) {
    throw new Error('Unapproved GitHub download URL');
  }
  return url.toString();
}

/** Read-only GitHub REST lookup, only for assets already approved in Neon. */
export async function resolveApprovedGitHubAsset(expected, options = {}) {
  const fetchImpl = options.fetchImpl ?? fetch;
  const api = `https://api.github.com/repos/${RELEASE_REPOSITORY}/releases/${expected.releaseId}`;
  const response = await fetchImpl(api, {
    headers: {
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': GITHUB_API_VERSION,
      'User-Agent': 'kitamalut-app-store',
    },
    signal: options.signal ?? AbortSignal.timeout(8000),
  });
  if (!response.ok) throw new Error(`GitHub release lookup failed (${response.status})`);
  return validatePublishedGitHubAsset(await response.json(), expected);
}