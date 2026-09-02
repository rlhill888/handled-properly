"use client";

import { useState } from "react";
import type { CommentData } from "@/lib/actions/assignment-comments";
import styles from "@/styles/admin-shared.module.css";
import cardStyles from "@/styles/assignments-board.module.css";
import commentStyles from "./CommentsSection.module.css";

// Shared by the admin (AssignmentCard, used both on the assignments list
// page and inside the Kanban board's detail modal), staff
// (StaffAssignmentCard), and Request (RequestsPanelClient, request detail
// page) views. Comments always load with the parent entity (initialComments
// comes from the same fetch as the rest of that entity's data) rather than
// being lazily fetched on expand; posting a new one just appends onPost's
// returned row to local state. The caller supplies onPost so this component
// stays entity-agnostic — see addAssignmentComment/addRequestComment for the
// two current implementations.
export default function CommentsSection({
  initialComments,
  onPost,
  defaultOpen = false,
}: {
  initialComments: CommentData[];
  onPost: (body: string) => Promise<{ comment: CommentData } | { error: string }>;
  // Requests' modal usage opens this already expanded, since the modal
  // itself is already the explicit "show me comments" action — a second,
  // nested collapse toggle there would just be friction. Every other
  // caller (Assignment cards) keeps the default collapsed-by-default.
  defaultOpen?: boolean;
}) {
  const [expanded, setExpanded] = useState(defaultOpen);
  const [comments, setComments] = useState<CommentData[]>(initialComments);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft.trim()) return;
    setSending(true);
    setError(null);
    const result = await onPost(draft);
    setSending(false);
    if ("error" in result) {
      setError(result.error);
      return;
    }
    setComments((current) => [...current, result.comment]);
    setDraft("");
  };

  return (
    <div className={cardStyles.subSection}>
      <button type="button" className={cardStyles.subToggle} onClick={() => setExpanded((e) => !e)}>
        {expanded ? "▾" : "▸"} Comments{comments.length > 0 ? ` (${comments.length})` : ""}
      </button>

      {expanded && (
        <div className={commentStyles.panel}>
          <div className={commentStyles.list}>
            {comments.length === 0 && <p className={styles.emptyState}>No comments yet.</p>}
            {comments.map((comment) => (
              <div key={comment.id} className={commentStyles.comment}>
                <div className={commentStyles.commentMeta}>
                  <span className={comment.isAdmin ? styles.badge : styles.badgeMuted}>
                    {comment.authorName}
                  </span>
                  <span className={commentStyles.commentTime}>
                    {new Date(comment.createdAt).toLocaleString()}
                  </span>
                </div>
                <p className={commentStyles.commentBody}>{comment.body}</p>
              </div>
            ))}
          </div>

          {error && <p className={styles.error}>{error}</p>}

          <form onSubmit={handleSend} className={commentStyles.composer}>
            <textarea
              className={styles.textarea}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Add a comment…"
              rows={2}
              disabled={sending}
            />
            <button type="submit" className={styles.primaryButton} disabled={sending || !draft.trim()}>
              {sending ? "Posting…" : "Post"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
