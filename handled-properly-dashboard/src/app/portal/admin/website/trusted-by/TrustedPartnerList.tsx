"use client";

import { useState, useTransition } from "react";
import { deleteTrustedPartner } from "./actions";
import Modal from "@/components/portal/Modal";
import EditTrustedPartnerForm from "./EditTrustedPartnerForm";
import styles from "@/styles/admin-shared.module.css";
import type { TrustedPartner } from "@/lib/data/site-content";

export default function TrustedPartnerList({ partners }: { partners: TrustedPartner[] }) {
  const [editing, setEditing] = useState<TrustedPartner | null>(null);
  const [, startTransition] = useTransition();

  const handleDelete = (partner: TrustedPartner) => {
    if (!confirm(`Remove "${partner.name}" from the Trusted By list?`)) return;
    startTransition(() => {
      deleteTrustedPartner(partner.id);
    });
  };

  if (partners.length === 0) {
    return <p className={styles.emptyState}>No trusted partners yet.</p>;
  }

  return (
    <>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Logo</th>
            <th>Name</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {partners.map((partner) => (
            <tr key={partner.id}>
              <td>
                {partner.logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={partner.logoUrl} alt="" style={{ height: 28, width: "auto" }} />
                ) : (
                  <span className={styles.emptyState}>—</span>
                )}
              </td>
              <td>{partner.name}</td>
              <td>
                <div className={styles.actions}>
                  <button
                    type="button"
                    className={styles.secondaryButton}
                    onClick={() => setEditing(partner)}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    className={styles.dangerButton}
                    onClick={() => handleDelete(partner)}
                  >
                    Remove
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <Modal open={editing !== null} onClose={() => setEditing(null)} title="Edit Trusted Partner">
        {editing && <EditTrustedPartnerForm partner={editing} />}
      </Modal>
    </>
  );
}
