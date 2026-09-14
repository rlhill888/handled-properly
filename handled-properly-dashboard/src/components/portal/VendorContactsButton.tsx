"use client";

import { useState } from "react";
import Modal from "@/components/portal/Modal";
import ClientVendorsList, { type ClientVendorData } from "@/components/portal/ClientVendorsList";
import PeopleIcon from "@/components/portal/PeopleIcon";
import styles from "@/styles/admin-shared.module.css";

// Opens the vendor list in a modal in place, rather than navigating to a
// separate page — mirrors the same click-to-modal pattern used for Event
// Tasks and Assignments elsewhere in the portal.
export default function VendorContactsButton({ vendors }: { vendors: ClientVendorData[] }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        className={styles.resourceCard}
        style={{ width: "100%", font: "inherit", textAlign: "left", cursor: "pointer" }}
        onClick={() => setOpen(true)}
      >
        <div className={styles.iconBox}>
          <PeopleIcon size={18} />
        </div>
        <div className={styles.resourceCardBody}>
          <p className={styles.resourceCardTitle}>Vendor contacts</p>
          <p className={styles.resourceCardSubtitle}>View vendor contact list</p>
        </div>
        <span className={styles.resourceCardArrow} aria-hidden="true">
          →
        </span>
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title="Vendor Contacts">
        <ClientVendorsList vendors={vendors} />
      </Modal>
    </>
  );
}
