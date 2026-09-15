"use client";

import { useEffect, useMemo, useState } from "react";
import { allImagePaths, siteImagePublicUrl, type Block } from "@/lib/blocks";
import BlockRenderer from "@/components/BlockRenderer";
import styles from "./BlockPreview.module.css";

type Device = "phone" | "tablet" | "desktop";

const DEVICE_LABELS: Record<Device, string> = {
  phone: "Phone",
  tablet: "Tablet",
  desktop: "Monitor",
};

const FRAME_CLASS: Record<Device, string> = {
  phone: styles.framePhone,
  tablet: styles.frameTablet,
  desktop: styles.frameDesktop,
};

// Renders the CURRENT, unsaved editor state -- not the last-saved page --
// by reusing BlockRenderer directly (it does no data fetching itself, so
// it's just as usable from this Client Component as from the public
// Server Component pages). Image paths are resolved to public URLs the
// same well-known way ImagePicker's previews already are, since there's no
// server round trip here to do it for us.
export default function BlockPreview({
  blocks,
  open,
  onClose,
}: {
  blocks: Block[];
  open: boolean;
  onClose: () => void;
}) {
  const [device, setDevice] = useState<Device>("desktop");

  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  const imageUrls = useMemo(() => {
    const urls: Record<string, string> = {};
    for (const path of allImagePaths(blocks)) urls[path] = siteImagePublicUrl(path);
    return urls;
  }, [blocks]);

  if (!open) return null;

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true" aria-label="Preview">
      <div className={styles.toolbar}>
        <div className={styles.viewToggle} role="tablist">
          {(Object.keys(DEVICE_LABELS) as Device[]).map((d) => (
            <button
              key={d}
              type="button"
              role="tab"
              aria-selected={device === d}
              className={`${styles.toggleButton} ${device === d ? styles.toggleButtonActive : ""}`}
              onClick={() => setDevice(d)}
            >
              {DEVICE_LABELS[d]}
            </button>
          ))}
        </div>
        <button type="button" className={styles.closeButton} aria-label="Close preview" onClick={onClose}>
          ×
        </button>
      </div>

      <div className={styles.viewport}>
        <div className={`${styles.frame} ${FRAME_CLASS[device]}`}>
          <div className={styles.frameContent}>
            <BlockRenderer blocks={blocks} imageUrls={imageUrls} />
          </div>
        </div>
      </div>
    </div>
  );
}
