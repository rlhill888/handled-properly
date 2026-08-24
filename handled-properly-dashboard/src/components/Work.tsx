import styles from "./Work.module.css";

const PROJECTS = [
  {
    index: "01",
    title: "Bloom & Co. Wedding",
    category: "Full Planning / Design",
  },
  {
    index: "02",
    title: "Nexora Product Launch",
    category: "Corporate / Production",
  },
  {
    index: "03",
    title: "Rivet Gala Dinner",
    category: "Day-of Coordination",
  },
  {
    index: "04",
    title: "Lumen Summer Festival",
    category: "Vendor Management",
  },
];

export default function Work() {
  return (
    <section className={styles.section}>
      <div className={styles.intro}>
        <p className={styles.eyebrow}>
          <span className={styles.eyebrowLine} />
          SELECTED WORK
        </p>
        <h2 className={styles.heading}>
          Events that
          <br />
          leave a mark.
        </h2>
        <a href="/events" className={styles.exploreLink}>
          Explore All Events
          <span aria-hidden="true">↗</span>
        </a>
      </div>

      <div className={styles.grid}>
        {PROJECTS.map((project) => (
          <a key={project.index} href="/events" className={styles.card}>
            <div className={styles.thumb}>
              <span className={styles.thumbIndex}>{project.index}</span>
            </div>
            <div className={styles.cardFooter}>
              <div>
                <p className={styles.cardTitle}>{project.title}</p>
                <p className={styles.cardCategory}>{project.category}</p>
              </div>
              <span aria-hidden="true">→</span>
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}
