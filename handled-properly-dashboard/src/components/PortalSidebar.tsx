"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import styles from "./PortalSidebar.module.css";

type PortalNavLink = {
  label: string;
  href: string;
  badgeCount?: number;
};

export default function PortalSidebar({
  roleLabel,
  links,
}: {
  roleLabel: string;
  links: PortalNavLink[];
}) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!menuOpen) return;

    document.body.style.overflow = "hidden";
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("keydown", handleKey);

    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", handleKey);
    };
  }, [menuOpen]);

  return (
    <aside className={styles.sidebar}>
      <div className={styles.topRow}>
        <a href="/" className={styles.logo}>
          <span className={styles.logoMark} aria-hidden="true" />
          <span className={styles.logoText}>HANDLED PROPERLY</span>
        </a>

        <button
          type="button"
          className={styles.menuButton}
          aria-label="Open menu"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen(true)}
        >
          <span />
          <span />
          <span />
        </button>
      </div>

      <div className={styles.panel}>
        <span className={styles.roleLabel}>{roleLabel}</span>

        <nav className={styles.nav}>
          <ul className={styles.navList}>
            {links.map((link) => {
              const isActive = pathname === link.href;
              return (
                <li key={link.href}>
                  <a
                    href={link.href}
                    className={`${styles.navLink} ${
                      isActive ? styles.navLinkActive : ""
                    }`}
                  >
                    <span>{link.label}</span>
                    {Boolean(link.badgeCount) && <span className={styles.navBadge}>{link.badgeCount}</span>}
                  </a>
                </li>
              );
            })}
          </ul>
        </nav>

        <a href="/portal/signin" className={styles.signOut}>
          Sign Out
        </a>
      </div>

      <div
        className={`${styles.drawerOverlay} ${menuOpen ? styles.drawerOverlayOpen : ""}`}
        onClick={() => setMenuOpen(false)}
        aria-hidden="true"
      />

      <div
        className={`${styles.drawer} ${menuOpen ? styles.drawerOpen : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label="Menu"
      >
        <div className={styles.drawerHeader}>
          <span className={styles.roleLabel}>{roleLabel}</span>
          <button
            type="button"
            className={styles.drawerClose}
            aria-label="Close menu"
            onClick={() => setMenuOpen(false)}
          >
            ×
          </button>
        </div>

        <nav className={styles.drawerNav}>
          <ul className={styles.drawerNavList}>
            {links.map((link) => {
              const isActive = pathname === link.href;
              return (
                <li key={link.href}>
                  <a
                    href={link.href}
                    className={`${styles.drawerNavLink} ${
                      isActive ? styles.drawerNavLinkActive : ""
                    }`}
                    onClick={() => setMenuOpen(false)}
                  >
                    <span>{link.label}</span>
                    {Boolean(link.badgeCount) && <span className={styles.navBadge}>{link.badgeCount}</span>}
                  </a>
                </li>
              );
            })}
          </ul>
        </nav>

        <a href="/portal/signin" className={styles.drawerSignOut}>
          Sign Out
        </a>
      </div>
    </aside>
  );
}
