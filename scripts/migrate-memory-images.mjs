import { access, mkdir, readFile, readdir, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';
import exifr from 'exifr';

const PROJECT_ROOT = process.cwd();
const MEMORY_ROOT = path.join(PROJECT_ROOT, 'public', 'images', 'memories');
const UNRESOLVED_ROOT = path.join(MEMORY_ROOT, '_unresolved');
const IMAGE_EXTENSIONS = new Set([
  '.jpg', '.jpeg', '.png', '.webp', '.avif', '.gif', '.heic', '.heif'
]);
const VIDEO_EXTENSIONS = new Set(['.mp4']);
const MEDIA_EXTENSIONS = new Set([...IMAGE_EXTENSIONS, ...VIDEO_EXTENSIONS]);
const EXIF_TAGS = ['DateTimeOriginal', 'CreateDate', 'ModifyDate'];
const APPLY = process.argv.includes('--apply');

function isValidIsoDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function normalizeDate(value) {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, '0');
    const day = String(value.getDate()).padStart(2, '0');
    const iso = `${year}-${month}-${day}`;
    return isValidIsoDate(iso) ? iso : undefined;
  }

  if (typeof value !== 'string') return undefined;
  const match = value.trim().match(/^(\d{4})[:\-](\d{2})[:\-](\d{2})/);
  if (!match) return undefined;
  const iso = `${match[1]}-${match[2]}-${match[3]}`;
  return isValidIsoDate(iso) ? iso : undefined;
}

async function exists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function readJsonIfPresent(filePath, fallback) {
  try {
    return JSON.parse(await readFile(filePath, 'utf8'));
  } catch (error) {
    if (error?.code === 'ENOENT') return fallback;
    throw new Error(`JSON không hợp lệ: ${filePath}\n${error.message}`);
  }
}

function manualDateFor(metadata, file) {
  const value = metadata?.[file]?.date ?? metadata?.files?.[file]?.date;
  return normalizeDate(value);
}

async function findExifDate(filePath) {
  try {
    const tags = await exifr.parse(filePath, { pick: EXIF_TAGS });
    for (const tag of EXIF_TAGS) {
      const date = normalizeDate(tags?.[tag]);
      if (date) return { date, source: `EXIF:${tag}` };
    }
  } catch (error) {
    return { error: `EXIF_READ_ERROR: ${error.message}` };
  }
  return undefined;
}

async function uniqueDestination(directory, file) {
  const extension = path.extname(file);
  const stem = file.slice(0, file.length - extension.length);
  let candidate = file;
  let index = 2;
  while (await exists(path.join(directory, candidate))) {
    candidate = `${stem}-${index}${extension}`;
    index += 1;
  }
  return candidate;
}

async function moveFile(sourcePath, targetDirectory, file) {
  await mkdir(targetDirectory, { recursive: true });
  const targetFile = await uniqueDestination(targetDirectory, file);
  const targetPath = path.join(targetDirectory, targetFile);
  if (APPLY) await rename(sourcePath, targetPath);
  return targetPath;
}

async function migrateMonth(monthDirectory, sourceMonth) {
  const metadata = await readJsonIfPresent(path.join(monthDirectory, 'metadata.json'), {});
  const files = (await readdir(monthDirectory, { withFileTypes: true }))
    .filter((entry) => entry.isFile() && MEDIA_EXTENSIONS.has(path.extname(entry.name).toLowerCase()))
    .map((entry) => entry.name)
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));
  const unresolved = [];

  for (const file of files) {
    const sourcePath = path.join(monthDirectory, file);
    const relativeSourcePath = path.relative(PROJECT_ROOT, sourcePath).replaceAll(path.sep, '/');
    const exif = await findExifDate(sourcePath);
    const manualDate = manualDateFor(metadata, file);
    const resolved = exif?.date
      ? { date: exif.date, source: exif.source }
      : manualDate
        ? { date: manualDate, source: 'metadata.json' }
        : undefined;

    if (resolved) {
      const [year, month, day] = resolved.date.split('-');
      const targetDirectory = path.join(MEMORY_ROOT, year, month, day);
      const targetPath = await moveFile(sourcePath, targetDirectory, file);
      const relativeTargetPath = path.relative(PROJECT_ROOT, targetPath).replaceAll(path.sep, '/');
      console.log(`${APPLY ? 'MOVED' : 'PLAN'} ${relativeSourcePath} -> ${relativeTargetPath} (${resolved.source})`);
      continue;
    }

    const reason = exif?.error ?? (manualDate ? 'INVALID_MANUAL_DATE' : 'NO_EXIF_DATE');
    const targetDirectory = path.join(UNRESOLVED_ROOT, sourceMonth);
    const targetPath = await moveFile(sourcePath, targetDirectory, file);
    const relativeTargetPath = path.relative(PROJECT_ROOT, targetPath).replaceAll(path.sep, '/');
    unresolved.push({
      file,
      sourceMonth,
      sourcePath: relativeSourcePath,
      targetPath: relativeTargetPath,
      reason
    });
    console.log(`${APPLY ? 'UNRESOLVED' : 'PLAN'} ${relativeSourcePath} -> ${relativeTargetPath} (${reason})`);
  }

  return unresolved;
}

if (!(await exists(MEMORY_ROOT))) {
  console.error(`Không tìm thấy thư mục: ${MEMORY_ROOT}`);
  process.exit(1);
}

const existingAudit = await readJsonIfPresent(path.join(PROJECT_ROOT, 'migration-unresolved.json'), []);
const auditByTarget = new Map(
  Array.isArray(existingAudit) ? existingAudit.map((item) => [item.targetPath, item]) : []
);
const monthDirectories = (await readdir(MEMORY_ROOT, { withFileTypes: true }))
  .filter((entry) => entry.isDirectory() && /^\d{4}-\d{2}$/.test(entry.name))
  .sort((a, b) => a.name.localeCompare(b.name));
const unresolved = [];

for (const monthEntry of monthDirectories) {
  const monthUnresolved = await migrateMonth(path.join(MEMORY_ROOT, monthEntry.name), monthEntry.name);
  for (const item of monthUnresolved) {
    auditByTarget.set(item.targetPath, item);
    unresolved.push(item);
  }
}

if (APPLY) {
  const audit = [...auditByTarget.values()].sort((a, b) => a.targetPath.localeCompare(b.targetPath));
  await writeFile(path.join(PROJECT_ROOT, 'migration-unresolved.json'), `${JSON.stringify(audit, null, 2)}\n`, 'utf8');
}

console.log(`\n${APPLY ? 'Migration applied' : 'Dry-run complete'}: ${unresolved.length} unresolved media.`);
if (!APPLY) console.log('Chạy lại với --apply để thực hiện di chuyển file.');
