import { cp, mkdir, readFile, rm } from 'node:fs/promises';
import { resolve } from 'node:path';
const src = resolve('public');
const output = resolve('dist');
const names = ['index.html', 'store.css', 'store.js', 'favicon.svg'];
const html = await readFile(resolve(src,'index.html'),'utf8');
if (/data-action="go-admin"|dashboard owner|prototipe demo|<script[^>]*app\.js/i.test(html)) {
  throw new Error('Build refused: internal controls or prototype in public HTML');
}
await rm(output, {recursive:true, force:true});
await mkdir(output,{recursive:true});
for(const name of names) await cp(resolve(src,name),resolve(output,name));
console.log('Built public-only storefront. No internal dashboard files shipped. No deploy.');