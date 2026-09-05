import { access, copyFile, readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const distDir = path.join(process.cwd(), 'dist', 'our-story');
const indexPath = path.join(distDir, 'index.html');

try {
  await access(indexPath);
} catch {
  console.error(`Không tìm thấy build output: ${indexPath}`);
  process.exit(1);
}

await copyFile(indexPath, path.join(distDir, '404.html'));
const styleFiles = (await readdir(distDir)).filter((file) => /^styles(?:[-.][a-z0-9]+)?\.css$/i.test(file));
for (const styleFile of styleFiles) {
  const stylePath = path.join(distDir, styleFile);
  const styles = await readFile(stylePath, 'utf8');
  await writeFile(stylePath, styles.replaceAll('url(/fonts/', 'url(fonts/'), 'utf8');
}
await writeFile(path.join(distDir, '.nojekyll'), '', 'utf8');
console.log('Static hosting files prepared: 404.html + .nojekyll');
