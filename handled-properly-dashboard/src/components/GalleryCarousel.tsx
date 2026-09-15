"use client";

import { useEffect, useState } from "react";
import type { GalleryItem } from "@/lib/blocks";
import styles from "./GalleryCarousel.module.css";

const AUTOPLAY_INTERVAL_MS = 5000;

// The interactive alternative to Gallery's static grid (see
// docs/adr/0021-gallery-carousel-option.md) -- arrow buttons and dots
// always work, with an optional auto-advance (docs/adr/0022-carousel-autoplay.md)
// that's always pausable and never blocks manual navigation.
export default function GalleryCarousel({
  items,
  imageUrls,
  autoplay,
}: {
  items: GalleryItem[];
  imageUrls: Record<string, string>;
  autoplay: boolean;
}) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const visibleItems = items.filter((item) => imageUrls[item.imagePath]);
  const canAutoplay = autoplay && visibleItems.length > 1;

  const goTo = (i: number) => setIndex((i + visibleItems.length) % visibleItems.length);

  // Depending on `index` here means any manual nav (a click on an arrow or
  // a dot, which calls goTo and so changes index) restarts the countdown
  // from that moment, rather than the next auto-advance landing a moment
  // later and feeling like the manual click did nothing.
  useEffect(() => {
    if (!canAutoplay || paused) return;
    const id = setInterval(() => setIndex((i) => (i + 1) % visibleItems.length), AUTOPLAY_INTERVAL_MS);
    return () => clearInterval(id);
  }, [canAutoplay, paused, index, visibleItems.length]);

  if (visibleItems.length === 0) return null;

  const current = visibleItems[index % visibleItems.length];

  return (
    <div className={styles.carousel}>
      <div className={styles.stage}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={imageUrls[current.imagePath]} alt={current.title ?? ""} className={styles.slideImage} />

        {visibleItems.length > 1 && (
          <>
            <button
              type="button"
              className={`${styles.arrow} ${styles.arrowPrev}`}
              aria-label="Previous image"
              onClick={() => goTo(index - 1)}
            >
              ‹
            </button>
            <button
              type="button"
              className={`${styles.arrow} ${styles.arrowNext}`}
              aria-label="Next image"
              onClick={() => goTo(index + 1)}
            >
              ›
            </button>
          </>
        )}

        {canAutoplay && (
          <button
            type="button"
            className={styles.playPause}
            aria-label={paused ? "Play slideshow" : "Pause slideshow"}
            onClick={() => setPaused((p) => !p)}
          >
            {paused ? "▶" : "❚❚"}
          </button>
        )}
      </div>

      {(current.title || current.caption) && (
        <div className={styles.caption}>
          {current.title && <p className={styles.captionTitle}>{current.title}</p>}
          {current.caption && <p className={styles.captionText}>{current.caption}</p>}
        </div>
      )}

      {visibleItems.length > 1 && (
        <div className={styles.dots}>
          {visibleItems.map((item, i) => (
            <button
              key={item.imagePath + i}
              type="button"
              className={`${styles.dot} ${i === index % visibleItems.length ? styles.dotActive : ""}`}
              aria-label={`Go to image ${i + 1}`}
              aria-current={i === index % visibleItems.length}
              onClick={() => goTo(i)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
