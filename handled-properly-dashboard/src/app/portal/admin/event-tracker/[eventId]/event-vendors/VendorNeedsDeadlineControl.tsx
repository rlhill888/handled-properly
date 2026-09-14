"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { setVendorNeedsDueDate } from "../../actions";
import CalendarIcon from "@/components/portal/CalendarIcon";
import ClockIcon from "@/components/portal/ClockIcon";
import InfoIcon from "@/components/portal/InfoIcon";
import styles from "@/styles/admin-shared.module.css";

function toDateValue(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function toTimeValue(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// An input icon overlaid on the left edge of a native date/time input —
// there's no shared "input with icon" primitive elsewhere in this app, so
// it's built inline here rather than as a new admin-shared.module.css class
// used by exactly one caller.
function IconInput({
  icon,
  ...inputProps
}: { icon: React.ReactNode } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div style={{ position: "relative", flex: 1 }}>
      <span
        style={{
          position: "absolute",
          left: 12,
          top: "50%",
          transform: "translateY(-50%)",
          color: "var(--muted)",
          pointerEvents: "none",
          display: "flex",
        }}
      >
        {icon}
      </span>
      <input {...inputProps} className={styles.input} style={{ width: "100%", paddingLeft: 36 }} />
    </div>
  );
}

export default function VendorNeedsDeadlineControl({
  eventId,
  initialDueDate,
}: {
  eventId: string;
  initialDueDate: string | null;
}) {
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);
  const [date, setDate] = useState(toDateValue(initialDueDate));
  const [time, setTime] = useState(toTimeValue(initialDueDate));
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const save = () => {
    setError(null);
    startTransition(async () => {
      const iso = date ? new Date(`${date}T${time || "00:00"}`).toISOString() : null;
      const result = await setVendorNeedsDueDate(eventId, iso);
      if (result?.error) setError(result.error);
      router.refresh();
    });
  };

  const clear = () => {
    setError(null);
    startTransition(async () => {
      const result = await setVendorNeedsDueDate(eventId, null);
      if (result?.error) setError(result.error);
      setDate("");
      setTime("");
      router.refresh();
    });
  };

  return (
    <div className={styles.accordionItem} style={{ marginBottom: 16 }}>
      <button
        type="button"
        className={styles.accordionHeader}
        onClick={() => setExpanded((e) => !e)}
        aria-expanded={expanded}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12, textAlign: "left" }}>
          <span className={styles.iconBox} aria-hidden="true">
            <CalendarIcon size={16} />
          </span>
          <div>
            <div>
              <span className={styles.accordionTitle}>Item request deadline</span>{" "}
              <span className={styles.optional}>(Optional)</span>
            </div>
            <p className={styles.description} style={{ margin: 0, marginTop: 4, fontWeight: 400 }}>
              Set when vendors must submit their event item requirements.
            </p>
          </div>
        </div>
        <span
          className={`${styles.accordionChevron} ${expanded ? styles.accordionChevronOpen : ""}`}
          aria-hidden="true"
        >
          ▾
        </span>
      </button>

      {expanded && (
        <div className={styles.accordionBody}>
          <div className={styles.formRow}>
            <IconInput
              icon={<CalendarIcon size={14} />}
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
            <IconInput
              icon={<ClockIcon size={14} />}
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
            />
            <button type="button" className={styles.primaryButton} onClick={save} disabled={isPending || !date}>
              {isPending ? "Saving…" : "Save deadline"}
            </button>
          </div>

          {error && <p className={styles.error}>{error}</p>}

          {initialDueDate && (
            <div className={styles.actions}>
              <button type="button" className={styles.secondaryButton} onClick={clear} disabled={isPending}>
                Clear deadline
              </button>
            </div>
          )}

          <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--muted)" }}>
            <InfoIcon size={14} />
            <p className={styles.description} style={{ margin: 0 }}>
              {initialDueDate
                ? `Vendors can no longer add items to their list after ${new Date(initialDueDate).toLocaleString()}.`
                : "No deadline set — vendors can add items at any time."}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
