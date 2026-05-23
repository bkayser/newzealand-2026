export function classifyPhoto(width, height) {
  const aspect = width / height;

  if (aspect >= 2.0) return 'panorama';
  if (aspect >= 1.4) return 'landscape';
  if (aspect >= 0.85) return 'square';
  if (aspect >= 0.6) return 'portrait';
  return 'tall';
}

export function defaultLayout(format) {
  return {
    panorama: 'hero-fullbleed',
    landscape: 'centered-letterbox',
    square: 'centered-medium',
    portrait: 'split-with-text',
    tall: 'split-with-map',
  }[format];
}
