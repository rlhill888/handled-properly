"use client";

import { useState, type ReactNode } from "react";
import styles from "@/styles/admin-shared.module.css";

export default function CollapsibleCard({
  title,
  badgeCount,
  defaultOpen = true,
  bare = false,
  children,
}: {
  title: string;
  // Shown as a plain number next to the title — omitted (or 0) hides it
  // entirely.
  badgeCount?: number;
  defaultOpen?: boolean;
  // Skips the outer white-card chrome so this can be embedded inside a card
  // that already has one (e.g. the Details card), instead of nesting a
  // second white box inside it.
  bare?: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  const header = (
    <button
      type="button"
      onClick={() => setOpen((o) => !o)}
      aria-expanded={open}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        width: "100%",
        background: "none",
        border: "none",
        padding: 0,
        marginBottom: open ? 16 : 0,
        cursor: "pointer",
      }}
    >
      <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
        <h2 className={styles.cardTitle} style={{ marginBottom: 0 }}>
          {title}
        </h2>
        {Boolean(badgeCount) && (
          <span
            aria-label={`${badgeCount} request${badgeCount === 1 ? "" : "s"} need attention`}
            style={{ color: "var(--muted)", fontSize: 13, fontWeight: 700 }}
          >
            {badgeCount}
          </span>
        )}
      </span>
      <span
        className={`${styles.accordionChevron} ${open ? styles.accordionChevronOpen : ""}`}
        aria-hidden="true"
      >
        ▾
      </span>
    </button>
  );

  if (bare) {
    return (
      <div>
        {header}
        {open && children}
      </div>
    );
  }

  return (
    <div className={styles.card}>
      {header}
      {open && children}
    </div>
  );
}
