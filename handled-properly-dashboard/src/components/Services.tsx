import styles from "./Services.module.css";

const SERVICES = [
  {
    icon: "◆",
    title: "Event Design",
    description: "Thoughtful concepts and styling tailored to your vision.",
  },
  {
    icon: "✦",
    title: "Vendor Coordination",
    description: "Trusted vendors, booked, briefed, and managed for you.",
  },
  {
    icon: "⏱",
    title: "Timeline Management",
    description: "Every milestone tracked from first call to final toast.",
  },
  {
    icon: "▦",
    title: "Budget Tracking",
    description: "Clear, real-time visibility into spend versus plan.",
  },
];

export default function Services() {
  return (
    <section className={styles.section}>
      {SERVICES.map((service) => (
        <div key={service.title} className={styles.card}>
          <span className={styles.icon} aria-hidden="true">
            {service.icon}
          </span>
          <h3 className={styles.title}>{service.title}</h3>
          <p className={styles.description}>{service.description}</p>
          <span className={styles.arrow} aria-hidden="true">
            →
          </span>
        </div>
      ))}
    </section>
  );
}
