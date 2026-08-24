"use client";

import { usePathname } from "next/navigation";
import styles from "./PortalSidebar.module.css";

type PortalNavLink = {
  label: string;
  href: string;
};

export default function PortalSidebar({
  roleLabel,
  links,
}: {
  roleLabel: string;
  links: PortalNavLink[];
}) {
  const pathname = usePathname();

  return (
    <aside className={styles.sidebar}>
      <a href="/" className={styles.logo}>
        <span className={styles.logoText}>HANDLED PROPERLY</span>
      </a>

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
                  {link.label}
                </a>
              </li>
            );
          })}
        </ul>
      </nav>

      <a href="/portal/signin" className={styles.signOut}>
        Sign Out
      </a>
    </aside>
  );
}
