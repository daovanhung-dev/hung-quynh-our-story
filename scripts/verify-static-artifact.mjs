import { access, readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

const projectRoot = process.cwd();
const artifactRoot = path.join(projectRoot, 'dist', 'our-story');
const manifestPath = path.join(projectRoot, 'src', 'app', 'generated', 'memories.generated.ts');
const expectedBaseHref = '/hung-quynh-our-story/';
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

for (const required of ['index.html', '404.html', '.nojekyll', 'favicon.svg', 'images/generated/memories/media-manifest.json']) {
  if (!(await exists(path.join(artifactRoot, required)))) throw new Error(`Artifact thiếu: dist/our-story/${required}`);
}

const indexHtml = await readFile(path.join(artifactRoot, 'index.html'), 'utf8');
if (!indexHtml.includes(`<base href="${expectedBaseHref}">`)) throw new Error(`Artifact có base href sai, cần ${expectedBaseHref}`);

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

console.log(`Static artifact OK: ${assets.length} asset references verified; no original images deployed.`);
