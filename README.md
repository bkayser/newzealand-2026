# New Zealand 2026 — Travelogue

Interactive scrollytelling recap of a North Island trip (May 14–21, 2026). Built with Vite, Mapbox GL JS, and GSAP ScrollTrigger.

## Setup

```bash
npm install
cp .env.example .env   # add your Mapbox token
npm run dev
```

Open the URL shown in the terminal. You should see the map with a chapter fly-to panel (Phase 2).

### Mapbox token

1. Create a token at [mapbox.com](https://account.mapbox.com/access-tokens/)
2. Add it to `.env` as `VITE_MAPBOX_TOKEN=pk...`
3. Restart the dev server after changing `.env`

**Local dev:** If your token has URL restrictions scoped to `wkayser.github.io`, Mapbox returns 403 on `localhost` and tiles won't load. Either:
- Add `http://localhost:5173` to the token's allowed URLs in Mapbox Studio, or
- Use a separate unrestricted dev token locally (keep the restricted token for GitHub Pages)

For console testing after load: `mapController.flyToChapter(chapters[0])`

## Scripts

```bash
# Extract EXIF metadata from photos in public/photos/source/
npm run extract-metadata
```

## Project plan

See [docs/project-plan.md](docs/project-plan.md) for the full specification.
