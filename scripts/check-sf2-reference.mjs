import { readFile, stat } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';

const filePath = resolve(process.cwd(), 'public/games/sf2.zip');

try {
  const fileInfo = await stat(filePath);
  const bytes = await readFile(filePath);
  const isZip = bytes.length >= 4 && bytes.subarray(0, 4).equals(Buffer.from([0x50, 0x4b, 0x03, 0x04]));
  console.log(JSON.stringify({
    path: 'public/games/sf2.zip',
    exists: true,
    size: fileInfo.size,
    sha256: createHash('sha256').update(bytes).digest('hex'),
    looksLikeZip: isZip,
    optional: true,
    usedByLoveFight: false
  }, null, 2));
} catch (error) {
  if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') {
    console.log(JSON.stringify({
      path: 'public/games/sf2.zip',
      exists: false,
      optional: true,
      usedByLoveFight: false
    }, null, 2));
  } else {
    throw error;
  }
}
