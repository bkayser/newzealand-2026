# New Zealand Travelogue — Project Plan
## A Scrollytelling Trip Recap with Mapbox + GSAP

This document is a working specification for an interactive scrollytelling presentation of a North Island New Zealand trip taken May 14–21, 2026. It is structured to serve as a Cursor prompt for code generation while also documenting the manual content-curation steps the author must perform.

**Target deliverable:** A single-page static site, hosted on GitHub Pages, that unfolds the trip as the user scrolls. Map fly-throughs between locations alternate with photo-driven activity chapters. The narrative is in the author's voice, past tense.

---

## TECHNICAL STACK

- **Build tool:** Vite (vanilla JS template — no framework)
- **Map:** Mapbox GL JS v3+ (cinematic camera animations, 3D terrain optional)
- **Scroll animation:** GSAP 3 + ScrollTrigger plugin
- **Image processing (build-time only):** Sharp (Node.js library for resizing and format conversion)
- **EXIF extraction (one-time script):** exifr (modern, fast EXIF parser)
- **Hosting:** GitHub Pages via GitHub Actions
- **Language:** Vanilla ES modules — no framework. The project is small enough that React/Svelte add overhead without meaningful benefit, and vanilla keeps the bundle tiny.

---

## PROJECT STRUCTURE

```
nz-travelogue/
├── index.html                          # Single page entry
├── package.json
├── vite.config.js
├── README.md
│
├── src/
│   ├── main.js                         # App entry, initialization
│   ├── styles.css                      # Global styles + format-driven layouts
│   ├── data/
│   │   └── chapters.js                 # Chapter content (narrative, photos, map config)
│   ├── modules/
│   │   ├── map-controller.js           # Mapbox wrapper, camera transitions
│   │   ├── scroll-controller.js        # ScrollTrigger setup, chapter transitions
│   │   ├── photo-panel.js              # Photo layout renderer (format-aware)
│   │   └── narrative-panel.js          # Text panel renderer
│   └── utils/
│       ├── image-helpers.js            # Responsive image src generation
│       └── format-classifier.js        # Photo aspect ratio → layout type
│
├── scripts/                            # Build-time Node scripts
│   ├── extract-metadata.js             # One-time: photos → metadata.json
│   └── optimize-images.js              # Generate responsive image sizes
│
├── public/
│   ├── photos/
│   │   ├── source/                     # Original photos (gitignored, local only)
│   │   ├── large/                      # 2400px wide WebP
│   │   ├── medium/                     # 1200px wide WebP
│   │   └── small/                      # 600px wide WebP (for placeholders)
│   └── data/
│       └── photo-metadata.json         # Generated index of all photos
│
└── .github/
    └── workflows/
        └── deploy.yml                   # GitHub Pages deployment
```

---

## CHAPTER STRUCTURE

The trip breaks into 15 activity-based chapters. Some chapters are photo-rich, others are narrative-only with a map fly-through. The author will assign their ~30 photos to chapters during content curation.

| # | Chapter ID | Title | Day | Location |
|---|---|---|---|---|
| 1 | `arrival-auckland` | Touchdown in Auckland | May 14 | Auckland CBD |
| 2 | `ted-ashby` | The Maritime Museum and Ted Ashby Cruise | May 14 | Viaduct Harbour |
| 3 | `tiritiri-matangi` | An Island of Lost Birds | May 15 | Tiritiri Matangi |
| 4 | `auckland-bus-tour` | Hop-on Hop-off Bus Tour | May 15 |
| 5 | `war-memorial-museum` | The War Memorial Museum | May 16 | Auckland Domain |
| 6 | `drive-north` | Heading North | May 16 | SH1 corridor |
| 7 | `dolphin-cruise` | Hole in the Rock | May 17 | Bay of Islands |
| 8 | `russell` | The Hell Hole of the Pacific | May 17 | Russell |
| 9 | `tane-mahuta` | Lord of the Forest | May 18 | Waipoua Forest |
| 10 | `black-labyrinth` | Underground River | May 19 | Waitomo Caves |
| 11 | `te-pa-tu` | A Māori Welcome | May 19 | Rotorua |
| 12 | `whakarewarewa-forest` | The Redwood Forest | May 20 | Rotorua |
| 13 | `wai-o-tapu` | The Champagne Pool | May 20 | Wai-O-Tapu |
| 14 | `waikite` | The Pools at Waikite | May 20 | Waikite Valley |
| 15 | `hamilton-gardens` | The Hamilton Gardens | May 21 | Hamilton |
| 16 | `departure` | Saying Goodbye | May 21 | Hamilton → Auckland |

---

## DATA MODEL

Each chapter is a JavaScript object in `src/data/chapters.js`:

```javascript
{
  id: 'dolphin-cruise',
  index: 6,
  day: 'May 17',
  title: 'Hole in the Rock',
  subtitle: 'Dolphins and dramatic sea arches in the Bay of Islands',
  
  // The narrative paragraph(s) shown alongside or before the photos
  narrative: [
    "We left Paihia at half past eight, the bay still glassy from the cool autumn night. The Fullers cruise threaded through the islands toward Cape Brett...",
    "By the time we reached the Hole in the Rock the wind was up and the swell had teeth. We didn't enter the arch but we got close enough to feel the spray."
  ],
  
  // Map camera state for this chapter's fly-to
  mapView: {
    center: [174.0833, -35.1833],    // [lng, lat]
    zoom: 11,
    pitch: 50,                        // 0 = top-down, 60 = oblique
    bearing: 0,                       // rotation in degrees
    duration: 4000,                   // ms for fly-to animation
    essential: true                   // animation completes even if user prefers reduced motion
  },
  
  // Whether map remains visible during photo panels or fully transitions away
  mapBehavior: 'transition',          // 'transition' | 'persist'
  
  // Photos assigned to this chapter (populated after content curation)
  photos: [
    {
      filename: 'IMG_2847.jpg',
      caption: 'Cape Brett lighthouse, just visible through the morning haze.',
      format: 'panorama',             // auto-classified, overridable
      layout: 'hero-fullbleed',       // auto-assigned from format, overridable
      alt: 'Cape Brett lighthouse on a rocky peninsula'
    }
  ]
}
```

---

## FORMAT-DRIVEN LAYOUT SYSTEM

Photos are classified by aspect ratio and assigned a default layout. The author can override any photo's layout in the data file.

### Classification Rules

```javascript
// src/utils/format-classifier.js
function classifyPhoto(width, height) {
  const aspect = width / height;
  
  if (aspect >= 2.0)        return 'panorama';     // very wide
  if (aspect >= 1.4)        return 'landscape';    // standard horizontal
  if (aspect >= 0.85)       return 'square';       // squarish
  if (aspect >= 0.6)        return 'portrait';     // standard vertical
  return 'tall';                                    // very tall
}
```

### Layout Mappings

| Format | Default Layout | Visual Treatment |
|---|---|---|
| `panorama` | `hero-fullbleed` | Edge-to-edge horizontal across viewport. Caption overlays bottom-left with subtle gradient scrim. |
| `landscape` | `centered-letterbox` | Centered with generous margins. Caption beneath in small caps. Subtle drop shadow. |
| `square` | `centered-medium` | Centered, ~70% viewport width. Caption beside on desktop, beneath on mobile. |
| `portrait` | `split-with-text` | Photo fills left half (or right), narrative text fills opposite half. On mobile stacks vertically. |
| `tall` | `split-with-map` | Photo fills one half, map miniature pinned to other half showing GPS pin from EXIF. On mobile stacks. |

### CSS Architecture

Each layout is a CSS class on the photo container. ScrollTrigger drives the transitions but the layout itself is pure CSS. This keeps the JS simpler and lets the browser handle responsive breakpoints.

```css
/* Photo container base */
.photo-panel {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
}

.photo-panel.hero-fullbleed {
  padding: 0;
}

.photo-panel.hero-fullbleed img {
  width: 100vw;
  height: 100vh;
  object-fit: cover;
}

.photo-panel.split-with-text {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 3rem;
}

@media (max-width: 768px) {
  .photo-panel.split-with-text,
  .photo-panel.split-with-map {
    grid-template-columns: 1fr;
  }
}

/* ...etc for each layout */
```

---

## SCROLL ARCHITECTURE — SEQUENTIAL MAP/PHOTOS PATTERN

The user scrolls top to bottom through 15 chapters. Each chapter follows the same rhythm:

```
[Map Panel: viewport-height container, sticky]
    ↓
    Map flies to chapter location (4 seconds, scrub-locked to scroll)
    Title and subtitle fade in over the map
    ↓
[Narrative Panel: 1-2 viewport heights, scrolls past map]
    ↓
    Map releases sticky position
    ↓
[Photo Panel(s): each is at least 1 viewport tall]
    ↓
    Each photo has its own entry animation (fade, scale, slide)
    Caption appears with slight delay
    ↓
[Transition Spacer: 50vh]
    ↓
[Next Map Panel: begins next chapter]
```

### ScrollTrigger Configuration

```javascript
// src/modules/scroll-controller.js
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
gsap.registerPlugin(ScrollTrigger);

export function initScrollMechanics(chapters, mapController) {
  chapters.forEach((chapter, index) => {
    const mapPanel = document.querySelector(`#map-${chapter.id}`);
    const photoPanels = document.querySelectorAll(`[data-chapter="${chapter.id}"].photo-panel`);
    
    // Map fly-to triggered when map panel enters viewport
    ScrollTrigger.create({
      trigger: mapPanel,
      start: 'top center',
      end: 'bottom center',
      onEnter: () => mapController.flyTo(chapter.mapView),
      onEnterBack: () => mapController.flyTo(chapter.mapView)
    });
    
    // Title fade in/out over map
    gsap.fromTo(`#title-${chapter.id}`,
      { opacity: 0, y: 30 },
      {
        opacity: 1,
        y: 0,
        scrollTrigger: {
          trigger: mapPanel,
          start: 'top 60%',
          end: 'top 20%',
          scrub: 1
        }
      }
    );
    
    // Each photo animates in on its own
    photoPanels.forEach(panel => {
      const img = panel.querySelector('img');
      const caption = panel.querySelector('.caption');
      
      gsap.fromTo(img,
        { opacity: 0, scale: 0.95 },
        {
          opacity: 1,
          scale: 1,
          duration: 1.2,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: panel,
            start: 'top 75%',
            toggleActions: 'play none none reverse'
          }
        }
      );
      
      gsap.fromTo(caption,
        { opacity: 0, y: 20 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          delay: 0.3,
          scrollTrigger: {
            trigger: panel,
            start: 'top 70%',
            toggleActions: 'play none none reverse'
          }
        }
      );
    });
  });
}
```

---

## MAP CONTROLLER

The Mapbox instance lives in a fixed-position container behind the content. It moves between chapter locations as the user scrolls. The map track (GPS trace of the route) draws progressively across all chapters.

### Key Features

- **Cinematic fly-to** using `map.flyTo()` with custom easing
- **Progressive track drawing** — the GPS polyline from Auckland through all stops draws a little more with each chapter
- **3D terrain** enabled for dramatic effect at Tane Mahuta and the geothermal valleys
- **Custom markers** for major locations using small circular badges

```javascript
// src/modules/map-controller.js
import mapboxgl from 'mapbox-gl';

export class MapController {
  constructor(containerId, accessToken) {
    mapboxgl.accessToken = accessToken;
    this.map = new mapboxgl.Map({
      container: containerId,
      style: 'mapbox://styles/mapbox/outdoors-v12',
      center: [174.7633, -36.8485],     // Auckland start
      zoom: 5.5,
      pitch: 0,
      bearing: 0
    });
    
    this.map.on('load', () => {
      this.add3DTerrain();
      this.addRouteSource();
      this.addChapterMarkers();
    });
  }
  
  add3DTerrain() {
    this.map.addSource('mapbox-dem', {
      type: 'raster-dem',
      url: 'mapbox://mapbox.mapbox-terrain-dem-v1',
      tileSize: 512,
      maxzoom: 14
    });
    this.map.setTerrain({ source: 'mapbox-dem', exaggeration: 1.5 });
  }
  
  addRouteSource() {
    // GPS coordinates for full trip route — populate from chapter coordinates
    this.map.addSource('route', {
      type: 'geojson',
      data: { type: 'Feature', geometry: { type: 'LineString', coordinates: [] }}
    });
    this.map.addLayer({
      id: 'route-line',
      type: 'line',
      source: 'route',
      paint: {
        'line-color': '#e63946',
        'line-width': 3,
        'line-opacity': 0.85
      }
    });
  }
  
  flyTo(mapView) {
    this.map.flyTo({
      center: mapView.center,
      zoom: mapView.zoom,
      pitch: mapView.pitch,
      bearing: mapView.bearing,
      duration: mapView.duration,
      essential: mapView.essential
    });
  }
  
  extendRouteTo(chapterIndex, allChapters) {
    // Progressively reveal the route line up through the current chapter
    const coordinates = allChapters
      .slice(0, chapterIndex + 1)
      .map(c => c.mapView.center);
    
    this.map.getSource('route').setData({
      type: 'Feature',
      geometry: { type: 'LineString', coordinates }
    });
  }
}
```

---

## CONTENT CURATION WORKFLOW

This is the manual work the author does. It happens in stages, interleaved with code phases.

### Stage 1: Photo Inventory (~30 min)

1. Copy all trip photos to `public/photos/source/`
2. Run `node scripts/extract-metadata.js`
3. Script outputs `public/data/photo-metadata.json` with one entry per photo containing:
   - filename
   - timestamp (from EXIF DateTimeOriginal)
   - GPS latitude/longitude (from EXIF GPSLatitude/GPSLongitude)
   - dimensions (width, height)
   - orientation (corrected to 1)
   - classified format (panorama/landscape/portrait/etc.)
   - suggested chapter assignment (based on timestamp + GPS proximity to chapter locations)

4. **Review the JSON manually.** Verify chapter assignments. Some photos may need manual reassignment.

### Stage 2: Image Optimization (~5 min, automated)

1. Run `node scripts/optimize-images.js`
2. Generates three sizes per photo (large 2400px, medium 1200px, small 600px) as WebP
3. Originals stay in `source/` (gitignored)
4. Optimized versions go to `large/`, `medium/`, `small/` (committed)

### Stage 3: Narrative Writing (~3–5 hours)

This is the heart of the work. For each of the 15 chapters, write:
- A 1–3 paragraph narrative in past tense, author's voice
- Photo captions (1 sentence each)
- Optional subtitle for the chapter title card

The chapter file at `src/data/chapters.js` is structured to make this comfortable to write inline. The itinerary document provides factual scaffolding — the writing turns it into a story.

**Recommended writing prompt for self:** "Tell this chapter as if to a friend over dinner. What stuck with you? What surprised you? What was the moment you remember?"

### Stage 4: Photo Assignment and Layout Tuning (~1 hour)

After the narrative is drafted:
1. Drop each photo into its chapter's `photos[]` array
2. Review the auto-assigned layout — override if a photo deserves different treatment (e.g., a particularly striking landscape might be promoted to `hero-fullbleed`)
3. Write the caption for each photo

---

## METADATA EXTRACTION SCRIPT

This is the first script Cursor should generate. It's the foundation for everything else.

```javascript
// scripts/extract-metadata.js
import { readdir, writeFile } from 'fs/promises';
import { join } from 'path';
import exifr from 'exifr';
import sharp from 'sharp';

const CHAPTER_LOCATIONS = [
  { id: 'arrival-auckland', lat: -36.8485, lng: 174.7633, name: 'Auckland CBD' },
  { id: 'maritime-museum', lat: -36.8431, lng: 174.7659, name: 'Maritime Museum' },
  { id: 'tiritiri-matangi', lat: -36.6011, lng: 174.8894, name: 'Tiritiri Matangi' },
  { id: 'war-memorial-museum', lat: -36.8602, lng: 174.7779, name: 'Auckland Museum' },
  { id: 'dolphin-cruise', lat: -35.2197, lng: 174.1083, name: 'Bay of Islands' },
  { id: 'russell', lat: -35.2624, lng: 174.1208, name: 'Russell' },
  { id: 'waitangi', lat: -35.2649, lng: 174.0825, name: 'Waitangi' },
  { id: 'tane-mahuta', lat: -35.6011, lng: 173.5283, name: 'Tane Mahuta' },
  { id: 'black-labyrinth', lat: -38.2611, lng: 175.1042, name: 'Waitomo' },
  { id: 'te-pa-tu', lat: -38.1369, lng: 176.2561, name: 'Te Pā Tū' },
  { id: 'wai-o-tapu', lat: -38.3503, lng: 176.3697, name: 'Wai-O-Tapu' },
  { id: 'waimangu', lat: -38.2833, lng: 176.3833, name: 'Waimangu' },
  { id: 'waikite', lat: -38.3272, lng: 176.3029, name: 'Waikite Valley' },
  { id: 'departure', lat: -37.8833, lng: 175.4667, name: 'Cambridge' }
];

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
    tall: 'split-with-map'
  }[format];
}

function haversine(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180) * Math.cos(lat2*Math.PI/180) * Math.sin(dLng/2)**2;
  return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

function nearestChapter(lat, lng) {
  let nearest = null;
  let minDist = Infinity;
  for (const c of CHAPTER_LOCATIONS) {
    const d = haversine(lat, lng, c.lat, c.lng);
    if (d < minDist) { minDist = d; nearest = c; }
  }
  return { chapter: nearest.id, distanceKm: minDist };
}

async function processPhoto(filepath) {
  const exif = await exifr.parse(filepath, { gps: true });
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
    lat, lng,
    width, height,
    format,
    suggestedLayout: suggestedLayout(format),
    suggestedChapter: suggestion?.chapter,
    distanceFromChapterKm: suggestion?.distanceKm
  };
}

async function main() {
  const sourceDir = './public/photos/source';
  const files = await readdir(sourceDir);
  const photos = [];
  
  for (const file of files) {
    if (!/\.(jpg|jpeg|png|heic)$/i.test(file)) continue;
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
    JSON.stringify(photos, null, 2)
  );
  console.log(`\nProcessed ${photos.length} photos.`);
}

main().catch(console.error);
```

---

## IMPLEMENTATION PHASES

Suggested order of work. Each phase ends in a runnable state so progress is verifiable.

### Phase 1: Scaffolding and Data Pipeline (1 session, ~2 hours)

**Outcomes:**
- Vite project initialized with vanilla template
- Dependencies installed (mapbox-gl, gsap, sharp, exifr)
- Project structure created per the spec above
- `extract-metadata.js` script written and tested with sample photos
- `chapters.js` skeleton with all 15 chapters defined (titles, locations, empty narrative/photos arrays)
- GitHub repo created, initial commit, GitHub Pages configured

**Cursor prompt focus:** Scaffolding the project, writing the EXIF script, defining the chapter data structure.

### Phase 2: Map Foundation (1 session, ~2 hours)

**Outcomes:**
- Mapbox account created, access token obtained
- Map renders with 3D terrain
- Custom markers placed at all 15 chapter locations
- GPS route polyline drawn across all chapters
- Manual `flyTo` calls work for testing

**Cursor prompt focus:** Mapbox initialization, terrain configuration, GeoJSON route handling.

### Phase 3: Scroll Mechanics (1 session, ~2 hours)

**Outcomes:**
- ScrollTrigger wired up to chapter sections
- Map flies to each chapter as the user scrolls past it
- Route progressively reveals as the user advances through the trip
- Title and subtitle fade in/out smoothly over the map

**Cursor prompt focus:** Scroll observer logic, map state synchronization, scroll-driven animations.

### Phase 4: Photo Panels and Format Layouts (1 session, ~2 hours)

**Outcomes:**
- All five layout types (`hero-fullbleed`, `centered-letterbox`, `centered-medium`, `split-with-text`, `split-with-map`) render correctly
- Photos fade and scale in as they enter the viewport
- Captions animate in slightly after photos
- Responsive image sources work (loads appropriate size for screen)

**Cursor prompt focus:** CSS Grid layouts, responsive images with `srcset`, GSAP entry animations.

### Phase 5: Content Population (multi-day, ~5 hours)

**Outcomes:**
- All narrative text written for 15 chapters
- All ~12 photos assigned to chapters with captions
- Layout overrides applied where needed
- Tweaks to map fly-to parameters (zoom, pitch, bearing) for cinematic effect

**Cursor prompt focus:** Minimal — this is mostly writing. Cursor helps with copy editing if asked.

### Phase 6: Polish and Deployment (1 session, ~2 hours)

**Outcomes:**
- Mobile testing on iOS/Android
- Performance tuning (image lazy loading, reduced motion respect, scroll throttling)
- GitHub Action deploys on push to main
- Open Graph metadata for link previews
- Final URL works, looks good on phone and desktop

**Cursor prompt focus:** GitHub Actions workflow, image preloading strategy, mobile breakpoints.

**Total estimated active time: 10–12 hours with agent assistance.**

---

## MANUAL CONFIGURATION STEPS

Things only the author can do — not delegatable to Cursor.

1. **Create Mapbox account.** Free tier covers 50k map loads/month. Sign up at mapbox.com, create an access token scoped to the GitHub Pages domain. Store in `.env` (gitignored) and reference in `vite.config.js`.

2. **Create GitHub repo.** Public is required for free GitHub Pages. Use repo name like `nz-2026` so the URL is `bkayser.github.io/nz-2026`.

3. **Configure GitHub Pages.** In repo settings → Pages → set source to "GitHub Actions" (not "Deploy from branch"). The Action will handle the build.

4. **Photos to source directory.** Drop all trip photos into `public/photos/source/`. Add this directory to `.gitignore` — originals don't need to be in the repo, only the optimized WebPs.

5. **Verify EXIF data.** Phone-shot photos almost always have GPS and timestamp. Camera-shot photos may not. For photos missing GPS, manually add lat/lng to the photo's entry in `photo-metadata.json` after extraction runs.

6. **Mapbox style customization (optional).** The default `outdoors-v12` style is good. For a more atmospheric look, create a custom style in Mapbox Studio — adjust water color, terrain shading, label fonts. Replace style URL in `map-controller.js`.

---

## OPEN QUESTIONS TO RESOLVE DURING BUILD

1. **Reduced motion.** Some users have `prefers-reduced-motion` enabled. The plan should respect this — disable map fly-tos (jump-cut instead), simplify photo entry animations to fades only. GSAP and Mapbox both support this.

2. **Audio.** Optional ambient audio per chapter (cicadas, ocean, geothermal hissing). Not in scope for v1 but easy to add later as a `<audio>` element triggered by ScrollTrigger.

3. **Sharing.** A single shareable URL is the goal. No chapter deep-linking initially — adds complexity without much benefit for the personal-share scope.

---

## STARTING PROMPT FOR CURSOR

When ready to begin, paste this into Cursor:

> I'm building a scrollytelling travelogue website for a New Zealand trip taken in May 2026. I'm using Mapbox GL JS for animated map fly-throughs and GSAP ScrollTrigger for photo presentation. The full project plan is in /docs/project-plan.md.
>
> Please start with Phase 1: project scaffolding. Specifically:
> 1. Initialize a Vite vanilla project
> 2. Install dependencies: mapbox-gl, gsap, sharp, exifr
> 3. Create the directory structure per the plan
> 4. Write scripts/extract-metadata.js per the spec in the plan
> 5. Create src/data/chapters.js with the 15 chapter skeleton (titles, IDs, locations, empty narrative and photos arrays)
> 6. Create an empty index.html and main.js that I can verify runs
>
> Show me each file as you create it. Don't worry about Mapbox token yet — placeholder is fine.

---

*Project plan compiled May 2026.*
