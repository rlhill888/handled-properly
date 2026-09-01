import styles from "@/styles/admin-shared.module.css";
import commentStyles from "@/components/portal/CommentsSection.module.css";

export type EventTaskUpdateData = {
  id: string;
  body: string;
  createdAt: string;
};

// Read-only counterpart to CommentsSection — Event Task Updates are
// admin-authored only, the Client never posts, so there's no composer here.
export default function EventTaskUpdatesList({ updates }: { updates: EventTaskUpdateData[] }) {
  return (
    <div className={commentStyles.list}>
      {updates.length === 0 && <p className={styles.emptyState}>No updates yet.</p>}
      {updates.map((update) => (
        <div key={update.id} className={commentStyles.comment}>
          <div className={commentStyles.commentMeta}>
            <span className={commentStyles.commentTime}>
              {new Date(update.createdAt).toLocaleString()}
            </span>
          </div>
          <p className={commentStyles.commentBody}>{update.body}</p>
        </div>
      ))}
    </div>
  );
}
