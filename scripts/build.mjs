import { build } from 'esbuild';
import { createHash } from 'node:crypto';
import { mkdir, copyFile, readFile, writeFile } from 'node:fs/promises';
await mkdir('assets/vendor', {recursive:true});
await copyFile('node_modules/gsap/dist/gsap.min.js','assets/vendor/gsap.min.js');
await copyFile('node_modules/gsap/dist/ScrollTrigger.min.js','assets/vendor/ScrollTrigger.min.js');
await build({entryPoints:['src/scene.js'],bundle:true,minify:true,format:'esm',target:'es2020',outfile:'assets/scene.bundle.js',legalComments:'eof'});
let page = await readFile('src/page.html','utf8');
const exhibits = await readFile('exhibits.html','utf8');
for (const id of ['skillsphere','cutroom','expense']) {
  const start = `<!-- exhibit:${id}:start -->`;
  const end = `<!-- exhibit:${id}:end -->`;
  const fragment = exhibits.split(start)[1]?.split(end)[0];
  if (!fragment || !page.includes(`<!-- EXHIBIT:${id} -->`)) throw new Error(`Missing exhibit: ${id}`);
  page = page.replace(`<!-- EXHIBIT:${id} -->`,fragment.trim());
}
const digest = async path => createHash('sha256').update(await readFile(path)).digest('hex').slice(0,12);
for (const match of [...page.matchAll(/(?:href|src)="([^"]+\.(?:css|js))"/g)]) {
  const path = match[1];
  if (!path.startsWith('http')) page = page.replaceAll(`"${path}"`, `"${path}?v=${await digest(path)}"`);
}
page = page.replace('<html lang="en"', `<html data-scene-src="./assets/scene.bundle.js?v=${await digest('assets/scene.bundle.js')}" lang="en"`);
await writeFile('index.html',page);
console.log('Portfolio page and local animation assets built.');
