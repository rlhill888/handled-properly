"use client";

import { useState } from "react";
import type { CommentData } from "@/lib/actions/assignment-comments";
import { getInitials } from "@/lib/get-initials";
import CommentIcon from "./CommentIcon";
import ChevronRightIcon from "./ChevronRightIcon";
import PersonIcon from "./PersonIcon";
import SendIcon from "./SendIcon";
import styles from "@/styles/admin-shared.module.css";
import cardStyles from "@/styles/assignments-board.module.css";
import commentStyles from "./CommentsSection.module.css";

// "Aug 31 · 3:31 PM" — no year, since a comment thread is always read in
// the context of one still-open assignment/request rather than as a
// historical record.
function formatCommentTime(iso: string): string {
  const date = new Date(iso);
  const day = date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  const time = date.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  return `${day} · ${time}`;
}

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
  variant = "compact",
}: {
  initialComments: CommentData[];
  onPost: (body: string) => Promise<{ comment: CommentData } | { error: string }>;
  // Requests' modal usage opens this already expanded, since the modal
  // itself is already the explicit "show me comments" action — a second,
  // nested collapse toggle there would just be friction. Every other
  // caller (Assignment cards) keeps the default collapsed-by-default.
  defaultOpen?: boolean;
  // "compact" (default) is the small inline toggle used inside denser
  // cards. "row" is a full-width space-between row with a chevron, for a
  // caller presenting Comments as its own bordered section — currently
  // just the staff assignment detail page.
  variant?: "compact" | "row";
}) {
  const [expanded, setExpanded] = useState(defaultOpen);
  const [comments, setComments] = useState<CommentData[]>(initialComments);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSend = async () => {
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

  // Mirrors the ⌘/Ctrl+Enter hint shown under the composer.
  const handleComposerKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className={cardStyles.subSection}>
      {variant === "row" ? (
        <button type="button" className={commentStyles.rowToggle} onClick={() => setExpanded((e) => !e)}>
          <span className={commentStyles.rowToggleLabel}>
            <CommentIcon size={16} />
            Comments
            {comments.length > 0 && <span className={styles.countBubble}>{comments.length}</span>}
          </span>
          <ChevronRightIcon
            size={16}
            className={`${commentStyles.rowToggleChevron} ${expanded ? commentStyles.rowToggleChevronOpen : ""}`}
          />
        </button>
      ) : (
        <button type="button" className={cardStyles.subToggleWithIcon} onClick={() => setExpanded((e) => !e)}>
          <CommentIcon size={14} />
          Comments
          {comments.length > 0 && <span className={styles.countBubble}>{comments.length}</span>}
          <span aria-hidden="true">{expanded ? "▾" : "▸"}</span>
        </button>
      )}

      {expanded && (
        <div className={commentStyles.panel}>
          <div className={commentStyles.list}>
            {comments.length === 0 && <p className={styles.emptyState}>No comments yet.</p>}
            {comments.map((comment) => (
              <div key={comment.id} className={commentStyles.comment}>
                <span className={commentStyles.commentAvatar} aria-hidden="true">
                  {getInitials(comment.authorName)}
                </span>
                <div className={commentStyles.commentContent}>
                  <div className={commentStyles.commentMeta}>
                    <span className={commentStyles.commentAuthor}>{comment.authorName}</span>
                    <span className={commentStyles.commentTime}>{formatCommentTime(comment.createdAt)}</span>
                  </div>
                  <p className={commentStyles.commentBody}>{comment.body}</p>
                </div>
              </div>
            ))}
          </div>

          {error && <p className={styles.error}>{error}</p>}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className={commentStyles.composerRow}
          >
            <span className={commentStyles.composerAvatar} aria-hidden="true">
              <PersonIcon size={14} />
            </span>
            <div className={commentStyles.composerBox}>
              <textarea
                className={commentStyles.composerInput}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={handleComposerKeyDown}
                placeholder="Write a comment…"
                rows={2}
                disabled={sending}
              />
            </div>
            <button
              type="submit"
              className={commentStyles.postButton}
              disabled={sending || !draft.trim()}
              aria-label={sending ? "Posting…" : "Post comment"}
            >
              <SendIcon size={14} />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
