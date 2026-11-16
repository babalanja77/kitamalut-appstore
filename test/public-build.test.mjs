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