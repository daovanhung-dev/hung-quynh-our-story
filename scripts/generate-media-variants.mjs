import { mkdir, readdir, readFile, rm, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import convertHeic from 'heic-convert';
import sharp from 'sharp';

const PROJECT_ROOT = process.cwd();
const SOURCE_ROOT = path.join(PROJECT_ROOT, 'public', 'images', 'memories');
const GENERATED_ROOT = path.join(PROJECT_ROOT, 'public', 'images', 'generated', 'memories');
const MANIFEST_PATH = path.join(GENERATED_ROOT, 'media-manifest.json');
const IMAGE_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.avif', '.gif', '.heic', '.heif']);
const VARIANTS = [
  { suffix: '-thumb.webp', width: 480, quality: 82 },
  { suffix: '-display.webp', width: 960, quality: 84 },
  { suffix: '-medium.webp', width: 1440, quality: 86 }
];

function isImage(file) {
  return IMAGE_EXTENSIONS.has(path.extname(file).toLowerCase());
}

function normalizedRelativePath(filePath) {
  return path.relative(SOURCE_ROOT, filePath).split(path.sep).join('/');
}

async function listImages(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const images = [];
  for (const entry of entries) {
    const filePath = path.join(directory, entry.name);
    if (entry.isDirectory()) images.push(...await listImages(filePath));
    else if (entry.isFile() && isImage(entry.name)) images.push(filePath);
  }
  return images;
}

async function listFiles(directory) {
  try {
    const entries = await readdir(directory, { withFileTypes: true });
    const files = [];
    for (const entry of entries) {
      const filePath = path.join(directory, entry.name);
      if (entry.isDirectory()) files.push(...await listFiles(filePath));
      else if (entry.isFile()) files.push(filePath);
    }
    return files;
  } catch (error) {
    if (error?.code === 'ENOENT') return [];
    throw error;
  }
}

async function openImage(filePath) {
  const extension = path.extname(filePath).toLowerCase();
  if (!['.heic', '.heif'].includes(extension)) return sharp(filePath).rotate();

  const inputBuffer = await readFile(filePath);
  const jpegBuffer = await convertHeic({ buffer: inputBuffer, format: 'JPEG', quality: 1 });
  return sharp(jpegBuffer).rotate();
}

async function writeVariant(image, outputPath, width, quality) {
  await mkdir(path.dirname(outputPath), { recursive: true });
  await image.clone().resize({ width, withoutEnlargement: true }).webp({ quality }).toFile(outputPath);
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
const allowedOutputs = new Set([MANIFEST_PATH]);
const dimensions = {};
let generatedCount = 0;

async function processFile(filePath) {
  const relativePath = normalizedRelativePath(filePath);
  const relativeDirectory = path.dirname(relativePath);
  const stem = path.basename(filePath, path.extname(filePath));
  const outputDirectory = path.join(GENERATED_ROOT, relativeDirectory);
  const outputPaths = VARIANTS.map((variant) => path.join(outputDirectory, `${stem}${variant.suffix}`));
  outputPaths.forEach((outputPath) => allowedOutputs.add(outputPath));

  if (!(await variantsAreFresh(filePath, outputPaths))) {
    const image = await openImage(filePath);
    await Promise.all(VARIANTS.map((variant, index) => writeVariant(image, outputPaths[index], variant.width, variant.quality)));
  }

  const metadata = await sharp(outputPaths[2]).metadata();
  if (!metadata.width || !metadata.height) throw new Error(`Không đọc được kích thước ảnh: ${relativePath}`);
  dimensions[relativePath] = { width: metadata.width, height: metadata.height };
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
await mkdir(GENERATED_ROOT, { recursive: true });
await writeFile(MANIFEST_PATH, `${JSON.stringify({ version: 1, dimensions }, null, 2)}\n`, 'utf8');

const staleFiles = (await listFiles(GENERATED_ROOT)).filter((filePath) => !allowedOutputs.has(filePath));
await Promise.all(staleFiles.map((filePath) => rm(filePath)));

console.log(`Generated responsive variants for ${generatedCount} images; removed ${staleFiles.length} stale files.`);
