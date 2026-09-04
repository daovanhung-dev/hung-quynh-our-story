import { access, readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

const IMAGE_EXTENSIONS = new Set([
  '.jpg', '.jpeg', '.png', '.webp', '.avif', '.gif', '.heic', '.heif'
]);
const VIDEO_EXTENSIONS = new Set(['.mp4']);
const MEDIA_EXTENSIONS = new Set([...IMAGE_EXTENSIONS, ...VIDEO_EXTENSIONS]);
const GENERATED_MEDIA_ROOT = path.join('public', 'images', 'generated', 'memories');

function isValidDateParts(year, month, day) {
  if (!/^\d{4}$/.test(year) || !/^\d{2}$/.test(month) || !/^\d{2}$/.test(day)) return false;
  const iso = `${year}-${month}-${day}`;
  const date = new Date(`${iso}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === iso;
}

function naturalSort(values) {
  return [...values].sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));
}

function isVideo(file) {
  return VIDEO_EXTENSIONS.has(path.extname(file).toLowerCase());
}

function isHeic(file) {
  return ['.heic', '.heif'].includes(path.extname(file).toLowerCase());
}

function toPublicAssetPath(...segments) {
  return segments
    .flatMap((segment) => String(segment).split(/[\\/]/))
    .filter(Boolean)
    .map((segment) => encodeURIComponent(segment))
    .join('/');
}

function withoutExtension(file) {
  return file.slice(0, file.length - path.extname(file).length);
}

async function exists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function readJsonIfPresent(filePath, fallback = {}) {
  try {
    return JSON.parse(await readFile(filePath, 'utf8'));
  } catch (error) {
    if (error?.code === 'ENOENT') return fallback;
    throw new Error(`JSON không hợp lệ: ${filePath}\n${error.message}`);
  }
}

function normalizeMediaSelection(metadataImages, availableMedia) {
  if (!Array.isArray(metadataImages) || metadataImages.length === 0) {
    return availableMedia.map((file) => ({ file }));
  }

  return metadataImages.map((item) => {
    if (typeof item === 'string') return { file: item };
    if (item && typeof item === 'object' && typeof item.file === 'string') return item;
    throw new Error('metadata.images chỉ chấp nhận tên file hoặc object có trường "file".');
  });
}

async function mediaManifest({ projectRoot, relativeDirectory, file, item = {}, id }) {
  const kind = isVideo(file) ? 'video' : 'image';
  const generatedDirectory = path.join(GENERATED_MEDIA_ROOT, relativeDirectory);
  const stem = withoutExtension(file);
  const generatedDisplayFile = `${stem}.webp`;
  const generatedThumbFile = `${stem}-thumb.webp`;
  const generatedMediumFile = `${stem}-medium.webp`;
  const generatedDisplayPath = path.join(projectRoot, generatedDirectory, generatedDisplayFile);
  const generatedThumbPath = path.join(projectRoot, generatedDirectory, generatedThumbFile);
  const generatedMediumPath = path.join(projectRoot, generatedDirectory, generatedMediumFile);
  const sourceAsset = toPublicAssetPath('images', 'memories', relativeDirectory, file);
  const generatedDisplayAsset = toPublicAssetPath('images', 'generated', 'memories', relativeDirectory, generatedDisplayFile);
  const generatedThumbAsset = toPublicAssetPath('images', 'generated', 'memories', relativeDirectory, generatedThumbFile);
  const generatedMediumAsset = toPublicAssetPath('images', 'generated', 'memories', relativeDirectory, generatedMediumFile);

  const displayPath = isHeic(file) && await exists(generatedDisplayPath)
    ? generatedDisplayAsset
    : sourceAsset;

  return {
    id: String(item.id ?? `${id}-${withoutExtension(file).toLowerCase().replace(/[^a-z0-9]+/g, '-')}`),
    kind,
    src: displayPath,
    thumbnailSrc: kind === 'image' && await exists(generatedThumbPath) ? generatedThumbAsset : undefined,
    mediumSrc: kind === 'image' && await exists(generatedMediumPath) ? generatedMediumAsset : undefined,
    originalSrc: isHeic(file) || kind === 'video' ? sourceAsset : undefined,
    posterSrc: typeof item.poster === 'string'
      ? toPublicAssetPath('images', 'memories', relativeDirectory, item.poster)
      : undefined,
    alt: typeof item.alt === 'string' ? item.alt : undefined,
    width: Number.isFinite(item.width) ? item.width : undefined,
    height: Number.isFinite(item.height) ? item.height : undefined,
    caption: typeof item.caption === 'string' ? item.caption : undefined
  };
}

async function scanDatedMemory({ projectRoot, year, month, day, errors }) {
  const relativeDirectory = path.join(year, month, day);
  const dayPath = path.join(projectRoot, 'public', 'images', 'memories', relativeDirectory);
  const context = `${year}/${month}/${day}`;

  if (!isValidDateParts(year, month, day)) {
    errors.push(`[${context}] Folder phải đúng định dạng YYYY/MM/DD và là ngày hợp lệ.`);
    return undefined;
  }

  const files = await readdir(dayPath, { withFileTypes: true });
  const availableMedia = naturalSort(
    files
      .filter((entry) => entry.isFile() && MEDIA_EXTENSIONS.has(path.extname(entry.name).toLowerCase()))
      .map((entry) => entry.name)
  );
  const metadataPath = path.join(dayPath, 'metadata.json');
  let metadata;
  try {
    metadata = await readJsonIfPresent(metadataPath);
  } catch (error) {
    errors.push(`[${context}] ${error.message}`);
    return undefined;
  }

  if (availableMedia.length === 0) {
    if (Object.keys(metadata).length > 0) errors.push(`[${context}] Có metadata.json nhưng không có media.`);
    return undefined;
  }

  let selectedMedia;
  try {
    selectedMedia = normalizeMediaSelection(metadata.images ?? metadata.media, availableMedia);
  } catch (error) {
    errors.push(`[${context}] ${error.message}`);
    return undefined;
  }

  for (const item of selectedMedia) {
    if (!availableMedia.includes(item.file)) {
      errors.push(`[${context}] metadata tham chiếu media không tồn tại: ${item.file}`);
    }
  }

  const coverFile = metadata.cover ?? selectedMedia[0]?.file ?? availableMedia[0];
  if (!availableMedia.includes(coverFile)) {
    errors.push(`[${context}] Cover không tồn tại: ${coverFile}`);
  }

  const date = `${year}-${month}-${day}`;
  const id = String(metadata.id ?? date).trim();
  if (!id) errors.push(`[${context}] id không được rỗng.`);

  const validSelectedMedia = selectedMedia.filter((item) => availableMedia.includes(item.file));
  const images = [];
  for (const item of validSelectedMedia) {
    images.push(await mediaManifest({ projectRoot, relativeDirectory, file: item.file, item, id }));
  }

  const coverItem = validSelectedMedia.find((item) => item.file === coverFile) ?? validSelectedMedia[0];
  const coverMedia = coverItem
    ? await mediaManifest({ projectRoot, relativeDirectory, file: coverItem.file, item: coverItem, id })
    : undefined;

  return {
    id,
    date,
    title: typeof metadata.title === 'string' ? metadata.title : undefined,
    caption: typeof metadata.caption === 'string' ? metadata.caption : undefined,
    location: typeof metadata.location === 'string' ? metadata.location : undefined,
    cover: coverMedia?.src ?? '',
    coverKind: coverMedia?.kind ?? 'image',
    coverPosterSrc: coverMedia?.posterSrc,
    images,
    year: Number(year),
    month: Number(month),
    day: Number(day)
  };
}

async function scanUnresolvedMedia({ projectRoot }) {
  const root = path.join(projectRoot, 'public', 'images', 'memories', '_unresolved');
  if (!(await exists(root))) return [];

  const audit = await readJsonIfPresent(path.join(projectRoot, 'migration-unresolved.json'), []);
  const auditByTarget = new Map(
    Array.isArray(audit)
      ? audit.map((item) => [item.targetPath, item])
      : []
  );
  const groups = [];
  const monthEntries = (await readdir(root, { withFileTypes: true }))
    .filter((entry) => entry.isDirectory())
    .sort((a, b) => a.name.localeCompare(b.name));

  for (const monthEntry of monthEntries) {
    const sourceMonth = monthEntry.name;
    const monthPath = path.join(root, sourceMonth);
    const files = naturalSort(
      (await readdir(monthPath, { withFileTypes: true }))
        .filter((entry) => entry.isFile() && MEDIA_EXTENSIONS.has(path.extname(entry.name).toLowerCase()))
        .map((entry) => entry.name)
    );
    const media = [];
    for (const file of files) {
      const relativeDirectory = path.join('_unresolved', sourceMonth);
      const targetPath = path.join('public', 'images', 'memories', relativeDirectory, file)
        .replaceAll(path.sep, '/');
      const auditItem = auditByTarget.get(targetPath) ?? {};
      media.push({
        ...(await mediaManifest({
          projectRoot,
          relativeDirectory,
          file,
          item: {},
          id: `unresolved-${sourceMonth}`
        })),
        id: `unresolved-${sourceMonth}-${withoutExtension(file).toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
        sourceMonth,
        reason: auditItem.reason ?? 'NO_EXIF_DATE'
      });
    }
    if (media.length > 0) {
      groups.push({ sourceMonth, label: `Chưa xác định ngày · ${sourceMonth}`, media });
    }
  }
  return groups;
}

export async function scanMemories({ projectRoot = process.cwd() } = {}) {
  const root = path.join(projectRoot, 'public', 'images', 'memories');
  const errors = [];
  const memories = [];

  if (!(await exists(root))) {
    return { memories, unresolvedMedia: [], errors: [`Không tìm thấy thư mục: ${root}`] };
  }

  const years = (await readdir(root, { withFileTypes: true })).filter((entry) => entry.isDirectory());

  for (const yearEntry of years) {
    const year = yearEntry.name;
    if (year === '_unresolved' || year === 'generated') continue;
    if (/^\d{4}-\d{2}$/.test(year)) continue;
    if (!/^\d{4}$/.test(year)) {
      errors.push(`[${year}] Folder phải là năm YYYY.`);
      continue;
    }

    const yearPath = path.join(root, year);
    const months = (await readdir(yearPath, { withFileTypes: true })).filter((entry) => entry.isDirectory());
    for (const monthEntry of months) {
      const month = monthEntry.name;
      if (!/^\d{2}$/.test(month)) {
        errors.push(`[${year}/${month}] Folder phải là tháng MM.`);
        continue;
      }
      const monthPath = path.join(yearPath, month);
      const days = (await readdir(monthPath, { withFileTypes: true })).filter((entry) => entry.isDirectory());
      for (const dayEntry of days) {
        const memory = await scanDatedMemory({
          projectRoot,
          year,
          month,
          day: dayEntry.name,
          errors
        });
        if (memory) memories.push(memory);
      }
    }
  }

  const seen = new Set();
  for (const memory of memories) {
    if (seen.has(memory.id)) errors.push(`[${memory.date}] Trùng memory id: ${memory.id}`);
    seen.add(memory.id);
  }

  memories.sort((a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id));
  const unresolvedMedia = await scanUnresolvedMedia({ projectRoot });
  return { memories, unresolvedMedia, errors };
}
