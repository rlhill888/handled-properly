"use client";

import { useState, type ReactNode } from "react";
import styles from "@/styles/admin-shared.module.css";

export default function CollapsibleCard({
  title,
  description,
  badgeCount,
  icon,
  titleClassName,
  actions,
  defaultOpen = true,
  bare = false,
  children,
}: {
  title: string;
  // One-liner shown under the title, explaining what this card is for.
  // Stays visible even when collapsed.
  description?: string;
  // Shown as a plain number next to the title — omitted (or 0) hides it
  // entirely.
  badgeCount?: number;
  // Rendered in its own box to the left of the title/description/children
  // column — opt-in, unset by every existing caller, so nothing else
  // changes visually (a single flex child behaves the same as no flex
  // wrapper at all).
  icon?: ReactNode;
  // Overrides the title's default small-caps label look (used everywhere
  // else this component appears) with a normal-case, bolder style — opt-in,
  // for the one caller (the Requests row on the Client's event page) that
  // needs to read as a peer of the Resources cards next to it rather than
  // a section label.
  titleClassName?: string;
  // Rendered next to the title, matching the plain (non-collapsible) cards'
  // cardHeaderRow pattern (e.g. EventTasksBoard's "+ New Event Task"). Kept
  // outside the toggle button (not nested inside it — buttons can't nest)
  // so clicking it doesn't also collapse/expand the card.
  actions?: ReactNode;
  defaultOpen?: boolean;
  // Skips the outer white-card chrome so this can be embedded inside a card
  // that already has one (e.g. the Details card), instead of nesting a
  // second white box inside it.
  bare?: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const toggle = () => setOpen((o) => !o);

  const header = (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        width: "100%",
        marginBottom: open ? 16 : 0,
      }}
    >
      <button
        type="button"
        onClick={toggle}
        aria-expanded={open}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          background: "none",
          border: "none",
          padding: 0,
          cursor: "pointer",
        }}
      >
        <h2 className={titleClassName ?? styles.cardTitle} style={{ marginBottom: 0 }}>
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
      </button>

      {actions}

      <button
        type="button"
        onClick={toggle}
        aria-expanded={open}
        aria-label={open ? "Collapse" : "Expand"}
        style={{
          marginLeft: "auto",
          flexShrink: 0,
          background: "none",
          border: "none",
          padding: 0,
          cursor: "pointer",
        }}
      >
        <span
          className={`${styles.accordionChevron} ${open ? styles.accordionChevronOpen : ""}`}
          aria-hidden="true"
        >
          ▾
        </span>
      </button>
    </div>
  );

  const descriptionEl = description && (
    <p className={styles.description} style={open ? undefined : { marginBottom: 0 }}>
      {description}
    </p>
  );

  const body = (
    <div style={{ display: "flex", gap: 12, width: "100%" }}>
      {icon && <div className={styles.iconBox}>{icon}</div>}
      <div style={{ flex: 1, minWidth: 0 }}>
        {header}
        {descriptionEl}
        {open && children}
      </div>
    </div>
  );

  if (bare) {
    return <div>{body}</div>;
  }

  return <div className={styles.card}>{body}</div>;
}
