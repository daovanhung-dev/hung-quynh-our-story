import { access, readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

const IMAGE_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.avif', '.gif']);

function isValidDateParts(year, month, day) {
  if (!/^\d{4}$/.test(year) || !/^\d{2}$/.test(month) || !/^\d{2}$/.test(day)) return false;
  const iso = `${year}-${month}-${day}`;
  const date = new Date(`${iso}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === iso;
}

function naturalSort(values) {
  return [...values].sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));
}

async function readMetadata(filePath) {
  try {
    const source = await readFile(filePath, 'utf8');
    return JSON.parse(source);
  } catch (error) {
    if (error?.code === 'ENOENT') return {};
    throw new Error(`Metadata JSON không hợp lệ: ${filePath}\n${error.message}`);
  }
}

function normalizeImageSelection(metadataImages, availableImages) {
  if (!Array.isArray(metadataImages) || metadataImages.length === 0) {
    return availableImages.map((file) => ({ file }));
  }

  return metadataImages.map((item) => {
    if (typeof item === 'string') return { file: item };
    if (item && typeof item === 'object' && typeof item.file === 'string') return item;
    throw new Error('metadata.images chỉ chấp nhận tên file hoặc object có trường "file".');
  });
}

export async function scanMemories({ projectRoot = process.cwd() } = {}) {
  const root = path.join(projectRoot, 'public', 'images', 'memories');
  const errors = [];
  const memories = [];

  try {
    await access(root);
  } catch {
    return { memories, errors: [`Không tìm thấy thư mục: ${root}`] };
  }

  const years = (await readdir(root, { withFileTypes: true })).filter((entry) => entry.isDirectory());

  for (const yearEntry of years) {
    const year = yearEntry.name;
    const yearPath = path.join(root, year);
    const months = (await readdir(yearPath, { withFileTypes: true })).filter((entry) => entry.isDirectory());

    for (const monthEntry of months) {
      const month = monthEntry.name;
      const monthPath = path.join(yearPath, month);
      const days = (await readdir(monthPath, { withFileTypes: true })).filter((entry) => entry.isDirectory());

      for (const dayEntry of days) {
        const day = dayEntry.name;
        const dayPath = path.join(monthPath, day);
        const context = `${year}/${month}/${day}`;

        if (!isValidDateParts(year, month, day)) {
          errors.push(`[${context}] Folder phải đúng định dạng YYYY/MM/DD và là ngày hợp lệ.`);
          continue;
        }

        const files = await readdir(dayPath, { withFileTypes: true });
        const availableImages = naturalSort(
          files
            .filter((entry) => entry.isFile() && IMAGE_EXTENSIONS.has(path.extname(entry.name).toLowerCase()))
            .map((entry) => entry.name)
        );

        const metadataPath = path.join(dayPath, 'metadata.json');
        let metadata;
        try {
          metadata = await readMetadata(metadataPath);
        } catch (error) {
          errors.push(`[${context}] ${error.message}`);
          continue;
        }

        if (availableImages.length === 0) {
          if (Object.keys(metadata).length > 0) {
            errors.push(`[${context}] Có metadata.json nhưng không có ảnh.`);
          }
          continue;
        }

        let selectedImages;
        try {
          selectedImages = normalizeImageSelection(metadata.images, availableImages);
        } catch (error) {
          errors.push(`[${context}] ${error.message}`);
          continue;
        }

        for (const item of selectedImages) {
          if (!availableImages.includes(item.file)) {
            errors.push(`[${context}] metadata tham chiếu ảnh không tồn tại: ${item.file}`);
          }
        }

        const coverFile = metadata.cover ?? selectedImages[0]?.file ?? availableImages[0];
        if (!availableImages.includes(coverFile)) {
          errors.push(`[${context}] Cover không tồn tại: ${coverFile}`);
        }

        const date = `${year}-${month}-${day}`;
        const id = String(metadata.id ?? date).trim();
        if (!id) errors.push(`[${context}] id không được rỗng.`);

        const publicBase = `/images/memories/${year}/${month}/${day}`;
        const images = selectedImages
          .filter((item) => availableImages.includes(item.file))
          .map((item, index) => ({
            id: String(item.id ?? `${id}-${index + 1}`),
            src: `${publicBase}/${encodeURIComponent(item.file)}`,
            thumbnailSrc: item.thumbnail ? `${publicBase}/${encodeURIComponent(item.thumbnail)}` : undefined,
            alt: typeof item.alt === 'string' ? item.alt : undefined,
            caption: typeof item.caption === 'string' ? item.caption : undefined
          }));

        memories.push({
          id,
          date,
          title: typeof metadata.title === 'string' ? metadata.title : undefined,
          caption: typeof metadata.caption === 'string' ? metadata.caption : undefined,
          location: typeof metadata.location === 'string' ? metadata.location : undefined,
          cover: `${publicBase}/${encodeURIComponent(coverFile)}`,
          images,
          year: Number(year),
          month: Number(month),
          day: Number(day)
        });
      }
    }
  }

  const seen = new Set();
  for (const memory of memories) {
    if (seen.has(memory.id)) errors.push(`[${memory.date}] Trùng memory id: ${memory.id}`);
    seen.add(memory.id);
  }

  memories.sort((a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id));
  return { memories, errors };
}
