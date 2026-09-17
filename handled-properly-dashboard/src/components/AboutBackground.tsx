import type { CSSProperties } from "react";
import styles from "./AboutBackground.module.css";

// A full-viewport, abstract black-and-white backdrop for the About &
// Connect page: two diagonal corner clusters (top-right, bottom-left)
// rather than shapes scattered across the whole canvas -- each cluster
// mixes a couple of large, soft blurred gray bands bleeding off the
// corner with a handful of crisp diamonds (a large and a small hollow
// outline, plus a couple of tiny solid black accents), leaving the
// middle of the page clean. Every shape drifts on its own slow,
// independent loop so the composition keeps moving rather than reading
// as a fixed graphic -- fixed like AmbientBackground (which this page
// also renders) so it stays parked in the viewport while content scrolls
// over it.
//
// Each shape is a positioned wrapper (top/right/bottom/left -- animated
// with a translate-only drift) around an inner <span> that carries the
// shape's own static rotation/appearance. Keeping rotation off the
// wrapper matters: the drift animation sets `transform` on the wrapper
// too, and a CSS animation's keyframes replace the whole transform value
// rather than merging with an inline one -- a rotate() set on the same
// element as the animation would just get overwritten.
type Shape = {
  type: "band" | "outlineLg" | "outlineSm" | "solidXs" | "strip";
  wrapperStyle: CSSProperties;
  rotate?: number;
  // Pivot the rotation around the shape's own left-center edge instead of
  // its center (the default) -- lets a strip's wrapper top/left place its
  // pivot exactly at a viewport corner, so the shape sweeps outward from
  // that corner at the given angle instead of rotating in place around
  // its middle. Used for the corner-to-corner diagonal strip below.
  originLeft?: boolean;
  drift: 1 | 2 | 3 | 4;
};

// Offsets are deliberately tight (single-digit vw/vh, mostly) rather than
// spread out like the reference this was modeled on -- this page's hero
// is a full-bleed photo card with only a slim margin above/beside it
// (see about-and-connect.module.css's .hero padding), so a cluster placed
// further out just disappears underneath it. Keeping shapes close to the
// true viewport corner means at least part of each one lands in that
// slim margin instead of being fully hidden.
const SHAPES: Shape[] = [
  // A solid (not blurred/faint like the bands) diagonal strip anchored at
  // the true top-left corner, sweeping down and out to the right --
  // distinct from the two soft corner clusters below, and the one place
  // this background commits to a bold, fully opaque black shape rather
  // than a low-opacity tint.
  { type: "strip", wrapperStyle: { top: "-3vh", left: "-14vw", width: "92vw", height: "7vw" }, rotate: -8, drift: 2 },

  // A second strip, same corner and same solid treatment, running the
  // full corner-to-corner diagonal (top-left to bottom-right) instead of
  // nearly horizontal like the one above. originLeft pins the rotation
  // pivot to this shape's own left-center edge, placed right at the
  // corner via the wrapper's top/left -- the shape then sweeps out from
  // that exact point at the given angle, rather than rotating around its
  // middle (which would need the wrapper positioned and sized just right
  // for the pivot to land anywhere close to the corner -- see the
  // straightforward math in the comment on `originLeft` above).
  { type: "strip", wrapperStyle: { top: "-3vh", left: "-3vw", width: "115vw", height: "6vw" }, rotate: 40, originLeft: true, drift: 4 },

  // Top-right cluster
  { type: "band", wrapperStyle: { top: "-14vh", right: "-12vw", width: "40vw", height: "68vh" }, rotate: 38, drift: 1 },
  { type: "band", wrapperStyle: { top: "-6vh", right: "-18vw", width: "26vw", height: "48vh" }, rotate: -40, drift: 2 },
  { type: "solidXs", wrapperStyle: { top: "1vh", right: "7vw" }, drift: 3 },
  { type: "outlineSm", wrapperStyle: { top: "2vh", right: "2vw" }, drift: 1 },
  { type: "outlineLg", wrapperStyle: { top: "1vh", right: "-2vw" }, drift: 4 },
  { type: "solidXs", wrapperStyle: { top: "14vh", right: "1vw" }, drift: 2 },
  { type: "outlineSm", wrapperStyle: { top: "21vh", right: "2vw" }, drift: 3 },

  // Bottom-left cluster
  { type: "band", wrapperStyle: { bottom: "-14vh", left: "-12vw", width: "40vw", height: "68vh" }, rotate: 38, drift: 2 },
  { type: "band", wrapperStyle: { bottom: "-6vh", left: "-18vw", width: "26vw", height: "48vh" }, rotate: -40, drift: 1 },
  { type: "solidXs", wrapperStyle: { bottom: "1vh", left: "7vw" }, drift: 4 },
  { type: "outlineSm", wrapperStyle: { bottom: "2vh", left: "2vw" }, drift: 3 },
  { type: "outlineLg", wrapperStyle: { bottom: "1vh", left: "-2vw" }, drift: 1 },
  { type: "solidXs", wrapperStyle: { bottom: "14vh", left: "1vw" }, drift: 2 },
];

const SHAPE_CLASS: Record<Shape["type"], string> = {
  band: "band",
  outlineLg: "outlineLg",
  outlineSm: "outlineSm",
  solidXs: "solidXs",
  strip: "strip",
};

export default function AboutBackground() {
  return (
    <div className={styles.background} aria-hidden="true">
      {SHAPES.map((shape, i) => (
        <div key={i} className={`${styles.shapeWrap} ${styles[`drift${shape.drift}`]}`} style={shape.wrapperStyle}>
          <span
            className={styles[SHAPE_CLASS[shape.type]]}
            style={
              shape.rotate !== undefined
                ? {
                    transform: `rotate(${shape.rotate}deg)`,
                    transformOrigin: shape.originLeft ? "0% 50%" : undefined,
                  }
                : undefined
            }
          />
        </div>
      ))}
    </div>
  );
}
