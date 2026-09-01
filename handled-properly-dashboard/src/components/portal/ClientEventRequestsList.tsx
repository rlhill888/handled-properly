import Link from "next/link";
import styles from "@/styles/admin-shared.module.css";

export type ClientEventRequestData = {
  id: string;
  title: string;
  dueDate: string | null;
  fulfilledAt: string | null;
};

export default function ClientEventRequestsList({
  eventId,
  requests,
}: {
  eventId: string;
  requests: ClientEventRequestData[];
}) {
  if (requests.length === 0) {
    return <p className={styles.emptyState}>No requests yet.</p>;
  }

  return (
    <table className={`${styles.table} ${styles.cardRows}`}>
      <thead>
        <tr>
          <th>Title</th>
          <th>Due</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        {requests.map((request) => (
          <tr key={request.id}>
            <td data-label="Title" className={styles.cardPrimaryCell}>
              <Link href={`/portal/client/events/${eventId}/requests/${request.id}`} className={styles.link}>
                {request.title}
              </Link>
            </td>
            <td data-label="Due">{request.dueDate ? new Date(request.dueDate).toLocaleDateString() : "—"}</td>
            <td data-label="Status">
              <span className={request.fulfilledAt ? styles.badge : styles.badgeMuted}>
                {request.fulfilledAt ? "Fulfilled" : "Outstanding"}
              </span>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
