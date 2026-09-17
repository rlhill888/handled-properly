"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import ArrowIcon from "@/components/icons/ArrowIcon";
import styles from "./Navbar.module.css";

const NAV_LINKS = [
  { label: "Home", href: "/" },
  { label: "About", href: "/about" },
  { label: "Events", href: "/events" },
  { label: "Contact", href: "/contact" },
];

export default function Navbar() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [hidden, setHidden] = useState(false);

  // Same drawer UX as the portal's mobile nav (PortalSidebar): locks
  // background scroll while open and closes on Escape, not just on
  // overlay click/link click.
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

  // Hide the bar on scroll-down, reveal it on scroll-up. Skipped while the
  // drawer is open so the bar doesn't slide away behind it, and ignored
  // near the top so the page doesn't flicker the bar on tiny scroll jitter.
  useEffect(() => {
    let lastY = window.scrollY;

    const handleScroll = () => {
      const y = window.scrollY;
      const delta = y - lastY;

      if (!menuOpen) {
        if (y < 80) {
          setHidden(false);
        } else if (delta > 0) {
          setHidden(true);
        } else if (delta < 0) {
          setHidden(false);
        }
      }

      lastY = y;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [menuOpen]);

  return (
    <>
      <header className={`${styles.header} ${hidden ? styles.headerHidden : ""}`}>
        <div className={styles.bar}>
          <a href="/" className={styles.logo}>
            <span className={styles.logoText}>HANDLED PROPERLY</span>
          </a>

          <nav className={styles.nav}>
            <ul className={styles.navList}>
              {NAV_LINKS.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <li key={link.href} className={styles.navItem}>
                    <a
                      href={link.href}
                      className={`${styles.navLink} ${isActive ? styles.navLinkActive : ""}`}
                    >
                      {link.label}
                      {isActive && <span className={styles.navDot} aria-hidden="true" />}
                    </a>
                  </li>
                );
              })}
            </ul>
          </nav>

          <a href="/get-started" className={styles.cta}>
            <span>Get Started</span>
            <span className={styles.ctaArrow}>
              <ArrowIcon direction="up-right" />
            </span>
          </a>

          <button
            className={styles.menuButton}
            aria-label="Toggle menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((open) => !open)}
          >
            <span />
            <span />
            <span />
          </button>
        </div>
      </header>

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
          <span className={styles.drawerLogo}>HANDLED PROPERLY</span>
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
          <span className={styles.drawerNavEyebrow}>Navigation</span>
          <ul className={styles.drawerNavList}>
            {NAV_LINKS.map((link) => {
              const isActive = pathname === link.href;
              return (
                <li key={link.href} className={styles.drawerNavItem}>
                  <a
                    href={link.href}
                    className={`${styles.drawerNavLink} ${isActive ? styles.drawerNavLinkActive : ""}`}
                    onClick={() => setMenuOpen(false)}
                  >
                    <span className={styles.drawerNavLinkLabel}>
                      {link.label}
                      {isActive && <span className={styles.drawerNavDot} aria-hidden="true" />}
                    </span>
                    <span className={styles.drawerNavArrow}>
                      <ArrowIcon />
                    </span>
                  </a>
                </li>
              );
            })}
          </ul>
        </nav>

        <a href="/get-started" className={styles.drawerCta} onClick={() => setMenuOpen(false)}>
          <span>Get Started</span>
          <ArrowIcon direction="up-right" />
        </a>
      </div>
    </>
  );
}
