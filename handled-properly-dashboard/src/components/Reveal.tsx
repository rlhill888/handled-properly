"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./Reveal.module.css";

// Fades/slides a section up into place the first time it scrolls into
// view -- wraps each Content Block in BlockRenderer. Plays once per block
// (unobserves after it's visible) rather than replaying on every scroll up
// and down, which reads as flicker rather than a "modern" reveal.
export default function Reveal({
  children,
  className,
  style,
}: {
  children: React.ReactNode;
  className?: string;
  // BlockRenderer passes each block's own marginTop/marginBottom here --
  // Reveal is the outermost element BlockRenderer renders per block, so
  // it's the right place for that spacing to live (see
  // docs/adr/0020-per-block-margins.md).
  style?: React.CSSProperties;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.unobserve(node);
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -80px 0px" }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const combined = [styles.reveal, visible ? styles.visible : "", className].filter(Boolean).join(" ");

  return (
    <div ref={ref} className={combined} style={style}>
      {children}
    </div>
  );
}
