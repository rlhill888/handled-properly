"use client";

import { useOptimistic, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { addVendorNeed, removeVendorNeed } from "./actions";
import type { VendorNeed } from "./data";
import styles from "@/styles/admin-shared.module.css";

type DisplayNeed = VendorNeed & { pending?: boolean };
type OptimisticAction = { type: "add"; need: DisplayNeed } | { type: "remove"; id: string };

// Auto-dismissed after a few seconds rather than requiring a click — a
// failed add is rare and the offending item has already been pulled from
// the list by the time this shows, so there's nothing left for the vendor
// to act on beyond noticing it happened.
const FAILURE_TOAST_MS = 6000;

let tempIdCounter = 0;
function nextTempId(): string {
  tempIdCounter += 1;
  return `pending-${tempIdCounter}`;
}

export default function VendorNeedsList({
  eventId,
  needs,
  canAdd = true,
}: {
  eventId: string;
  needs: VendorNeed[];
  // False once the admin's optional item-request deadline has passed —
  // existing items still show and can still be removed, just no new ones.
  canAdd?: boolean;
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [optimisticNeeds, dispatchOptimistic] = useOptimistic<DisplayNeed[], OptimisticAction>(
    needs,
    (state, action) =>
      action.type === "add" ? [...state, action.need] : state.filter((n) => n.id !== action.id)
  );
  const inputRef = useRef<HTMLInputElement>(null);
  const [item, setItem] = useState("");
  const [failures, setFailures] = useState<{ id: string; message: string }[]>([]);

  const dismissFailure = (id: string) => {
    setFailures((prev) => prev.filter((f) => f.id !== id));
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const value = item.trim();
    if (!value) return;

    // Cleared immediately (not on server confirmation) so the vendor can
    // start typing the next item while this one is still in flight.
    setItem("");
    inputRef.current?.focus();

    const tempId = nextTempId();
    startTransition(async () => {
      dispatchOptimistic({ type: "add", need: { id: tempId, item: value, pending: true } });
      const result = await addVendorNeed(eventId, value);
      if (result?.error) {
        const failureId = nextTempId();
        setFailures((prev) => [...prev, { id: failureId, message: `Couldn't add "${value}": ${result.error}` }]);
        setTimeout(() => dismissFailure(failureId), FAILURE_TOAST_MS);
        // No router.refresh() here — once this transition settles without
        // the base `needs` having changed, the optimistic entry above is
        // discarded automatically, pulling the failed item back out.
      } else {
        router.refresh();
      }
    });
  };

  const handleRemove = (need: DisplayNeed) => {
    startTransition(async () => {
      dispatchOptimistic({ type: "remove", id: need.id });
      const result = await removeVendorNeed(need.id, eventId);
      if (result?.error) {
        const failureId = nextTempId();
        setFailures((prev) => [
          ...prev,
          { id: failureId, message: `Couldn't remove "${need.item}": ${result.error}` },
        ]);
        setTimeout(() => dismissFailure(failureId), FAILURE_TOAST_MS);
        // Same revert-on-settle behavior as add: without a router.refresh(),
        // the base `needs` still has this item, so it reappears once the
        // transition ends.
      } else {
        router.refresh();
      }
    });
  };

  return (
    <div className={styles.form}>
      {failures.map((failure) => (
        <p key={failure.id} className={styles.error} style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
          {failure.message}
          <button
            type="button"
            onClick={() => dismissFailure(failure.id)}
            aria-label="Dismiss"
            style={{ background: "none", border: "none", cursor: "pointer", color: "inherit", font: "inherit" }}
          >
            ×
          </button>
        </p>
      ))}

      {optimisticNeeds.length === 0 ? (
        <p className={styles.emptyState}>You haven&apos;t requested anything yet.</p>
      ) : (
        <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
          {optimisticNeeds.map((need) => (
            <li
              key={need.id}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
                padding: "8px 0",
                borderBottom: "1px solid var(--border)",
                fontSize: 13,
                opacity: need.pending ? 0.6 : 1,
              }}
            >
              <span>{need.item}</span>
              <button
                type="button"
                className={styles.pillDelete}
                aria-label={`Remove ${need.item}`}
                onClick={() => handleRemove(need)}
                disabled={Boolean(need.pending)}
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}

      {canAdd && (
        <div>
          <form onSubmit={handleSubmit} className={styles.formRow} style={{ alignItems: "flex-end" }}>
            <div className={styles.field} style={{ flex: 1 }}>
              <label className={styles.label} htmlFor="vendor-need-item">
                Item request
              </label>
              <input
                ref={inputRef}
                id="vendor-need-item"
                name="item"
                required
                className={styles.input}
                placeholder="e.g. 2 six-foot tables"
                value={item}
                onChange={(e) => setItem(e.target.value)}
              />
            </div>
            <div style={{ flex: "0 0 auto" }}>
              <button type="submit" className={styles.primaryButton} disabled={!item.trim()}>
                + Add item
              </button>
            </div>
          </form>
          <p className={styles.description} style={{ margin: 0, marginTop: 6 }}>
            Include the quantity and any important details.
          </p>
        </div>
      )}
    </div>
  );
}
