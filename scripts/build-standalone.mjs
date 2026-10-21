import {readFile, writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';

const root=fileURLToPath(new URL('../',import.meta.url));
const dist=path.join(root,'dist');
let html=await readFile(path.join(dist,'index.html'),'utf8');
const script=html.match(/<script\b[^>]*\bsrc="([^"]+)"[^>]*><\/script>/);
if(!script)throw new Error('Production JavaScript entry not found. Run the Vite build first.');
const assetPath=url=>{
  const resolved=path.resolve(dist,url.replace(/^\//,''));
  if(!resolved.startsWith(dist+path.sep))throw new Error('Asset is outside the build directory.');
  return resolved;
};
const javascript=await readFile(assetPath(script[1]),'utf8');
html=html.replace(script[0],'');
for(const match of [...html.matchAll(/<link\b[^>]*\brel="stylesheet"[^>]*>/g)]){
  const href=match[0].match(/href="([^"]+)"/)[1];
  let css=await readFile(assetPath(href),'utf8');
  // System font fallbacks keep the portable build entirely offline.
  css=css.replace(/@import\s*(?:url\([^)]*\)|["'][^"']*["'])[^;]*;/g,'');
  html=html.replace(match[0],()=>`<style>${css.replace(/<\/style/gi,'<\\/style')}</style>`);
}
const favicon=await readFile(path.join(root,'public/favicon.svg'));
html=html.replace(/href="\.?\/?favicon\.svg"/,`href="data:image/svg+xml;base64,${favicon.toString('base64')}"`);
html=html.replace('href="./" aria-label="Ashen Reliquary home"','href="#" aria-label="Ashen Reliquary home"');
html=html.replace('</body>',()=>`<script type="module">${javascript.replace(/<\/script/gi,'<\\/script')}</script></body>`);
await writeFile(path.join(dist,'ashen-reliquary.html'),html);
console.log(`Standalone game: dist/ashen-reliquary.html (${Math.ceil(Buffer.byteLength(html)/1024)} KB, no external assets)`);
