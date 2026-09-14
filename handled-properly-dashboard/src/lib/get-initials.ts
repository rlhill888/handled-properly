// "Priya Nandan" -> "PN"; a single-word name just takes its first two
// letters so the avatar circle never ends up empty. Shared by every avatar
// circle in the portal (assignment cards, comments) so initials read the
// same way everywhere a name is shortened.
export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
