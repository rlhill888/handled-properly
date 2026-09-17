"use client";

import { useEffect, useId, useRef } from "react";

type DelayLevel = 0 | 1 | 2 | 3 | 4;

/**
 * Shared scroll-driven reveal engine (same technique used across the
 * bjp-vending-website homepage): a single rAF loop updates a `--p` custom
 * property (0 -> 1) on every registered element based on its position in
 * the viewport, so motion tracks scroll continuously instead of snapping
 * in via a one-shot IntersectionObserver toggle -- see the CSS transition
 * on [data-reveal] in globals.css, which is what turns that continuously-
 * updating value into a smooth, slightly-lagging "chase" rather than a
 * raw 1:1 scrub.
 */
const registry = new Map<string, HTMLElement>();
let rafId: number | null = null;
let lastY = -1;

function computeProgress(el: HTMLElement) {
  const rect = el.getBoundingClientRect();
  const vh = window.innerHeight || 1;
  const start = vh * 0.92;
  const end = vh * 0.42;
  const raw = (start - rect.top) / (start - end);
  const progress = Math.min(1, Math.max(0, raw));

  // Near the very bottom of a page there may not be enough scroll room
  // left for an element to ever reach the "end" position above -- a
  // reveal-wrapped element positioned close to the end of the document
  // (e.g. a closing CTA right before the footer) would otherwise get
  // stuck at a partial, permanently-faded opacity once the page hits its
  // maximum scroll position, since scrolling further to finish the reveal
  // is physically impossible. Once scrolling is maxed out, anything
  // already on screen counts as fully revealed instead.
  const maxScrollY = document.documentElement.scrollHeight - window.innerHeight;
  if (window.scrollY >= maxScrollY - 1 && rect.top < vh) {
    return 1;
  }

  return progress;
}

function tick() {
  const y = window.scrollY;
  if (y !== lastY) {
    lastY = y;
    registry.forEach((el) => {
      el.style.setProperty("--p", computeProgress(el).toFixed(4));
    });
  }
  rafId = requestAnimationFrame(tick);
}

function startLoop() {
  if (rafId === null) rafId = requestAnimationFrame(tick);
}

function stopLoopIfIdle() {
  if (registry.size === 0 && rafId !== null) {
    cancelAnimationFrame(rafId);
    rafId = null;
    lastY = -1;
  }
}

const delayClass: Record<DelayLevel, string> = {
  0: "",
  1: "revealDelay1",
  2: "revealDelay2",
  3: "revealDelay3",
  4: "revealDelay4",
};

type ScrollRevealProps = {
  children: React.ReactNode;
  className?: string;
  delay?: DelayLevel;
  as?: "div" | "li" | "section";
};

export default function ScrollReveal({
  children,
  className = "",
  delay = 0,
  as = "div",
}: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const id = useId();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    el.style.setProperty("--p", computeProgress(el).toFixed(4));
    registry.set(id, el);
    startLoop();

    const onResize = () => {
      lastY = -1;
    };
    window.addEventListener("resize", onResize);

    return () => {
      registry.delete(id);
      window.removeEventListener("resize", onResize);
      stopLoopIfIdle();
    };
  }, [id]);

  const Tag = as;

  return (
    <Tag ref={ref as never} data-reveal className={`${delayClass[delay]} ${className}`.trim()}>
      {children}
    </Tag>
  );
}
