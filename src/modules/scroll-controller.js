import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export function initScrollMechanics(chapters, mapController) {
  chapters.forEach((chapter, index) => {
    const mapTrigger = document.getElementById(`map-${chapter.id}`);
    const titleCard = document.getElementById(`title-${chapter.id}`);

    if (!mapTrigger) return;

    // Fly to chapter location and extend route when its map panel enters the viewport
    ScrollTrigger.create({
      trigger: mapTrigger,
      start: 'top center',
      end: 'bottom center',
      onEnter: () => {
        mapController.flyTo(chapter.mapView);
        mapController.extendRouteTo(index, chapters);
      },
      onEnterBack: () => {
        mapController.flyTo(chapter.mapView);
        mapController.extendRouteTo(index, chapters);
      },
    });

    // Title card fades and rises as the map trigger scrolls into view
    if (titleCard) {
      gsap.fromTo(
        titleCard,
        { opacity: 0, y: 40 },
        {
          opacity: 1,
          y: 0,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: mapTrigger,
            start: 'top 65%',
            end: 'top 20%',
            scrub: 1,
          },
        },
      );
    }

    // Photo panels — populated in Phase 4; wired now so they animate when photos exist
    const photoPanels = document.querySelectorAll(
      `[data-chapter="${chapter.id}"].photo-panel`,
    );

    photoPanels.forEach((panel) => {
      const img = panel.querySelector('img');
      const caption = panel.querySelector('.caption');

      if (img) {
        gsap.fromTo(
          img,
          { opacity: 0, scale: 0.95 },
          {
            opacity: 1,
            scale: 1,
            duration: 1.2,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: panel,
              start: 'top 75%',
              toggleActions: 'play none none reverse',
            },
          },
        );
      }

      if (caption) {
        gsap.fromTo(
          caption,
          { opacity: 0, y: 20 },
          {
            opacity: 1,
            y: 0,
            duration: 0.8,
            delay: 0.3,
            scrollTrigger: {
              trigger: panel,
              start: 'top 70%',
              toggleActions: 'play none none reverse',
            },
          },
        );
      }
    });
  });
}
