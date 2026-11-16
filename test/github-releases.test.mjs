import test from 'node:test';
import assert from 'node:assert/strict';
import { validatePublishedGitHubAsset, resolveApprovedGitHubAsset } from '../lib/github-releases.mjs';

const sha = 'a'.repeat(64);
const expected = Object.freeze({ releaseId: 11, assetId: 22, assetName: 'hwc-v1.apk', tag: 'hwc-v1', sizeBytes: 1824, sha256: sha });
const sample = () => ({ id: 11, tag_name: 'hwc-v1', draft: false, prerelease: false,
  assets: [{ id: 22, name: 'hwc-v1.apk', state: 'uploaded', size: 1824, digest: `sha256:${sha}`,
    browser_download_url: 'https://github.com/babalanja77/kitamalut-appstore/releases/download/hwc-v1/hwc-v1.apk' }] });

test('valid approved GitHub asset URL', () => assert.match(validatePublishedGitHubAsset(sample(), expected), /^https:\/\/github.com\//));
for (const [name,change] of [
  ['draft release', r => r.draft = true],
  ['prerelease', r => r.prerelease = true],
  ['wrong release id', r => r.id = 55],
  ['wrong version tag', r => r.tag_name = 'wrong'],
  ['wrong asset id', r => r.assets[0].id = 999],
  ['wrong asset filename', r => r.assets[0].name = 'tampered.apk'],
  ['wrong size', r => r.assets[0].size = 99],
  ['wrong checksum', r => r.assets[0].digest = 'sha256:'+'b'.repeat(64)],
  ['missing checksum', r => delete r.assets[0].digest],
  ['malicious redirect host', r => r.assets[0].browser_download_url = 'https://evil.test/a.apk'],
  ['wrong repository path', r => r.assets[0].browser_download_url = 'https://github.com/else/repo/releases/download/hwc-v1/hwc-v1.apk'],
  ['unuploaded asset', r => r.assets[0].state = 'starter'],
]) {
  test(`rejects ${name}`, () => { const value = sample(); change(value); assert.throws(() => validatePublishedGitHubAsset(value, expected)); });
}
test('read only GitHub API lookup', async () => {
  let url;
  const result = await resolveApprovedGitHubAsset(expected, {
    fetchImpl: async (u) => { url=u; return {ok:true,json:async()=>sample()}; },
  });
  assert.equal(url,'https://api.github.com/repos/babalanja77/kitamalut-appstore/releases/11');
  assert.match(result,/^https:\/\/github.com\//);
});
test('network failure does not grant download', async () => {
  await assert.rejects(resolveApprovedGitHubAsset(expected, { fetchImpl: async () => ({ok:false,status:404}) }));
});