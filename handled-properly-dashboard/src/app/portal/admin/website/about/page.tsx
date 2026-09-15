import { getAboutContent } from "@/lib/data/site-content";
import AboutForm from "./AboutForm";
import styles from "@/styles/admin-shared.module.css";

export default async function AboutAdminPage() {
  const about = await getAboutContent();

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <span className={styles.eyebrow}>Website</span>
          <h1 className={styles.title}>About Page</h1>
          <p className={styles.description}>Content shown on the public /about page.</p>
        </div>
      </div>

      <div className={styles.card}>
        <AboutForm about={about} />
      </div>
    </div>
  );
}
