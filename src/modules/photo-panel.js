import { photoSrc, srcSet } from '../utils/image-helpers.js';

/**
 * Builds and returns a populated .photo-panel element.
 * @param {object} photo  - photo entry from chapters.js
 * @param {string} chapterId
 */
export function renderPhotoPanel(photo, chapterId) {
  const layout = photo.layout ?? 'centered-letterbox';

  const panel = document.createElement('div');
  panel.className = `photo-panel ${layout}`;
  panel.dataset.chapter = chapterId;

  const loadSize = layout === 'hero-fullbleed' ? 'large' : 'medium';

  const img = buildImg(photo, loadSize);
  const caption = photo.caption ? buildCaption(photo.caption) : null;

  if (layout === 'hero-fullbleed') {
    panel.appendChild(img);
    if (caption) panel.appendChild(caption);
  } else if (layout === 'split-with-text' || layout === 'split-with-map') {
    const photoSide = document.createElement('div');
    photoSide.className = 'split-photo';
    photoSide.appendChild(img);

    const textSide = document.createElement('div');
    textSide.className = 'split-text';
    if (caption) textSide.appendChild(caption);

    panel.appendChild(photoSide);
    panel.appendChild(textSide);
  } else {
    // centered-letterbox, centered-medium
    const inner = document.createElement('div');
    inner.className = 'photo-inner';
    inner.appendChild(img);
    if (caption) inner.appendChild(caption);
    panel.appendChild(inner);
  }

  return panel;
}

function buildImg(photo, size) {
  const img = document.createElement('img');
  img.src = photoSrc(photo.filename, size);
  img.srcset = srcSet(photo.filename);
  img.sizes = '(max-width: 768px) 100vw, 90vw';
  img.alt = photo.alt ?? '';
  img.loading = 'lazy';
  img.decoding = 'async';
  return img;
}

function buildCaption(text) {
  const p = document.createElement('p');
  p.className = 'caption';
  p.textContent = text;
  return p;
}
