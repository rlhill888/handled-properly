"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  getOrGenerateApplicationSummary,
  convertApplicationToClient,
  declineApplication,
} from "./applications-actions";
import styles from "@/styles/admin-shared.module.css";

export type ApplicationRowData = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  companyName: string | null;
  eventDate: string | null;
  guestCount: number | null;
  location: string | null;
  budget: string | null;
  message: string;
  status: "pending" | "converted" | "declined";
  aiSummary: string | null;
  submittedAt: string;
};

export default function ApplicationRow({ application }: { application: ApplicationRowData }) {
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);
  const [summary, setSummary] = useState(application.aiSummary);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const [isSummarizing, startSummarize] = useTransition();
  const [isActing, startAction] = useTransition();
  const [actionError, setActionError] = useState<string | null>(null);

  const toggleExpanded = () => {
    const next = !expanded;
    setExpanded(next);
    if (next && !summary) {
      setSummaryError(null);
      startSummarize(async () => {
        const result = await getOrGenerateApplicationSummary(application.id);
        if ("error" in result) setSummaryError(result.error);
        else setSummary(result.summary);
      });
    }
  };

  const handleConvert = () => {
    setActionError(null);
    startAction(async () => {
      const result = await convertApplicationToClient(application.id);
      if (result?.error) setActionError(result.error);
      else router.refresh();
    });
  };

  const handleDecline = () => {
    if (!confirm("Decline this application?")) return;
    setActionError(null);
    startAction(async () => {
      const result = await declineApplication(application.id);
      if (result?.error) setActionError(result.error);
      else router.refresh();
    });
  };

  return (
    <div className={styles.accordionItem}>
      <button
        type="button"
        className={styles.accordionHeader}
        onClick={toggleExpanded}
        aria-expanded={expanded}
      >
        <span className={styles.accordionTitle}>{application.name}</span>
        <span className={styles.metaRow}>
          {application.status === "declined" && <span className={styles.badgeMuted}>Declined</span>}
          <span className={styles.badgeMuted}>
            {new Date(application.submittedAt).toLocaleDateString()}
          </span>
          <span
            className={`${styles.accordionChevron} ${expanded ? styles.accordionChevronOpen : ""}`}
            aria-hidden="true"
          >
            ▾
          </span>
        </span>
      </button>

      {expanded && (
        <div className={styles.accordionBody}>
          {isSummarizing && <p className={styles.emptyState}>Summarizing…</p>}
          {summaryError && <p className={styles.error}>{summaryError}</p>}
          {summary && !isSummarizing && (
            <p className={styles.description} style={{ margin: 0 }}>
              {summary}
            </p>
          )}

          <table className={`${styles.table} ${styles.keyValueTable}`}>
            <tbody>
              <tr>
                <td>Email</td>
                <td>{application.email}</td>
              </tr>
              <tr>
                <td>Phone</td>
                <td>{application.phone || "—"}</td>
              </tr>
              <tr>
                <td>Company</td>
                <td>{application.companyName || "—"}</td>
              </tr>
              <tr>
                <td>Event date</td>
                <td>{application.eventDate || "—"}</td>
              </tr>
              <tr>
                <td>Guest count</td>
                <td>{application.guestCount ?? "—"}</td>
              </tr>
              <tr>
                <td>Location</td>
                <td>{application.location || "—"}</td>
              </tr>
              <tr>
                <td>Budget</td>
                <td>{application.budget || "—"}</td>
              </tr>
              <tr>
                <td>Message</td>
                <td>{application.message}</td>
              </tr>
            </tbody>
          </table>

          {actionError && <p className={styles.error}>{actionError}</p>}

          {application.status === "pending" && (
            <div className={styles.actions}>
              <button
                type="button"
                className={styles.primaryButton}
                onClick={handleConvert}
                disabled={isActing}
              >
                {isActing ? "Working…" : "Convert to Client"}
              </button>
              <button
                type="button"
                className={styles.secondaryButton}
                onClick={handleDecline}
                disabled={isActing}
              >
                Decline
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
