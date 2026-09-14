// Chat/Conversations is fully built but temporarily locked — every route,
// component, and Server Action stays in place, just gated behind this flag
// so it's a one-line flip to bring back rather than a re-implementation.
// Flip to true to restore the nav link, per-event entry points, and route
// access all at once.
export const CHAT_ENABLED = false;
