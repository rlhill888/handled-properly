import { getAboutPage, getAboutValues } from "@/lib/data/site-content";
import AboutPageForm from "./AboutPageForm";
import ValueList from "./ValueList";
import NewValueForm from "./NewValueForm";
import AddModalButton from "@/components/portal/AddModalButton";
import styles from "@/styles/admin-shared.module.css";

export default async function AboutPageAdminPage() {
  const [about, values] = await Promise.all([getAboutPage(), getAboutValues()]);

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <span className={styles.eyebrow}>Website</span>
          <h1 className={styles.title}>About Page</h1>
          <p className={styles.description}>
            Content shown on the public /about page — Hero, Our Story, Who We Are, What We Do, Our
            Mission, Our Vision, Our Values, and the closing CTA.
          </p>
        </div>
      </div>

      <div className={styles.card}>
        <h2 className={styles.title} style={{ fontSize: 18, marginTop: 0 }}>
          Sections
        </h2>
        <AboutPageForm about={about} />
      </div>

      <div className={styles.card}>
        <div className={styles.titleRow}>
          <h2 className={styles.title} style={{ fontSize: 18, marginTop: 0 }}>
            Our Values
          </h2>
          <AddModalButton label="New Value" modalTitle="New Value">
            <NewValueForm />
          </AddModalButton>
        </div>
        <p className={styles.description}>The short title/description cards in the Our Values grid.</p>
        <ValueList items={values} />
      </div>
    </div>
  );
}
