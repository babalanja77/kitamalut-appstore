import { cp, mkdir, rm } from 'node:fs/promises';
import { resolve } from 'node:path';
const output = resolve('dist');
await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
for (const name of ['index.html', 'styles.css', 'app.js']) {
  await cp(resolve(name), resolve(output, name));
}
console.log('Built static prototype in dist/. No deploy was performed.');