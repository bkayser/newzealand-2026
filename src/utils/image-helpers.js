function webpName(filename) {
  return filename.replace(/\.[^.]+$/, '.webp');
}

export function photoSrc(filename, size = 'medium') {
  return `./photos/${size}/${webpName(filename)}`;
}

export function srcSet(filename) {
  const name = webpName(filename);
  return [
    `./photos/small/${name} 600w`,
    `./photos/medium/${name} 1200w`,
    `./photos/large/${name} 2400w`,
  ].join(', ');
}
