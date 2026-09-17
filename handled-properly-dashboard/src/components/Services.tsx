import ScrollReveal from "@/components/ScrollReveal";
import ArrowIcon from "@/components/icons/ArrowIcon";
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

// A single shared ScrollReveal for the whole row/stack (each card used to
// be its own separately scroll-tracked reveal, staggered by delay AND by
// each card's own position) rather than one per card. At desktop widths
// the four cards already sit in one row at nearly the same position, so
// they already revealed together in practice; on mobile they stack into a
// single column, where each card's own position pushed its reveal later
// and later down the page -- sharing one reveal value fixes that, so all
// four appear at once there too.
export default function Services() {
  return (
    <ScrollReveal as="section" className={styles.section}>
      {SERVICES.map((service) => (
        <div key={service.title} className={styles.card}>
          <span className={styles.icon} aria-hidden="true">
            {service.icon}
          </span>
          <h3 className={styles.title}>{service.title}</h3>
          <p className={styles.description}>{service.description}</p>
          <span className={styles.arrow}>
            <ArrowIcon />
          </span>
        </div>
      ))}
    </ScrollReveal>
  );
}
