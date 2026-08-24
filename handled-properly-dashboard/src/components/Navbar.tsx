"use client";

import { useState } from "react";
import styles from "./Navbar.module.css";

const NAV_LINKS = [
  { label: "Home", href: "/" },
  { label: "Events", href: "/events" },
  { label: "Vendors", href: "/vendors" },
  { label: "Timeline", href: "/timeline" },
  { label: "Budget", href: "/budget" },
  { label: "Contact", href: "/contact" },
];

export default function Navbar() {
  const [activeHref, setActiveHref] = useState("/");
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className={styles.header}>
      <div className={styles.bar}>
        <a href="/" className={styles.logo} onClick={() => setActiveHref("/")}>
          <span className={styles.logoText}>HANDLED PROPERLY</span>
        </a>

        <nav className={styles.nav}>
          <ul className={styles.navList}>
            {NAV_LINKS.map((link) => (
              <li key={link.href} className={styles.navItem}>
                <a
                  href={link.href}
                  className={`${styles.navLink} ${
                    activeHref === link.href ? styles.navLinkActive : ""
                  }`}
                  onClick={() => setActiveHref(link.href)}
                >
                  {link.label}
                  {activeHref === link.href && (
                    <span className={styles.navDot} aria-hidden="true" />
                  )}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <a href="/get-started" className={styles.cta}>
          <span>Get Started</span>
          <span className={styles.ctaArrow} aria-hidden="true">
            ↗
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

      {menuOpen && (
        <nav className={styles.mobileNav}>
          <ul className={styles.mobileNavList}>
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  className={styles.mobileNavLink}
                  onClick={() => {
                    setActiveHref(link.href);
                    setMenuOpen(false);
                  }}
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
          <a href="/get-started" className={styles.mobileCta}>
            <span>Get Started</span>
            <span aria-hidden="true">↗</span>
          </a>
        </nav>
      )}
    </header>
  );
}
