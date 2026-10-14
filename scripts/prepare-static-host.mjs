import { access, copyFile, readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const distDir = path.join(process.cwd(), 'dist', 'our-story');
const indexPath = path.join(distDir, 'index.html');

function rewriteRootFontUrls(content) {
  return content.replace(/url\(\s*(["']?)\/fonts\//g, 'url($1fonts/');
}

try {
  await access(indexPath);
} catch {
  console.error(`Không tìm thấy build output: ${indexPath}`);
  process.exit(1);
}

const indexHtml = await readFile(indexPath, 'utf8');
await writeFile(indexPath, rewriteRootFontUrls(indexHtml), 'utf8');
await copyFile(indexPath, path.join(distDir, '404.html'));
const styleFiles = (await readdir(distDir)).filter((file) => /^styles(?:[-.][a-z0-9]+)?\.css$/i.test(file));
for (const styleFile of styleFiles) {
  const stylePath = path.join(distDir, styleFile);
  const styles = await readFile(stylePath, 'utf8');
  await writeFile(stylePath, rewriteRootFontUrls(styles), 'utf8');
}
await writeFile(path.join(distDir, '.nojekyll'), '', 'utf8');
console.log('Static hosting files prepared: 404.html + .nojekyll');
