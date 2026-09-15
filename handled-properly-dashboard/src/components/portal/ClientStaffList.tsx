"use client";

import { useState } from "react";
import Modal from "@/components/portal/Modal";
import styles from "@/styles/admin-shared.module.css";

export type ClientStaffData = {
  id: string;
  name: string;
  email: string;
  title: string | null;
};

// Mirrors ClientVendorsList's click-to-modal pattern.
export default function ClientStaffList({ staff }: { staff: ClientStaffData[] }) {
  const [openId, setOpenId] = useState<string | null>(null);
  const openStaff = staff.find((s) => s.id === openId) ?? null;

  if (staff.length === 0) {
    return <p className={styles.emptyState}>No staff rostered on this event yet.</p>;
  }

  return (
    <>
      <table className={`${styles.table} ${styles.cardRows}`}>
        <thead>
          <tr>
            <th>Name</th>
            <th>Title</th>
            <th>Email</th>
          </tr>
        </thead>
        <tbody>
          {staff.map((member) => (
            <tr
              key={member.id}
              onClick={() => setOpenId(member.id)}
              tabIndex={0}
              role="button"
              aria-label={`View contact details for ${member.name}`}
              style={{ cursor: "pointer" }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setOpenId(member.id);
                }
              }}
            >
              <td data-label="Name" className={styles.cardPrimaryCell}>
                {member.name}
              </td>
              <td data-label="Title">{member.title || "—"}</td>
              <td data-label="Email">{member.email}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <Modal open={openStaff !== null} onClose={() => setOpenId(null)} title="Staff Contact">
        {openStaff && (
          <div className={styles.form}>
            <h2 className={styles.cardTitle}>{openStaff.name}</h2>
            {openStaff.title && <p className={styles.description}>{openStaff.title}</p>}
            <table className={`${styles.table} ${styles.keyValueTable}`}>
              <tbody>
                <tr>
                  <td>Email</td>
                  <td>
                    <a href={`mailto:${openStaff.email}`} className={styles.link}>
                      {openStaff.email}
                    </a>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </Modal>
    </>
  );
}
