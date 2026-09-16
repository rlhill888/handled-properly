"use client";

import { useEffect, useRef, useState, type CSSProperties, type MouseEvent } from "react";
import ScrollReveal from "@/components/ScrollReveal";
import styles from "./FeaturedEvents.module.css";
import type { BlogPostSummary } from "@/lib/data/site-content";

function Card({ post, index, hidden }: { post: BlogPostSummary; index: number; hidden?: boolean }) {
  return (
    <a
      href={`/events/${post.slug}`}
      className={styles.card}
      aria-hidden={hidden || undefined}
      tabIndex={hidden ? -1 : undefined}
    >
      <div className={styles.thumb}>
        {post.coverImageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={post.coverImageUrl} alt="" className={styles.thumbImage} />
        ) : (
          <span className={styles.thumbIndex}>{String(index + 1).padStart(2, "0")}</span>
        )}
        <span className={styles.sheen} aria-hidden="true" style={{ animationDelay: `${(index % 6) * 0.9}s` }} />
      </div>
      <div className={styles.cardFooter}>
        <div>
          <p className={styles.cardTitle}>{post.title}</p>
          {post.category && <p className={styles.cardCategory}>{post.category}</p>}
        </div>
        <span className={styles.cardArrow} aria-hidden="true">
          →
        </span>
      </div>
    </a>
  );
}

function MobileCard({
  post,
  index,
  isActive,
  onSelect,
  hidden,
}: {
  post: BlogPostSummary;
  index: number;
  isActive: boolean;
  onSelect: (event: MouseEvent<HTMLAnchorElement>) => void;
  hidden?: boolean;
}) {
  return (
    <a
      href={`/events/${post.slug}`}
      className={`${styles.mobileCard} ${isActive ? styles.mobileCardActive : ""}`}
      onClick={onSelect}
      aria-hidden={hidden || undefined}
      tabIndex={hidden ? -1 : undefined}
    >
      <div className={styles.mobileThumb}>
        {post.coverImageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={post.coverImageUrl} alt="" className={styles.mobileImage} />
        ) : null}
        {/* Same ambient, looping sheen as the desktop marquee's .sheen --
            .mobileCard's own clip-path clips it to the rhombus shape for
            free, no separate mobile-specific version needed. Staggered
            per tile so they don't all catch the light at once while the
            strip auto-slides. */}
        <span className={styles.sheen} aria-hidden="true" style={{ animationDelay: `${(index % 6) * 0.9}s` }} />
      </div>
    </a>
  );
}

// The centered, full-screen "expanded" view of a tapped event: a separate
// overlay rather than growing the in-flow tile in place, so it can be sized
// and centered against the viewport (not the scroll strip) while staying a
// rhombus, and so opening it never resizes the strip underneath.
function MobileExpandedEvent({ post, onClose }: { post: BlogPostSummary; onClose: () => void }) {
  return (
    <>
      <div className={styles.mobileExpandBackdrop} onClick={onClose} />
      <a href={`/events/${post.slug}`} className={styles.mobileExpandedCard}>
        <div className={styles.mobileExpandedThumb}>
          {post.coverImageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={post.coverImageUrl} alt="" className={styles.mobileImage} />
          ) : null}
          <span className={styles.mobileSheen} aria-hidden="true" />
        </div>
        <div className={styles.mobileExpandedFooter}>
          <div>
            <p className={styles.cardTitle}>{post.title}</p>
            {post.category && <p className={styles.cardCategory}>{post.category}</p>}
          </div>
          <span className={styles.cardArrow} aria-hidden="true">
            →
          </span>
        </div>
      </a>
    </>
  );
}

export default function FeaturedEvents({ posts }: { posts: BlogPostSummary[] }) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  // viewportRef is the scrollable element (what a manual swipe scrolls);
  // trackRef is the flex row inside it that the ambient auto-slide moves
  // via CSS transform. Splitting them keeps native touch-scrolling intact
  // for a manual swipe while the ambient animation runs on a separate,
  // sub-pixel-precise channel -- see the effect below for why.
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const trackRef = useRef<HTMLDivElement | null>(null);
  const positionRef = useRef(0);
  const hasPosts = posts.length > 0;
  // Once the user actually swipes the strip themselves, the ambient
  // auto-slide stops for good rather than fighting their input or
  // resuming later -- from that point it's a normal manually-scrolled
  // strip.
  const [autoSlideStopped, setAutoSlideStopped] = useState(false);

  // Ambient auto-slide: loops the strip endlessly in one direction,
  // driven by a CSS transform rather than scrollLeft. scrollLeft only
  // stores whole pixels, so a slow, sub-1px-per-frame increment rounds
  // down to nothing every frame and the strip visibly stutters; transform
  // has no such rounding and animates smoothly. The track below renders
  // the post list twice back to back, and this wraps position by exactly
  // half its width once it's scrolled a full copy -- the same seamless-
  // loop technique as the desktop marquee, rather than bouncing back and
  // forth (which showed a sliver of blank page at each turnaround, since
  // the strip doesn't quite reach the true edge there). Pauses while a
  // card is expanded and resumes after, but stops permanently the moment
  // the user swipes it manually (see handleMobileScroll).
  useEffect(() => {
    if (!hasPosts || expandedId || autoSlideStopped) return;
    if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    const speed = 26; // px/second -- a slow drift, not a fast marquee
    let raf = 0;
    let last = performance.now();

    function step(now: number) {
      const dt = now - last;
      last = now;
      const track = trackRef.current;
      if (track) {
        const half = track.scrollWidth / 2; // width of one (of the two) copies
        if (half > 0) {
          let position = positionRef.current + speed * (dt / 1000);
          if (position >= half) {
            position -= half; // wraps invisibly -- the duplicate copy is right there
          }
          positionRef.current = position;
          track.style.transform = `translateX(${-position}px)`;
        }
      }
      raf = requestAnimationFrame(step);
    }

    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [hasPosts, expandedId, autoSlideStopped]);

  function handleMobileSelect(event: MouseEvent<HTMLAnchorElement>, postId: string) {
    // The in-flow tile never navigates directly -- it only opens (or, if
    // already open, closes) the centered overlay, which has its own link.
    event.preventDefault();
    setExpandedId((current) => (current === postId ? null : postId));
  }

  function handleMobileScroll() {
    if (autoSlideStopped) return;
    // The ambient slide never touches scrollLeft (it moves the track via
    // transform instead), so scrollLeft is otherwise always exactly where
    // it started -- any scroll event here can only be the user swiping.
    // Fold the transform offset into real scrollLeft so the strip doesn't
    // jump, then hand off to native scrolling for good.
    const viewport = viewportRef.current;
    const track = trackRef.current;
    if (!viewport) return;
    viewport.scrollLeft += positionRef.current;
    if (track) track.style.transform = "";
    setAutoSlideStopped(true);
  }

  if (!hasPosts) return null;

  const expandedPost = posts.find((post) => post.id === expandedId) ?? null;

  return (
    <section className={styles.section}>
      {/* Same drifting wave/grid line-art as the "Every detail" card,
          Hero, and the closing CTA -- mobile only (hidden via CSS at
          desktop widths, where this section's background stays white and
          these light strokes wouldn't show against it anyway; see the
          media query in this file's CSS). */}
      <svg
        className={styles.art}
        viewBox="0 0 800 500"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden="true"
      >
        <path
          className={`${styles.wave} ${styles.wave1}`}
          d="M -50 340 C 150 260, 300 420, 500 300 C 650 220, 750 280, 850 240"
          stroke="rgba(255,255,255,0.14)"
          strokeWidth="2"
          fill="none"
        />
        <path
          className={`${styles.wave} ${styles.wave2}`}
          d="M -50 380 C 150 300, 300 460, 500 340 C 650 260, 750 320, 850 280"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth="2"
          fill="none"
        />
        <g stroke="rgba(255,255,255,0.06)" strokeWidth="1">
          {Array.from({ length: 9 }).map((_, i) => (
            <line key={`v-${i}`} x1={i * 100} y1="0" x2={i * 100} y2="500" />
          ))}
          {Array.from({ length: 6 }).map((_, i) => (
            <line key={`h-${i}`} x1="0" y1={i * 100} x2="800" y2={i * 100} />
          ))}
        </g>
      </svg>

      {/* .introReveal overrides how much ScrollReveal's fade actually
          fades (see its rule in this file's CSS) -- this section
          deliberately peeks a sliver above the fold on mobile before any
          scroll (see HeroPeekAdjuster), which put this intro right at the
          edge of the reveal's progress range on load. The default
          0-opacity start rendered it "stuck" at a low, arbitrary, ghosted
          opacity there instead of either hidden or visible. Starting the
          fade from a deliberate, always-legible minimum instead of 0
          keeps the reveal animation for a normal scroll-in from below,
          without that broken-looking in-between state during the peek. */}
      <ScrollReveal className={`${styles.intro} ${styles.introReveal}`}>
        <p className={styles.eyebrow}>
          <span className={styles.eyebrowLine} />
          FEATURED EVENTS
        </p>
        <h2 className={styles.heading}>
          Events that
          <br />
          leave a mark.
        </h2>
        <a href="/events" className={styles.exploreLink}>
          Explore All Events
          <span aria-hidden="true">↗</span>
        </a>
      </ScrollReveal>

      {/* Continuously-scrolling marquee, same on mobile and desktop. The
          track renders the post list twice back to back and animates left
          by exactly 50% of its own width, so the loop point is seamless --
          the visible cards never jump or reset. The duplicate copy is
          aria-hidden/untabbable since it's the same events again, purely
          for the visual loop. */}
      <div className={styles.carousel}>
        <div
          className={styles.track}
          style={{ "--marquee-duration": `${posts.length * 6}s` } as CSSProperties}
        >
          {posts.map((post, index) => (
            <Card key={post.id} post={post} index={index} />
          ))}
          {posts.map((post, index) => (
            <Card key={`dup-${post.id}`} post={post} index={index} hidden />
          ))}
        </div>
      </div>

      {/* Mobile: a tap-to-expand diagonal strip instead of the marquee.
          Tiles are clipped into parallelograms (not skewed -- the photo
          itself stays upright) and overlapped with a negative margin so
          the diagonal cuts line up edge-to-edge; the strip itself is
          full-bleed so the outer tiles run off the actual screen edge.
          It loops endlessly on its own (the list renders twice back to
          back, same as the desktop marquee); tapping a tile opens a
          separate centered overlay (still a rhombus) with the event
          description, and dims the tile behind it. Tapping either copy of
          a tile opens the same overlay, since both share the same post
          id. */}
      <div className={styles.mobileCarousel} ref={viewportRef} onScroll={handleMobileScroll}>
        <div className={styles.mobileTrack} ref={trackRef}>
          {posts.map((post, index) => (
            <MobileCard
              key={post.id}
              post={post}
              index={index}
              isActive={expandedId === post.id}
              onSelect={(event) => handleMobileSelect(event, post.id)}
            />
          ))}
          {posts.map((post, index) => (
            <MobileCard
              key={`dup-${post.id}`}
              post={post}
              index={index}
              isActive={expandedId === post.id}
              onSelect={(event) => handleMobileSelect(event, post.id)}
              hidden
            />
          ))}
        </div>
      </div>

      {expandedPost && (
        <MobileExpandedEvent post={expandedPost} onClose={() => setExpandedId(null)} />
      )}
    </section>
  );
}
