import styles from "@/styles/admin-shared.module.css";

// Shown on both the admin and staff event detail pages. Purely display —
// changing the image is admin-only and lives in the event's Settings modal
// (see EventHeaderImageSettings), not here.
export default function EventHeaderImage({
  eventName,
  imageUrl,
}: {
  eventName: string;
  imageUrl: string | null;
}) {
  if (!imageUrl) return null;

  return <img src={imageUrl} alt={`${eventName} header`} className={styles.eventHeaderImage} />;
}
