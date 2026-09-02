import { CHAT_ENABLED } from "./feature-flags";

export type PortalNavLink = {
  label: string;
  href: string;
  badgeCount?: number;
};

export const ADMIN_LINKS: PortalNavLink[] = [
  { label: "Events", href: "/portal/admin/event-tracker" },
  { label: "Clients", href: "/portal/admin/clients" },
  { label: "Staff", href: "/portal/admin/staff" },
  { label: "Contacts", href: "/portal/admin/contacts" },
  { label: "Communication", href: "/portal/admin/communication" },
];

export const STAFF_LINKS: PortalNavLink[] = [
  { label: "Events", href: "/portal/staff/events" },
  ...(CHAT_ENABLED ? [{ label: "Chat", href: "/portal/staff/chat" }] : []),
];

// Documentation/Vendors live under an Event, not top-level nav — mirrors how
// Assignments/Conversations live under /staff/events/[eventId]/... Requests
// gets a top-level link since a client's outstanding requests can span
// multiple events.
export const CLIENT_LINKS: PortalNavLink[] = [
  { label: "Events", href: "/portal/client/events" },
  { label: "Requests", href: "/portal/client/requests" },
];
