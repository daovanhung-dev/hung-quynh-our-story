import { access, readdir, readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';

const projectRoot = process.cwd();
const artifactRoot = path.join(projectRoot, 'dist', 'our-story');
const manifestPath = path.join(projectRoot, 'src', 'app', 'generated', 'memories.generated.ts');
const expectedBaseHref = '/hung-quynh-our-story/';
const expectedLetterHash = '1752b77b6170143ff4ab77181da28d3a1a2e166d40c9901831f46bca58804186';
const letterRelativePath = path.join('content', 'love-letter-miss-you.md');
const SOURCE_IMAGE = /\.(?:jpe?g|png|heic)$/i;

async function exists(filePath) {
  try { await access(filePath); return true; } catch { return false; }
}

async function listFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(entries.map((entry) => {
    const target = path.join(directory, entry.name);
    return entry.isDirectory() ? listFiles(target) : [target];
  }));
  return nested.flat();
}

for (const required of ['index.html', '404.html', '.nojekyll', 'favicon.svg', 'images/generated/memories/media-manifest.json', letterRelativePath]) {
  if (!(await exists(path.join(artifactRoot, required)))) throw new Error(`Artifact thiếu: dist/our-story/${required}`);
}

const houseRooms = ['entrance', 'living', 'kitchen', 'study', 'bedroom', 'balcony'];
for (const room of houseRooms) {
  for (const asset of [`${room}-isometric.webp`, `${room}.svg`]) {
    const relativePath = path.join('our-home', 'rooms', asset);
    if (!(await exists(path.join(artifactRoot, relativePath)))) throw new Error(`Artifact thiếu artwork Our Home: dist/our-story/${relativePath}`);
  }
}

const indexHtml = await readFile(path.join(artifactRoot, 'index.html'), 'utf8');
if (!indexHtml.includes(`<base href="${expectedBaseHref}">`)) throw new Error(`Artifact có base href sai, cần ${expectedBaseHref}`);
if (/url\(\s*["']?\/fonts\//.test(indexHtml)) throw new Error('Artifact HTML còn tham chiếu font từ root path, không tương thích GitHub Pages project base path.');
const styleFiles = (await readdir(artifactRoot)).filter((file) => /^styles(?:[-.][a-z0-9]+)?\.css$/i.test(file));
for (const styleFile of styleFiles) {
  const styles = await readFile(path.join(artifactRoot, styleFile), 'utf8');
  if (/url\(\s*["']?\/fonts\//.test(styles)) throw new Error(`Artifact ${styleFile} còn tham chiếu font từ root path, không tương thích GitHub Pages project base path.`);
}

const [sourceLetter, publicLetter, artifactLetter] = await Promise.all([
  readFile(path.join(projectRoot, 'LOVE_LETTER_ORIGINAL.md')),
  readFile(path.join(projectRoot, 'public', letterRelativePath)),
  readFile(path.join(artifactRoot, letterRelativePath))
]);
for (const [label, bytes] of [['LOVE_LETTER_ORIGINAL.md', sourceLetter], ['public copy', publicLetter], ['Pages artifact', artifactLetter]]) {
  const hash = createHash('sha256').update(bytes).digest('hex');
  if (hash !== expectedLetterHash) throw new Error(`${label} sai SHA-256 thư gốc: ${hash}`);
}
if (!sourceLetter.equals(publicLetter) || !publicLetter.equals(artifactLetter)) throw new Error('Các bản thư không khớp byte-for-byte.');
if (sourceLetter.byteLength !== 10_220 || sourceLetter.toString('utf8').split('\n').length - 1 !== 30) {
  throw new Error('Thư nguồn phải giữ nguyên 30 dòng và 10,220 bytes UTF-8.');
}

const manifest = await readFile(manifestPath, 'utf8');
const assets = [...manifest.matchAll(/"(?:src|thumbnailSrc|displaySrc|mediumSrc|posterSrc|originalSrc)": "([^"]+)"/g)].map((match) => match[1]);
const invalid = assets.filter((asset) => asset.startsWith('/') || asset.startsWith('public/'));
if (invalid.length > 0) throw new Error(`Manifest có asset path không hợp lệ: ${invalid.slice(0, 5).join(', ')}`);

const sourceReferences = assets.filter((asset) => asset.startsWith('images/memories/') && SOURCE_IMAGE.test(asset));
if (sourceReferences.length > 0) throw new Error(`Manifest còn tham chiếu ảnh gốc: ${sourceReferences.slice(0, 5).join(', ')}`);

const missing = [];
for (const asset of assets) if (!(await exists(path.join(artifactRoot, asset)))) missing.push(asset);
if (missing.length > 0) throw new Error(`Artifact thiếu ${missing.length} asset manifest, ví dụ: ${missing.slice(0, 5).join(', ')}`);

const artifactFiles = await listFiles(artifactRoot);
const leakedOriginals = artifactFiles.filter((filePath) => {
  const relative = path.relative(artifactRoot, filePath).replaceAll(path.sep, '/');
  return relative.startsWith('images/memories/') && SOURCE_IMAGE.test(relative);
});
if (leakedOriginals.length > 0) throw new Error(`Artifact vẫn chứa ${leakedOriginals.length} ảnh gốc, ví dụ: ${leakedOriginals.slice(0, 5).join(', ')}`);

console.log(`Static artifact OK: ${assets.length} asset references verified; letter hash verified; no original images deployed.`);
