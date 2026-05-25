import { readdir, writeFile } from 'fs/promises';
import { join } from 'path';
import exifr from 'exifr';
import sharp from 'sharp';
import { chapters } from '../src/data/chapters.js';

const CHAPTER_LOCATIONS = chapters.map((chapter) => ({
  id: chapter.id,
  lat: chapter.mapView.center[1],
  lng: chapter.mapView.center[0],
  name: chapter.location,
}));

function classifyFormat(width, height) {
  const aspect = width / height;
  if (aspect >= 2.0) return 'panorama';
  if (aspect >= 1.4) return 'landscape';
  if (aspect >= 0.85) return 'square';
  if (aspect >= 0.6) return 'portrait';
  return 'tall';
}

function suggestedLayout(format) {
  return {
    panorama: 'hero-fullbleed',
    landscape: 'centered-letterbox',
    square: 'centered-medium',
    portrait: 'split-with-text',
    tall: 'split-with-map',
  }[format];
}

function haversine(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2
    + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function nearestChapter(lat, lng) {
  let nearest = null;
  let minDist = Infinity;
  for (const c of CHAPTER_LOCATIONS) {
    const d = haversine(lat, lng, c.lat, c.lng);
    if (d < minDist) {
      minDist = d;
      nearest = c;
    }
  }
  return { chapter: nearest.id, distanceKm: minDist };
}

async function processPhoto(filepath) {
  // EXIF is best-effort — WebP and some PNGs aren't supported by exifr.
  let exif = null;
  try {
    exif = await exifr.parse(filepath, { gps: true });
  } catch {
    exif = null;
  }
  const metadata = await sharp(filepath).metadata();

  const lat = exif?.latitude ?? null;
  const lng = exif?.longitude ?? null;
  const timestamp = exif?.DateTimeOriginal?.toISOString() ?? null;
  const width = metadata.width;
  const height = metadata.height;
  const format = classifyFormat(width, height);

  const suggestion = (lat && lng) ? nearestChapter(lat, lng) : null;

  return {
    filename: filepath.split('/').pop(),
    timestamp,
    lat,
    lng,
    width,
    height,
    format,
    suggestedLayout: suggestedLayout(format),
    suggestedChapter: suggestion?.chapter,
    distanceFromChapterKm: suggestion?.distanceKm,
  };
}

async function main() {
  const sourceDir = './public/photos/source';
  const files = await readdir(sourceDir);
  const photos = [];

  for (const file of files) {
    if (!/\.(jpg|jpeg|png|heic|webp)$/i.test(file)) continue;
    try {
      const result = await processPhoto(join(sourceDir, file));
      photos.push(result);
      console.log(`✓ ${file}: ${result.format} → ${result.suggestedChapter}`);
    } catch (err) {
      console.error(`✗ ${file}: ${err.message}`);
    }
  }

  photos.sort((a, b) => (a.timestamp || '').localeCompare(b.timestamp || ''));

  await writeFile(
    './public/data/photo-metadata.json',
    JSON.stringify(photos, null, 2),
  );
  console.log(`\nProcessed ${photos.length} photos.`);
}

main().catch(console.error);
