import { scanMemories } from './lib/memory-scanner.mjs';

const { memories, errors } = await scanMemories();

if (errors.length > 0) {
  console.error('\nMemory validation failed:\n');
  for (const error of errors) console.error(`  - ${error}`);
  process.exitCode = 1;
} else {
  const imageCount = memories.reduce((total, memory) => total + memory.images.length, 0);
  console.log(`Memory validation OK: ${memories.length} memories, ${imageCount} images.`);
}
