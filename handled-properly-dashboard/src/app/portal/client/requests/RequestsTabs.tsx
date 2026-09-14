"use client";

import { useState } from "react";
import Link from "next/link";
import ClipboardIcon from "@/components/portal/ClipboardIcon";
import styles from "./RequestsTabs.module.css";

export type RequestRow = {
  id: string;
  event_id: string;
  title: string;
  due_date: string | null;
  fulfilled_at: string | null;
  events: { name: string } | null;
};

function ArrowIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

function RequestList({ requests, showFulfilled }: { requests: RequestRow[]; showFulfilled: boolean }) {
  if (requests.length === 0) {
    return (
      <p className={styles.emptyState}>
        {showFulfilled ? "No completed requests yet." : "No active requests right now."}
      </p>
    );
  }

  return (
    <div>
      <div className={styles.headerRow}>
        <span>Request</span>
        <span>Event</span>
        <span>{showFulfilled ? "Completed" : "Due date"}</span>
        <span />
      </div>
      {requests.map((request) => {
        const dateValue = showFulfilled ? request.fulfilled_at : request.due_date;
        return (
          <div key={request.id} className={styles.row}>
            <div className={styles.requestCell}>
              <span className={styles.requestIcon}>
                <ClipboardIcon size={16} />
              </span>
              <span className={styles.requestTitle}>{request.title}</span>
            </div>
            <span className={styles.eventCell}>{request.events?.name ?? "—"}</span>
            <span className={dateValue ? styles.dueCell : styles.dueCellMuted}>
              {dateValue ? new Date(dateValue).toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
                year: "numeric",
              }) : "No due date"}
            </span>
            <Link
              href={`/portal/client/events/${request.event_id}/requests/${request.id}`}
              className={styles.viewButton}
            >
              View request
              <ArrowIcon />
            </Link>
          </div>
        );
      })}
    </div>
  );
}

export default function RequestsTabs({
  activeRequests,
  completedRequests,
}: {
  activeRequests: RequestRow[];
  completedRequests: RequestRow[];
}) {
  const [tab, setTab] = useState<"active" | "completed">("active");

  return (
    <div className={styles.card}>
      <div className={styles.tabRow} role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={tab === "active"}
          className={tab === "active" ? styles.tabActive : styles.tab}
          onClick={() => setTab("active")}
        >
          Active
          <span className={styles.tabCount}>{activeRequests.length}</span>
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "completed"}
          className={tab === "completed" ? styles.tabActive : styles.tab}
          onClick={() => setTab("completed")}
        >
          Completed
          <span className={styles.tabCount}>{completedRequests.length}</span>
        </button>
      </div>

      <div className={styles.panel} hidden={tab !== "active"}>
        <p className={styles.tabDescription}>Requests that still need your response.</p>
        <RequestList requests={activeRequests} showFulfilled={false} />
      </div>
      <div className={styles.panel} hidden={tab !== "completed"}>
        <p className={styles.tabDescription}>Requests you&rsquo;ve already finished.</p>
        <RequestList requests={completedRequests} showFulfilled />
      </div>
    </div>
  );
}
