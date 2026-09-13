// Single source of truth for rendering an Event's date(s) — replaces the
// duplicated `new Date(x).toLocaleString()` idiom that was copy-pasted
// across every admin/staff/client Event display site. Pure and
// framework-free so it works identically from Server Components and Client
// Components.
export function formatEventDate(startsAt: string | null, endsAt: string | null): string {
  if (!startsAt) return "—";

  const start = new Date(startsAt);
  if (!endsAt) return start.toLocaleString();

  const end = new Date(endsAt);
  const sameDay = start.toDateString() === end.toDateString();

  if (sameDay) {
    return `${start.toLocaleDateString()}, ${start.toLocaleTimeString()} – ${end.toLocaleTimeString()}`;
  }

  return `${start.toLocaleString()} – ${end.toLocaleString()}`;
}
