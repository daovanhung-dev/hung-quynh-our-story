import { mkdir, readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import convertHeic from 'heic-convert';
import sharp from 'sharp';

const PROJECT_ROOT = process.cwd();
const SOURCE_ROOT = path.join(PROJECT_ROOT, 'public', 'images', 'memories');
const GENERATED_ROOT = path.join(PROJECT_ROOT, 'public', 'images', 'generated', 'memories');
const IMAGE_EXTENSIONS = new Set([
  '.jpg', '.jpeg', '.png', '.webp', '.avif', '.gif', '.heic', '.heif'
]);

function isImage(file) {
  return IMAGE_EXTENSIONS.has(path.extname(file).toLowerCase());
}

function relativeSourcePath(filePath) {
  return path.relative(SOURCE_ROOT, filePath);
}

async function listImages(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const images = [];
  for (const entry of entries) {
    const filePath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'generated') continue;
      images.push(...await listImages(filePath));
    } else if (entry.isFile() && isImage(entry.name)) {
      images.push(filePath);
    }
  }
  return images;
}

async function openImage(filePath) {
  const extension = path.extname(filePath).toLowerCase();
  if (!['.heic', '.heif'].includes(extension)) return sharp(filePath).rotate();

  const inputBuffer = await readFile(filePath);
  const jpegBuffer = await convertHeic({
    buffer: inputBuffer,
    format: 'JPEG',
    quality: 1
  });
  return sharp(jpegBuffer).rotate();
}

async function writeVariant(image, outputPath, width, quality) {
  await mkdir(path.dirname(outputPath), { recursive: true });
  await image
    .clone()
    .resize({ width, withoutEnlargement: true })
    .webp({ quality })
    .toFile(outputPath);
}

async function variantsAreFresh(sourcePath, outputPaths) {
  try {
    const sourceStat = await stat(sourcePath);
    const outputStats = await Promise.all(outputPaths.map((outputPath) => stat(outputPath)));
    return outputStats.every((outputStat) => outputStat.mtimeMs >= sourceStat.mtimeMs);
  } catch {
    return false;
  }
}

const sourceFiles = await listImages(SOURCE_ROOT);
let generatedCount = 0;

async function processFile(filePath) {
  const relativePath = relativeSourcePath(filePath);
  const relativeDirectory = path.dirname(relativePath);
  const stem = path.basename(filePath, path.extname(filePath));
  const outputDirectory = path.join(GENERATED_ROOT, relativeDirectory);
  const thumbPath = path.join(outputDirectory, `${stem}-thumb.webp`);
  const mediumPath = path.join(outputDirectory, `${stem}-medium.webp`);
  const displayPath = path.join(outputDirectory, `${stem}.webp`);
  const outputPaths = ['.heic', '.heif'].includes(path.extname(filePath).toLowerCase())
    ? [thumbPath, mediumPath, displayPath]
    : [thumbPath, mediumPath];

  if (await variantsAreFresh(filePath, outputPaths)) {
    generatedCount += 1;
    return;
  }

  const image = await openImage(filePath);
  await writeVariant(image, thumbPath, 480, 82);
  await writeVariant(image, mediumPath, 1440, 86);

  if (['.heic', '.heif'].includes(path.extname(filePath).toLowerCase())) {
    await mkdir(outputDirectory, { recursive: true });
    await image.clone().webp({ quality: 88 }).toFile(displayPath);
  }

  generatedCount += 1;
}

const concurrency = Math.min(4, sourceFiles.length);
let nextIndex = 0;
async function worker() {
  while (nextIndex < sourceFiles.length) {
    const filePath = sourceFiles[nextIndex];
    nextIndex += 1;
    await processFile(filePath);
  }
}

await Promise.all(Array.from({ length: concurrency }, () => worker()));

console.log(`Generated media variants for ${generatedCount} images.`);
