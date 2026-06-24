import PortalSidebar from "@/components/PortalSidebar";
import styles from "../portal-shell.module.css";

const STAFF_LINKS = [
  { label: "Event", href: "/portal/staff/event" },
  { label: "Chat", href: "/portal/staff/chat" },
];

export default function StaffLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={styles.shell}>
      <PortalSidebar roleLabel="Staff / Vendor" links={STAFF_LINKS} />
      <main className={styles.content}>{children}</main>
    </div>
  );
}
