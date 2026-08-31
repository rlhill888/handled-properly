"use client";

import type { SubmissionColumn, SubmissionView } from "@/lib/data/form-submissions";
import styles from "@/styles/admin-shared.module.css";

// A cell's plain-text value for both the table and the CSV export — a file
// answer becomes its (time-limited) signed URL rather than the "View file"
// link the table shows, since a CSV cell can't carry a link separately from
// its text.
function cellText(submission: SubmissionView, fieldId: string): string {
  const answer = submission.answers.find((a) => a.fieldId === fieldId);
  if (!answer) return "";
  return answer.fileUrl ?? answer.value ?? "";
}

function csvField(value: string): string {
  return /[",\r\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

function downloadCsv(formName: string, columns: SubmissionColumn[], submissions: SubmissionView[]) {
  const headers = ["Submitted", "Contact", "Email", ...columns.map((c) => c.label)];
  const rows = submissions.map((s) => [
    new Date(s.submittedAt).toLocaleString(),
    s.contactName ?? "",
    s.contactEmail ?? "",
    ...columns.map((c) => cellText(s, c.fieldId)),
  ]);
  const csv = [headers, ...rows].map((row) => row.map(csvField).join(",")).join("\r\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${formName.trim().replace(/[^a-z0-9]+/gi, "-").toLowerCase() || "form"}-submissions.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

export default function SubmissionsView({
  formName,
  columns,
  submissions,
}: {
  formName: string;
  columns: SubmissionColumn[];
  submissions: SubmissionView[];
}) {
  if (submissions.length === 0) {
    return <p className={styles.emptyState}>No submissions yet.</p>;
  }

  return (
    <div className={styles.form}>
      <div className={styles.cardHeaderRow}>
        <button
          type="button"
          className={styles.secondaryButton}
          onClick={() => downloadCsv(formName, columns, submissions)}
        >
          Export CSV
        </button>
      </div>

      <div style={{ overflowX: "auto" }}>
        <table className={`${styles.table} ${styles.cardRows}`}>
          <thead>
            <tr>
              <th>Submitted</th>
              <th>Contact</th>
              <th>Email</th>
              {columns.map((c) => (
                <th key={c.fieldId}>{c.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {submissions.map((s) => (
              <tr key={s.id}>
                <td data-label="Submitted">{new Date(s.submittedAt).toLocaleString()}</td>
                <td data-label="Contact">{s.contactName || "—"}</td>
                <td data-label="Email">{s.contactEmail || "—"}</td>
                {columns.map((c) => {
                  const answer = s.answers.find((a) => a.fieldId === c.fieldId);
                  return (
                    <td key={c.fieldId} data-label={c.label}>
                      {answer?.fileUrl ? (
                        <a href={answer.fileUrl} target="_blank" rel="noreferrer" className={styles.link}>
                          View file
                        </a>
                      ) : (
                        answer?.value || "—"
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
