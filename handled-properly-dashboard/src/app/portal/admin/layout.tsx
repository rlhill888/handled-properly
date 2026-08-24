import PortalSidebar from "@/components/PortalSidebar";
import styles from "../portal-shell.module.css";

const ADMIN_LINKS = [
  { label: "Forms", href: "/portal/admin/form" },
  { label: "Event Tracker", href: "/portal/admin/event-tracker" },
  { label: "Mass Email Manager", href: "/portal/admin/email-manager" },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={styles.shell}>
      <PortalSidebar roleLabel="Admin" links={ADMIN_LINKS} />
      <main className={styles.content}>{children}</main>
    </div>
  );
}
