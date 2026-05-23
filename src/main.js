import './styles.css';
import { chapters } from './data/chapters.js';
import { MapController } from './modules/map-controller.js';
import { initScrollMechanics } from './modules/scroll-controller.js';
import { renderPhotoPanel } from './modules/photo-panel.js';

// ── DOM construction ────────────────────────────────────────────────────────

function buildChapterSection(chapter) {
  const section = document.createElement('section');
  section.className = 'chapter-section';
  section.id = `chapter-${chapter.id}`;

  // Map trigger — full-viewport div that tells ScrollTrigger when to fly-to
  const mapTrigger = document.createElement('div');
  mapTrigger.className = 'map-trigger';
  mapTrigger.id = `map-${chapter.id}`;

  const titleCard = document.createElement('div');
  titleCard.className = 'title-card';
  titleCard.id = `title-${chapter.id}`;
  titleCard.innerHTML = `
    <span class="day-label">${chapter.day} &middot; ${chapter.location}</span>
    <h2 class="chapter-title">${chapter.title}</h2>
    ${chapter.subtitle ? `<p class="chapter-subtitle">${chapter.subtitle}</p>` : ''}
  `;
  mapTrigger.appendChild(titleCard);
  section.appendChild(mapTrigger);

  // Narrative panel — white background that slides over the map
  if (chapter.narrative.length > 0) {
    const narrativePanel = document.createElement('div');
    narrativePanel.className = 'narrative-panel';
    narrativePanel.id = `narrative-${chapter.id}`;
    narrativePanel.innerHTML = chapter.narrative.map((p) => `<p>${p}</p>`).join('');
    section.appendChild(narrativePanel);
  }

  // Photo panels
  chapter.photos.forEach((photo) => {
    section.appendChild(renderPhotoPanel(photo, chapter.id));
  });

  // Transition spacer — transparent window back onto the map before next chapter
  const spacer = document.createElement('div');
  spacer.className = 'transition-spacer';
  section.appendChild(spacer);

  return section;
}

function buildScrollContent() {
  const container = document.getElementById('scroll-content');

  // Opening hero — full viewport before chapter 1 begins
  const hero = document.createElement('header');
  hero.className = 'site-hero';
  hero.innerHTML = `
    <div class="hero-inner">
      <p class="hero-eyebrow">May 2026</p>
      <h1 class="hero-title">New Zealand</h1>
      <p class="hero-subtitle">A travelogue of the North Island</p>
      <p class="hero-cta">Scroll to begin</p>
    </div>
  `;
  container.appendChild(hero);

  chapters.forEach((chapter) => {
    container.appendChild(buildChapterSection(chapter));
  });

  // Closing footer
  const footer = document.createElement('footer');
  footer.className = 'site-footer';
  footer.innerHTML = `<p>New Zealand &mdash; May 14&ndash;21, 2026</p>`;
  container.appendChild(footer);
}

// ── Bootstrap ────────────────────────────────────────────────────────────────

buildScrollContent();

const token = import.meta.env.VITE_MAPBOX_TOKEN;
const mapController = new MapController('map', token, chapters);

mapController.ready.then(() => {
  initScrollMechanics(chapters, mapController);
  console.log('Phase 4 ready — scroll to explore.');
});

mapController.ready.catch((err) => {
  console.error('Map failed to load:', err.message);
});

export { mapController, chapters };
