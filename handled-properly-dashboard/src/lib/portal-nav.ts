import { CHAT_ENABLED } from "./feature-flags";

export type PortalNavLink = {
  label: string;
  href: string;
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
