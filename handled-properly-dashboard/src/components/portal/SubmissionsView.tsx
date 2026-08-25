import type { SubmissionView } from "@/lib/data/form-submissions";
import styles from "@/styles/admin-shared.module.css";

export default function SubmissionsView({ submissions }: { submissions: SubmissionView[] }) {
  if (submissions.length === 0) {
    return <p className={styles.emptyState}>No submissions yet.</p>;
  }

  return (
    <div className={styles.metaRow} style={{ flexDirection: "column", alignItems: "stretch", gap: 16 }}>
      {submissions.map((submission) => (
        <div key={submission.id} className={styles.card}>
          <div className={styles.header}>
            <div>
              <strong>{submission.contactName ?? "Unknown"}</strong>
              <p className={styles.description} style={{ margin: 0 }}>
                {submission.contactEmail}
              </p>
            </div>
            <span className={styles.badgeMuted}>
              {new Date(submission.submittedAt).toLocaleString()}
            </span>
          </div>
          {submission.answers.length === 0 ? (
            <p className={styles.emptyState}>No answers recorded.</p>
          ) : (
            <table className={styles.table}>
              <tbody>
                {submission.answers.map((answer) => (
                  <tr key={answer.fieldId}>
                    <td style={{ fontWeight: 600, whiteSpace: "nowrap" }}>{answer.label}</td>
                    <td>
                      {answer.fileUrl ? (
                        <a href={answer.fileUrl} target="_blank" rel="noreferrer" className={styles.link}>
                          View file
                        </a>
                      ) : (
                        answer.value || "—"
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      ))}
    </div>
  );
}
