import styles from "@/styles/admin-shared.module.css";
import commentStyles from "./CommentsSection.module.css";

export type EventTaskUpdateData = {
  id: string;
  body: string;
  createdAt: string;
};

function formatUpdateTime(iso: string): string {
  const date = new Date(iso);
  const day = date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  const time = date.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  return `${day} · ${time}`;
}

// Read-only counterpart to CommentsSection — Event Task Updates are
// admin-authored only, neither the Client nor Staff ever post, so there's
// no composer here, and no author label (there's only ever one author).
// Shared by the Client's and Staff's Event Task detail pages.
export default function EventTaskUpdatesList({ updates }: { updates: EventTaskUpdateData[] }) {
  if (updates.length === 0) {
    return <p className={styles.emptyState}>No updates yet.</p>;
  }

  return (
    <div className={commentStyles.timeline}>
      {updates.map((update) => (
        <div key={update.id} className={commentStyles.timelineItem}>
          <div className={commentStyles.timelineRail}>
            <span className={commentStyles.timelineDot} aria-hidden="true" />
          </div>
          <div className={commentStyles.timelineContent}>
            <span className={commentStyles.timelineTime}>{formatUpdateTime(update.createdAt)}</span>
            <p className={commentStyles.timelineBody}>{update.body}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
