import { access, readFile } from 'node:fs/promises';
import path from 'node:path';

const projectRoot = process.cwd();
const artifactRoot = path.join(projectRoot, 'dist', 'our-story');
const manifestPath = path.join(projectRoot, 'src', 'app', 'generated', 'memories.generated.ts');
const expectedBaseHref = '/hung-quynh-our-story/';

async function exists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

for (const required of ['index.html', '404.html', '.nojekyll', 'favicon.svg', 'images/memories']) {
  if (!(await exists(path.join(artifactRoot, required)))) {
    throw new Error(`Artifact thiếu: dist/our-story/${required}`);
  }
}

const indexHtml = await readFile(path.join(artifactRoot, 'index.html'), 'utf8');
if (!indexHtml.includes(`<base href="${expectedBaseHref}">`)) {
  throw new Error(`Artifact có base href sai, cần ${expectedBaseHref}`);
}

const manifest = await readFile(manifestPath, 'utf8');
const assets = [...manifest.matchAll(/"(?:src|thumbnailSrc|mediumSrc|posterSrc|originalSrc)": "([^"]+)"/g)]
  .map((match) => match[1]);
const invalid = assets.filter((asset) => asset.startsWith('/') || asset.startsWith('public/'));
if (invalid.length > 0) {
  throw new Error(`Manifest có asset path không hợp lệ: ${invalid.slice(0, 5).join(', ')}`);
}

const missing = [];
for (const asset of assets) {
  if (!(await exists(path.join(artifactRoot, asset)))) missing.push(asset);
}
if (missing.length > 0) {
  throw new Error(`Artifact thiếu ${missing.length} asset manifest, ví dụ: ${missing.slice(0, 5).join(', ')}`);
}

console.log(`Static artifact OK: ${assets.length} asset references verified.`);
