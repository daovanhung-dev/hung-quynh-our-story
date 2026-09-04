import { access, copyFile, writeFile } from 'node:fs/promises';
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
await writeFile(path.join(distDir, '.nojekyll'), '', 'utf8');
console.log('Static hosting files prepared: 404.html + .nojekyll');
