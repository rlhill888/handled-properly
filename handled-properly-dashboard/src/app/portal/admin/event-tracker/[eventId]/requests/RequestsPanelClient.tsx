"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { markRequestFulfilled, markRequestNotFulfilled } from "./actions";
import { addRequestComment } from "@/lib/actions/request-comments";
import CommentsSection from "@/components/portal/CommentsSection";
import CommentIcon from "@/components/portal/CommentIcon";
import Modal from "@/components/portal/Modal";
import type { CommentData } from "@/lib/actions/assignment-comments";
import styles from "@/styles/admin-shared.module.css";
import rowStyles from "./RequestsPanelClient.module.css";

export type RequestRowData = {
  id: string;
  title: string;
  dueDate: string | null;
  requestType: "file" | "text" | "checkbox";
  fulfillmentSetting: string;
  fulfilledAt: string | null;
  fileUrl: string | null;
  responseText: string | null;
  checkedAt: string | null;
  comments: CommentData[];
};

const TYPE_LABEL: Record<RequestRowData["requestType"], string> = {
  file: "File",
  text: "Text",
  checkbox: "Checkbox",
};

function SubmissionCell({ request }: { request: RequestRowData }) {
  let value: React.ReactNode;
  if (request.requestType === "file") {
    value = request.fileUrl ? (
      <a href={request.fileUrl} target="_blank" rel="noreferrer" className={styles.link}>
        Download
      </a>
    ) : (
      <span className={rowStyles.muted}>Not uploaded</span>
    );
  } else if (request.requestType === "text") {
    if (!request.responseText) {
      value = <span className={rowStyles.muted}>Not submitted</span>;
    } else {
      const preview =
        request.responseText.length > 40 ? `${request.responseText.slice(0, 40)}…` : request.responseText;
      value = <span title={request.responseText}>{preview}</span>;
    }
  } else {
    value = request.checkedAt ? "Checked" : <span className={rowStyles.muted}>Not checked</span>;
  }

  return (
    <div className={rowStyles.submissionCell}>
      <span className={rowStyles.typeTag}>{TYPE_LABEL[request.requestType]}</span>
      {value}
    </div>
  );
}

export default function RequestsPanelClient({
  eventId,
  requests,
}: {
  eventId: string;
  requests: RequestRowData[];
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [openCommentsId, setOpenCommentsId] = useState<string | null>(null);

  const handleMarkFulfilled = (requestId: string) => {
    setError(null);
    startTransition(async () => {
      const result = await markRequestFulfilled(requestId, eventId);
      if (result?.error) setError(result.error);
      router.refresh();
    });
  };

  const handleMarkNotFulfilled = (requestId: string) => {
    setError(null);
    startTransition(async () => {
      const result = await markRequestNotFulfilled(requestId, eventId);
      if (result?.error) setError(result.error);
      router.refresh();
    });
  };

  const openCommentsRequest = requests.find((r) => r.id === openCommentsId) ?? null;

  if (requests.length === 0) {
    return <p className={styles.emptyState}>No requests yet.</p>;
  }

  return (
    <div className={styles.form}>
      {error && <p className={styles.error}>{error}</p>}
      <table className={`${styles.table} ${styles.cardRows}`}>
        <thead>
          <tr>
            <th>Title</th>
            <th>Due</th>
            <th>Submission</th>
            <th>Status</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {requests.map((request) => (
            <tr key={request.id} className={rowStyles.row}>
              <td data-label="Title" className={`${styles.cardPrimaryCell} ${rowStyles.titleCell}`}>
                {request.title}
              </td>
              <td data-label="Due" className={rowStyles.dueCell}>
                {request.dueDate ? new Date(request.dueDate).toLocaleDateString() : "—"}
              </td>
              <td data-label="Submission">
                <SubmissionCell request={request} />
              </td>
              <td data-label="Status">
                <span className={request.fulfilledAt ? styles.badge : styles.badgeMuted}>
                  {request.fulfilledAt ? "Fulfilled" : "Outstanding"}
                </span>
              </td>
              <td className={`${styles.cardActionCell} ${rowStyles.actionsCell}`}>
                {request.fulfilledAt ? (
                  <button
                    type="button"
                    className={styles.secondaryButton}
                    disabled={isPending}
                    onClick={() => handleMarkNotFulfilled(request.id)}
                  >
                    Mark Not Fulfilled
                  </button>
                ) : (
                  request.fulfillmentSetting === "manual_review" && (
                    <button
                      type="button"
                      className={styles.secondaryButton}
                      disabled={isPending}
                      onClick={() => handleMarkFulfilled(request.id)}
                    >
                      Mark Fulfilled
                    </button>
                  )
                )}
                <button
                  type="button"
                  className={styles.iconButton}
                  aria-label={`Comments on ${request.title}${request.comments.length > 0 ? ` (${request.comments.length})` : ""}`}
                  onClick={() => setOpenCommentsId(request.id)}
                >
                  <CommentIcon />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <Modal open={openCommentsRequest !== null} onClose={() => setOpenCommentsId(null)} title="Comments">
        {openCommentsRequest && (
          <CommentsSection
            initialComments={openCommentsRequest.comments}
            onPost={(body) => addRequestComment(openCommentsRequest.id, body)}
            defaultOpen
          />
        )}
      </Modal>
    </div>
  );
}
