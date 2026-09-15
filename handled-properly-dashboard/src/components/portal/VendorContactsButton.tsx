"use client";

import { useState } from "react";
import Modal from "@/components/portal/Modal";
import ClientVendorsList, { type ClientVendorData } from "@/components/portal/ClientVendorsList";
import ClientStaffList, { type ClientStaffData } from "@/components/portal/ClientStaffList";
import PeopleIcon from "@/components/portal/PeopleIcon";
import styles from "@/styles/admin-shared.module.css";

// Opens the combined vendor/staff contact list in a modal in place, rather
// than navigating to a separate page — mirrors the same click-to-modal
// pattern used for Event Tasks and Assignments elsewhere in the portal.
export default function VendorContactsButton({
  vendors,
  staff,
}: {
  vendors: ClientVendorData[];
  staff: ClientStaffData[];
}) {
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
          <p className={styles.resourceCardTitle}>Vendor and Event Staff Contacts</p>
          <p className={styles.resourceCardSubtitle}>View vendor and staff contact list</p>
        </div>
        <span className={styles.resourceCardArrow} aria-hidden="true">
          →
        </span>
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title="Vendor and Event Staff Contacts">
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div>
            <h3 className={styles.sectionHeading}>Vendors</h3>
            <ClientVendorsList vendors={vendors} />
          </div>
          <div>
            <h3 className={styles.sectionHeading}>Event Staff</h3>
            <ClientStaffList staff={staff} />
          </div>
        </div>
      </Modal>
    </>
  );
}
