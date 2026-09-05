import { access, readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

const IMAGE_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.avif', '.gif', '.heic', '.heif']);
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

function isImage(file) {
  return IMAGE_EXTENSIONS.has(path.extname(file).toLowerCase());
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

function relativeKey(relativeDirectory, file) {
  return path.join(relativeDirectory, file).split(path.sep).join('/');
}

function positiveNumber(value) {
  return Number.isFinite(value) && Number(value) > 0 ? Number(value) : undefined;
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

async function loadVariantManifest(projectRoot) {
  const manifest = await readJsonIfPresent(
    path.join(projectRoot, GENERATED_MEDIA_ROOT, 'media-manifest.json'),
    { dimensions: {} }
  );
  return manifest?.dimensions && typeof manifest.dimensions === 'object' ? manifest.dimensions : {};
}

function normalizeMediaSelection(metadataImages, availableMedia) {
  if (!Array.isArray(metadataImages) || metadataImages.length === 0) return availableMedia.map((file) => ({ file }));

  return metadataImages.map((item) => {
    if (typeof item === 'string') return { file: item };
    if (item && typeof item === 'object' && typeof item.file === 'string') return item;
    throw new Error('metadata.images chỉ chấp nhận tên file hoặc object có trường "file".');
  });
}

async function posterAsset({ projectRoot, relativeDirectory, poster }) {
  if (typeof poster !== 'string' || !poster.trim()) return undefined;
  if (!isImage(poster)) return undefined;

  const generated = path.join(GENERATED_MEDIA_ROOT, relativeDirectory, `${withoutExtension(poster)}-display.webp`);
  return await exists(path.join(projectRoot, generated))
    ? toPublicAssetPath('images', 'generated', 'memories', relativeDirectory, `${withoutExtension(poster)}-display.webp`)
    : undefined;
}

async function mediaManifest({ projectRoot, relativeDirectory, file, item = {}, id, dimensions }) {
  const kind = isVideo(file) ? 'video' : 'image';
  const sourceAsset = toPublicAssetPath('images', 'memories', relativeDirectory, file);
  const stem = withoutExtension(file);

  if (kind === 'video') {
    return {
      id: String(item.id ?? `${id}-${stem.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`),
      kind,
      src: sourceAsset,
      originalSrc: sourceAsset,
      posterSrc: await posterAsset({ projectRoot, relativeDirectory, poster: item.poster }),
      alt: typeof item.alt === 'string' ? item.alt : undefined,
      caption: typeof item.caption === 'string' ? item.caption : undefined
    };
  }

  const generatedDirectory = path.join(GENERATED_MEDIA_ROOT, relativeDirectory);
  const candidates = {
    thumbnailSrc: `${stem}-thumb.webp`,
    displaySrc: `${stem}-display.webp`,
    mediumSrc: `${stem}-medium.webp`
  };
  const assets = {};
  for (const [property, generatedFile] of Object.entries(candidates)) {
    if (await exists(path.join(projectRoot, generatedDirectory, generatedFile))) {
      assets[property] = toPublicAssetPath('images', 'generated', 'memories', relativeDirectory, generatedFile);
    }
  }

  const size = dimensions[relativeKey(relativeDirectory, file)] ?? {};
  return {
    id: String(item.id ?? `${id}-${stem.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`),
    kind,
    src: assets.mediumSrc ?? assets.displaySrc ?? assets.thumbnailSrc ?? sourceAsset,
    ...assets,
    posterSrc: await posterAsset({ projectRoot, relativeDirectory, poster: item.poster }),
    alt: typeof item.alt === 'string' ? item.alt : undefined,
    width: positiveNumber(item.width) ?? positiveNumber(size.width),
    height: positiveNumber(item.height) ?? positiveNumber(size.height),
    caption: typeof item.caption === 'string' ? item.caption : undefined
  };
}

function validateImageVariants(media, context, errors) {
  if (media.kind !== 'image') return;
  if (!media.thumbnailSrc || !media.displaySrc || !media.mediumSrc) {
    errors.push(`[${context}] Thiếu WebP variants; hãy chạy npm run prepare:media.`);
  }
  if (!media.width || !media.height) errors.push(`[${context}] Thiếu kích thước ảnh generated.`);
}

async function scanDatedMemory({ projectRoot, year, month, day, errors, dimensions }) {
  const relativeDirectory = path.join(year, month, day);
  const dayPath = path.join(projectRoot, 'public', 'images', 'memories', relativeDirectory);
  const context = `${year}/${month}/${day}`;

  if (!isValidDateParts(year, month, day)) {
    errors.push(`[${context}] Folder phải đúng định dạng YYYY/MM/DD và là ngày hợp lệ.`);
    return undefined;
  }

  const files = await readdir(dayPath, { withFileTypes: true });
  const availableMedia = naturalSort(files
    .filter((entry) => entry.isFile() && MEDIA_EXTENSIONS.has(path.extname(entry.name).toLowerCase()))
    .map((entry) => entry.name));
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
    if (!availableMedia.includes(item.file)) errors.push(`[${context}] metadata tham chiếu media không tồn tại: ${item.file}`);
  }

  const coverFile = metadata.cover ?? selectedMedia[0]?.file ?? availableMedia[0];
  if (!availableMedia.includes(coverFile)) errors.push(`[${context}] Cover không tồn tại: ${coverFile}`);
  if (!selectedMedia.some((item) => item.file === coverFile)) errors.push(`[${context}] Cover phải có trong metadata.images.`);
  if (typeof metadata.poster === 'string' && (!availableMedia.includes(metadata.poster) || !isImage(metadata.poster))) {
    errors.push(`[${context}] Poster phải là ảnh có trong thư mục ngày: ${metadata.poster}`);
  }

  const date = `${year}-${month}-${day}`;
  const id = String(metadata.id ?? date).trim();
  if (!id) errors.push(`[${context}] id không được rỗng.`);

  const validSelectedMedia = selectedMedia.filter((item) => availableMedia.includes(item.file));
  const images = [];
  for (const item of validSelectedMedia) {
    const media = await mediaManifest({ projectRoot, relativeDirectory, file: item.file, item, id, dimensions });
    validateImageVariants(media, `${context}/${item.file}`, errors);
    images.push(media);
  }

  const cover = images.find((media) => media.id === String(
    validSelectedMedia.find((item) => item.file === coverFile)?.id
      ?? `${id}-${withoutExtension(coverFile).toLowerCase().replace(/[^a-z0-9]+/g, '-')}`
  )) ?? images[0];
  if (!cover) return undefined;

  return {
    id,
    date,
    title: typeof metadata.title === 'string' ? metadata.title : undefined,
    caption: typeof metadata.caption === 'string' ? metadata.caption : undefined,
    location: typeof metadata.location === 'string' ? metadata.location : undefined,
    cover,
    images,
    year: Number(year),
    month: Number(month),
    day: Number(day)
  };
}

async function scanUnresolvedMedia({ projectRoot, dimensions, errors }) {
  const root = path.join(projectRoot, 'public', 'images', 'memories', '_unresolved');
  if (!(await exists(root))) return [];

  const audit = await readJsonIfPresent(path.join(projectRoot, 'migration-unresolved.json'), []);
  const auditByTarget = new Map(Array.isArray(audit) ? audit.map((item) => [item.targetPath, item]) : []);
  const groups = [];
  const monthEntries = (await readdir(root, { withFileTypes: true }))
    .filter((entry) => entry.isDirectory())
    .sort((a, b) => a.name.localeCompare(b.name));

  for (const monthEntry of monthEntries) {
    const sourceMonth = monthEntry.name;
    const monthPath = path.join(root, sourceMonth);
    const files = naturalSort((await readdir(monthPath, { withFileTypes: true }))
      .filter((entry) => entry.isFile() && MEDIA_EXTENSIONS.has(path.extname(entry.name).toLowerCase()))
      .map((entry) => entry.name));
    const media = [];
    for (const file of files) {
      const relativeDirectory = path.join('_unresolved', sourceMonth);
      const targetPath = path.join('public', 'images', 'memories', relativeDirectory, file).replaceAll(path.sep, '/');
      const auditItem = auditByTarget.get(targetPath) ?? {};
      const entry = await mediaManifest({ projectRoot, relativeDirectory, file, item: {}, id: `unresolved-${sourceMonth}`, dimensions });
      validateImageVariants(entry, `${relativeDirectory}/${file}`, errors);
      media.push({
        ...entry,
        id: `unresolved-${sourceMonth}-${withoutExtension(file).toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
        sourceMonth,
        reason: auditItem.reason ?? 'NO_EXIF_DATE'
      });
    }
    if (media.length > 0) groups.push({ sourceMonth, label: `Chưa xác định ngày · ${sourceMonth}`, media });
  }
  return groups;
}

export async function scanMemories({ projectRoot = process.cwd() } = {}) {
  const root = path.join(projectRoot, 'public', 'images', 'memories');
  const errors = [];
  const memories = [];
  if (!(await exists(root))) return { memories, unresolvedMedia: [], errors: [`Không tìm thấy thư mục: ${root}`] };

  const dimensions = await loadVariantManifest(projectRoot);
  const years = (await readdir(root, { withFileTypes: true })).filter((entry) => entry.isDirectory());
  for (const yearEntry of years) {
    const year = yearEntry.name;
    if (year === '_unresolved' || /^\d{4}-\d{2}$/.test(year)) continue;
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
        const memory = await scanDatedMemory({ projectRoot, year, month, day: dayEntry.name, errors, dimensions });
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
  const unresolvedMedia = await scanUnresolvedMedia({ projectRoot, dimensions, errors });
  return { memories, unresolvedMedia, errors };
}
