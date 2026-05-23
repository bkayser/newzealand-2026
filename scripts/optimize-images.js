import { readdir, mkdir } from 'fs/promises';
import { join, extname, basename } from 'path';
import sharp from 'sharp';

const SOURCE_DIR = 'public/photos/source';
const SUPPORTED = new Set(['.jpg', '.jpeg', '.JPG', '.JPEG', '.png', '.PNG', '.webp']);

const SIZES = [
  { name: 'large',  width: 2400 },
  { name: 'medium', width: 1200 },
  { name: 'small',  width: 600 },
];

async function ensureDirs() {
  for (const { name } of SIZES) {
    await mkdir(`public/photos/${name}`, { recursive: true });
  }
}

async function optimizeImage(filename) {
  const src = join(SOURCE_DIR, filename);
  const ext = extname(filename);
  const stem = basename(filename, ext);
  const outName = `${stem}.webp`;

  for (const { name, width } of SIZES) {
    const dest = join(`public/photos/${name}`, outName);
    try {
      await sharp(src)
        .resize(width, null, { withoutEnlargement: true })
        .webp({ quality: 85 })
        .toFile(dest);
      process.stdout.write(`  ✓ ${name}/${outName}\n`);
    } catch (err) {
      process.stderr.write(`  ⚠ ${name}/${filename}: ${err.message}\n`);
    }
  }
}

async function run() {
  await ensureDirs();
  const files = await readdir(SOURCE_DIR);
  const images = files.filter((f) => !f.startsWith('.') && SUPPORTED.has(extname(f)));

  if (images.length === 0) {
    console.log('No source images found in public/photos/source/');
    return;
  }

  console.log(`Optimizing ${images.length} source images…\n`);
  for (const file of images) {
    console.log(file);
    await optimizeImage(file);
  }
  console.log('\nDone.');
}

run().catch(console.error);
