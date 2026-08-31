// Supabase Storage object keys reject a lot of characters browsers happily
// put in filenames (spaces, parens, brackets, unicode, etc. — the upload
// fails with a raw "Invalid key" error otherwise). Collapses anything
// outside the safe set down to a dash so the original name stays
// recognizable without risking a rejected key.
export function sanitizeStorageFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "-");
}
