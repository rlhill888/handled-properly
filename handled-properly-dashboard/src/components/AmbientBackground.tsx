import styles from "./AmbientBackground.module.css";

// Purely decorative -- a fixed, slow-drifting dot-grid behind the page's
// real content (see the module CSS for why z-index: -1 is load-bearing).
// Opt-in per page (Home, /events) rather than global, since it's meant as
// a distinguishing touch for these specific pages, not a site-wide texture
// layered under the admin portal or transactional pages too.
export default function AmbientBackground() {
  return <div className={styles.background} aria-hidden="true" />;
}
