// A small decorative progress ring next to an Event Task's title — not a
// literal percentage (Event Tasks don't track sub-progress), just a status
// glyph: empty for Not Started, mostly-empty for In Progress, a short red
// arc for Blocked, and a full ring for Done, echoing the same status
// meanings/colors already used for dependency pills elsewhere in the portal.
const RING_BY_STATUS: Record<
  "not_started" | "in_progress" | "blocked" | "done",
  { pct: number; color: string }
> = {
  not_started: { pct: 0, color: "#6b7280" },
  in_progress: { pct: 0.35, color: "#0a0a0a" },
  blocked: { pct: 0.15, color: "#b91c1c" },
  done: { pct: 1, color: "#0a7c2f" },
};

export default function TaskStatusRing({
  status,
  size = 32,
}: {
  status: "not_started" | "in_progress" | "blocked" | "done";
  size?: number;
}) {
  const { pct, color } = RING_BY_STATUS[status];
  const r = 9;
  const circumference = 2 * Math.PI * r;

  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" style={{ flexShrink: 0 }}>
      <circle cx="12" cy="12" r={r} fill="none" stroke="var(--border)" strokeWidth="3" />
      <circle
        cx="12"
        cy="12"
        r={r}
        fill="none"
        stroke={color}
        strokeWidth="3"
        strokeLinecap="round"
        strokeDasharray={`${circumference * pct} ${circumference}`}
        transform="rotate(-90 12 12)"
      />
    </svg>
  );
}
