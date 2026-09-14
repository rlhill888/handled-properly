"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  upsertVendorEventDetails,
  inviteVendor,
  revokeVendorAccess,
  restoreVendorAccess,
  removeVendorLocationPhoto,
  type ActionState,
} from "./actions";
import SubmitButton from "@/components/portal/SubmitButton";
import type { VendorEventDetailData } from "./data";
import styles from "@/styles/admin-shared.module.css";

// timestamptz -> the local "YYYY-MM-DDTHH:mm" a datetime-local input wants.
// Round-trips through the browser's own timezone, matching how the value
// gets turned back into an ISO string in upsertVendorEventDetails.
function toDatetimeLocalValue(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function VendorDetailRow({
  eventId,
  vendor,
}: {
  eventId: string;
  vendor: VendorEventDetailData;
}) {
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const boundUpsert = upsertVendorEventDetails.bind(null, eventId, vendor.contactId);
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(boundUpsert, null);
  const wasPending = useRef(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [isBusy, startTransition] = useTransition();

  useEffect(() => {
    if (wasPending.current && !isPending && state === null) {
      setEditing(false);
    }
    wasPending.current = isPending;
  }, [isPending, state]);

  const handleInvite = () => {
    setActionError(null);
    startTransition(async () => {
      const result = await inviteVendor(eventId, vendor.contactId);
      if (result?.error) setActionError(result.error);
      router.refresh();
    });
  };

  const handleRevoke = () => {
    if (!vendor.vendorId) return;
    setActionError(null);
    startTransition(async () => {
      const result = await revokeVendorAccess(vendor.vendorId!, eventId);
      if (result?.error) setActionError(result.error);
      router.refresh();
    });
  };

  const handleRestore = () => {
    if (!vendor.vendorId) return;
    setActionError(null);
    startTransition(async () => {
      const result = await restoreVendorAccess(vendor.vendorId!, eventId);
      if (result?.error) setActionError(result.error);
      router.refresh();
    });
  };

  const handleRemovePhoto = () => {
    setActionError(null);
    startTransition(async () => {
      const result = await removeVendorLocationPhoto(eventId, vendor.contactId);
      if (result?.error) setActionError(result.error);
      router.refresh();
    });
  };

  const hasDetails = Boolean(vendor.arrivalTime);

  return (
    <div className={styles.accordionItem}>
      <button
        type="button"
        className={styles.accordionHeader}
        onClick={() => setExpanded((e) => !e)}
        aria-expanded={expanded}
      >
        <span className={styles.accordionTitle}>{vendor.name}</span>
        {/* accordionHeader is space-between, so badges are grouped with the
            chevron in their own flex row -- otherwise, with the title as a
            third/fourth child, space-between spreads them apart instead of
            keeping them flush next to the dropdown icon. */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
          {!hasDetails && <span className={styles.badgeMuted}>needs details</span>}
          {vendor.needs.length > 0 && (
            <span className={styles.badgeMuted}>
              {vendor.needs.length} item{vendor.needs.length === 1 ? "" : "s"} requested
            </span>
          )}
          {vendor.inviteStatus && (
            <span className={vendor.inviteStatus === "active" ? styles.badge : styles.badgeMuted}>
              {vendor.inviteStatus}
            </span>
          )}
          <span
            className={`${styles.accordionChevron} ${expanded ? styles.accordionChevronOpen : ""}`}
            aria-hidden="true"
          >
            ▾
          </span>
        </div>
      </button>

      {expanded && (
        <div className={styles.accordionBody}>
          {!editing ? (
            <>
              <table className={`${styles.table} ${styles.keyValueTable}`}>
                <tbody>
                  <tr>
                    <td>Email</td>
                    <td>{vendor.email}</td>
                  </tr>
                  <tr>
                    <td>Arrival</td>
                    <td>
                      {vendor.arrivalTime ? new Date(vendor.arrivalTime).toLocaleString() : "Not set"}
                      {vendor.arrivalLocation ? ` — ${vendor.arrivalLocation}` : ""}
                    </td>
                  </tr>
                  {vendor.setupTime && (
                    <tr>
                      <td>Setup</td>
                      <td>
                        {new Date(vendor.setupTime).toLocaleString()}
                        {vendor.setupLocation ? ` — ${vendor.setupLocation}` : ""}
                      </td>
                    </tr>
                  )}
                  {vendor.locationPhotoUrl && (
                    <tr>
                      <td>Setup photo</td>
                      <td>
                        <img
                          src={vendor.locationPhotoUrl}
                          alt="Where this vendor should set up"
                          style={{ maxWidth: 240, borderRadius: 4, display: "block", marginBottom: 8 }}
                        />
                        <button type="button" className={styles.secondaryButton} onClick={handleRemovePhoto} disabled={isBusy}>
                          Remove photo
                        </button>
                      </td>
                    </tr>
                  )}
                  {vendor.needs.length > 0 && (
                    <tr>
                      <td>Requested items</td>
                      <td>
                        <ul style={{ margin: 0, paddingLeft: 18 }}>
                          {vendor.needs.map((need) => (
                            <li key={need.id}>{need.item}</li>
                          ))}
                        </ul>
                      </td>
                    </tr>
                  )}
                  {vendor.parkingInstructions && (
                    <tr>
                      <td>Parking</td>
                      <td>{vendor.parkingInstructions}</td>
                    </tr>
                  )}
                  {vendor.adminNotes && (
                    <tr>
                      <td>Admin notes</td>
                      <td>{vendor.adminNotes}</td>
                    </tr>
                  )}
                  {vendor.accessExpiresAfterEvent && (
                    <tr>
                      <td>Access expires after event</td>
                      <td>Yes</td>
                    </tr>
                  )}
                </tbody>
              </table>
              {actionError && <p className={styles.error}>{actionError}</p>}
              <div className={styles.actions}>
                <button type="button" className={styles.secondaryButton} onClick={() => setEditing(true)}>
                  Edit Details
                </button>
                {!vendor.inviteStatus && (
                  <button
                    type="button"
                    className={styles.secondaryButton}
                    onClick={handleInvite}
                    disabled={isBusy}
                  >
                    {isBusy ? "Inviting…" : "Invite to Vendor Portal"}
                  </button>
                )}
                {vendor.inviteStatus === "revoked" && (
                  <button
                    type="button"
                    className={styles.secondaryButton}
                    onClick={handleRestore}
                    disabled={isBusy}
                  >
                    {isBusy ? "Restoring…" : "Restore Access"}
                  </button>
                )}
                {(vendor.inviteStatus === "active" || vendor.inviteStatus === "invited") && (
                  <button
                    type="button"
                    className={styles.dangerButton}
                    onClick={handleRevoke}
                    disabled={isBusy}
                  >
                    Revoke Access
                  </button>
                )}
              </div>
            </>
          ) : (
            <form action={formAction} className={styles.form}>
              {state?.error && <p className={styles.error}>{state.error}</p>}

              <div className={styles.formRow}>
                <div className={styles.field}>
                  <label className={styles.label}>Arrival time</label>
                  <input
                    name="arrival_time"
                    type="datetime-local"
                    defaultValue={toDatetimeLocalValue(vendor.arrivalTime)}
                    required
                    className={styles.input}
                  />
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>Arrival location</label>
                  <input
                    name="arrival_location"
                    defaultValue={vendor.arrivalLocation ?? ""}
                    required
                    className={styles.input}
                  />
                </div>
              </div>

              <div className={styles.formRow}>
                <div className={styles.field}>
                  <label className={styles.label}>
                    Setup time <span className={styles.optional}>(optional)</span>
                  </label>
                  <input
                    name="setup_time"
                    type="datetime-local"
                    defaultValue={toDatetimeLocalValue(vendor.setupTime)}
                    className={styles.input}
                  />
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>
                    Setup location <span className={styles.optional}>(optional)</span>
                  </label>
                  <input
                    name="setup_location"
                    defaultValue={vendor.setupLocation ?? ""}
                    className={styles.input}
                  />
                </div>
              </div>

              <div className={styles.field}>
                <label className={styles.label}>
                  Setup location photo <span className={styles.optional}>(optional)</span>
                </label>
                <input name="photo" type="file" accept="image/*" className={styles.input} />
              </div>

              <div className={styles.field}>
                <label className={styles.label}>Parking instructions</label>
                <textarea
                  name="parking_instructions"
                  defaultValue={vendor.parkingInstructions ?? ""}
                  className={styles.textarea}
                />
              </div>

              <div className={styles.field}>
                <label className={styles.label}>
                  Admin notes <span className={styles.optional}>(private — the vendor never sees this)</span>
                </label>
                <textarea name="admin_notes" defaultValue={vendor.adminNotes ?? ""} className={styles.textarea} />
              </div>

              <div className={styles.checkboxRow}>
                <label>
                  <input
                    type="checkbox"
                    name="access_expires_after_event"
                    defaultChecked={vendor.accessExpiresAfterEvent}
                  />{" "}
                  Expire this vendor&apos;s portal login once the event is completed
                </label>
              </div>

              <div className={styles.actions}>
                <SubmitButton pendingLabel="Saving…">Save</SubmitButton>
                <button type="button" className={styles.secondaryButton} onClick={() => setEditing(false)}>
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
