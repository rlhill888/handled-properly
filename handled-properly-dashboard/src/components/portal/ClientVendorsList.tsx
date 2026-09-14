"use client";

import { useState } from "react";
import Modal from "@/components/portal/Modal";
import styles from "@/styles/admin-shared.module.css";

export type ClientVendorData = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
};

// Clicking a vendor row opens its contact details in a modal, mirroring
// the same click-to-modal pattern used for Event Tasks and Assignments
// elsewhere in the portal.
export default function ClientVendorsList({ vendors }: { vendors: ClientVendorData[] }) {
  const [openId, setOpenId] = useState<string | null>(null);
  const openVendor = vendors.find((v) => v.id === openId) ?? null;

  if (vendors.length === 0) {
    return <p className={styles.emptyState}>No vendors on this event yet.</p>;
  }

  return (
    <>
      <table className={`${styles.table} ${styles.cardRows}`}>
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Phone</th>
          </tr>
        </thead>
        <tbody>
          {vendors.map((vendor) => (
            <tr
              key={vendor.id}
              onClick={() => setOpenId(vendor.id)}
              tabIndex={0}
              role="button"
              aria-label={`View contact details for ${vendor.name}`}
              style={{ cursor: "pointer" }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setOpenId(vendor.id);
                }
              }}
            >
              <td data-label="Name" className={styles.cardPrimaryCell}>
                {vendor.name}
              </td>
              <td data-label="Email">{vendor.email}</td>
              <td data-label="Phone">{vendor.phone || "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <Modal open={openVendor !== null} onClose={() => setOpenId(null)} title="Vendor Contact">
        {openVendor && (
          <div className={styles.form}>
            <h2 className={styles.cardTitle}>{openVendor.name}</h2>
            <table className={`${styles.table} ${styles.keyValueTable}`}>
              <tbody>
                <tr>
                  <td>Email</td>
                  <td>
                    <a href={`mailto:${openVendor.email}`} className={styles.link}>
                      {openVendor.email}
                    </a>
                  </td>
                </tr>
                <tr>
                  <td>Phone</td>
                  <td>
                    {openVendor.phone ? (
                      <a href={`tel:${openVendor.phone}`} className={styles.link}>
                        {openVendor.phone}
                      </a>
                    ) : (
                      "—"
                    )}
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
