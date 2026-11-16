import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { resolve } from 'node:path';
const root=resolve('public');
test('public storefront has no admin/demo navigation',async()=>{
 const html=await readFile(resolve(root,'index.html'),'utf8');
 assert.doesNotMatch(html, /dashboard owner|prototipe demo|go-admin|Owner<\/button>|DEMO —/i);
 assert.match(html, /id="app-grid"/);
 assert.match(html, /store\.js/);
});
test('public javascript uses read-only API and no browser-local fake apps',async()=>{
 const js=await readFile(resolve(root,'store.js'),'utf8');
 assert.match(js, /\/api\/apps/);
 assert.doesNotMatch(js, /localStorage|seedApps|go-admin|api\/admin|fetch\(.+method:\s*['"]POST/);
});
test('published directory does not contain old internal scripts after build',async()=>{
 const names=await readdir('dist');
 assert.deepEqual(names.sort(),['favicon.svg','index.html','store.css','store.js'].sort());
});

test('customer interface prioritizes official Play Store and limits APK fallback to verified assets',async()=>{
 const js=await readFile(resolve(root,'store.js'),'utf8');
 const api=await readFile('netlify/functions/apps.mjs','utf8');
 assert.match(js,/Instal melalui Google Play/);
 assert.match(js,/play\.google\.com/);
 assert.match(js,/app\.apk_available === true/);
 assert.match(js,/Unduh APK Resmi \(alternatif\)/);
 assert.match(api,/LEFT JOIN LATERAL/);
 assert.match(api,/a\.play_store_status = 'available'/);
 assert.match(api,/r\.scan_status = 'passed'/);
 assert.match(api,/r\.approved_by IS NOT NULL/);
});