import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

export class MapController {
  constructor(containerId, accessToken, chapters = []) {
    this.chapters = chapters;
    this.markers = [];

    if (!accessToken) {
      console.warn(
        'Mapbox access token missing. Add VITE_MAPBOX_TOKEN to a .env file (see .env.example).',
      );
    }

    mapboxgl.accessToken = accessToken || '';

    this.map = new mapboxgl.Map({
      container: containerId,
      style: 'mapbox://styles/mapbox/outdoors-v12',
      center: [174.7633, -36.8485],
      zoom: 5.5,
      pitch: 0,
      bearing: 0,
      antialias: true,
    });

    this.ready = new Promise((resolve, reject) => {
      let settled = false;

      const fail = (message) => {
        if (settled) return;
        settled = true;
        reject(new Error(message));
      };

      this.map.on('error', (event) => {
        const status = event?.error?.status ?? null;
        // Some tile requests 403 individually while the base map still loads.
        if (status === 403 && !this.map.isStyleLoaded()) {
          fail(
            `Mapbox returned 403 Forbidden on ${window.location.origin}. `
            + 'Check token URL restrictions include this origin.',
          );
        }
      });

      this.map.on('load', () => {
        if (settled) return;
        try {
          try {
            this.add3DTerrain();
          } catch (terrainErr) {
            console.warn('3D terrain unavailable:', terrainErr);
          }
          this.addRouteSource();
          this.addChapterMarkers();
          this.setFullRoute(chapters);
          settled = true;
          resolve(this);
        } catch (err) {
          fail(err?.message ?? String(err));
        }
      });
    });
  }

  add3DTerrain() {
    this.map.addSource('mapbox-dem', {
      type: 'raster-dem',
      url: 'mapbox://mapbox.mapbox-terrain-dem-v1',
      tileSize: 512,
      maxzoom: 14,
    });
    this.map.setTerrain({ source: 'mapbox-dem', exaggeration: 1.5 });
  }

  addRouteSource() {
    this.map.addSource('route', {
      type: 'geojson',
      data: {
        type: 'Feature',
        properties: {},
        geometry: { type: 'LineString', coordinates: [] },
      },
    });

    this.map.addLayer({
      id: 'route-line',
      type: 'line',
      source: 'route',
      layout: {
        'line-join': 'round',
        'line-cap': 'round',
      },
      paint: {
        'line-color': '#e63946',
        'line-width': 3,
        'line-opacity': 0.85,
      },
    });
  }

  addChapterMarkers() {
    this.chapters.forEach((chapter) => {
      const el = document.createElement('button');
      el.type = 'button';
      el.className = 'chapter-marker';
      el.title = chapter.title;
      el.setAttribute('aria-label', chapter.title);
      el.textContent = String(chapter.index);

      const marker = new mapboxgl.Marker({ element: el })
        .setLngLat(chapter.mapView.center)
        .addTo(this.map);

      this.markers.push(marker);
    });
  }

  flyTo(mapView) {
    this.map.flyTo({
      center: mapView.center,
      zoom: mapView.zoom,
      pitch: mapView.pitch,
      bearing: mapView.bearing,
      duration: mapView.duration,
      essential: mapView.essential,
    });
  }

  flyToChapter(chapter) {
    this.flyTo(chapter.mapView);
  }

  setFullRoute(allChapters) {
    const coordinates = allChapters.map((chapter) => chapter.mapView.center);

    this.map.getSource('route').setData({
      type: 'Feature',
      properties: {},
      geometry: { type: 'LineString', coordinates },
    });
  }

  extendRouteTo(chapterIndex, allChapters) {
    const coordinates = allChapters
      .slice(0, chapterIndex + 1)
      .map((chapter) => chapter.mapView.center);

    this.map.getSource('route').setData({
      type: 'Feature',
      properties: {},
      geometry: { type: 'LineString', coordinates },
    });
  }
}
