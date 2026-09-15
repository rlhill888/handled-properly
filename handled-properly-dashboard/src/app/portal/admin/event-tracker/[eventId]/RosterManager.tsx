"use client";

import { useRef, useState, useTransition } from "react";
import { addToRoster, removeFromRoster, setRosterTitle } from "../actions";
import SelectDropdown from "@/components/portal/SelectDropdown";
import Modal from "@/components/portal/Modal";
import NewStaffForm from "@/app/portal/admin/staff/NewStaffForm";
import { useRouter } from "next/navigation";
import styles from "@/styles/admin-shared.module.css";

export type StaffOption = { id: string; name: string; email: string };
export type RosterMemberData = StaffOption & { title: string | null };

// The admin's free-text title for this Staff member on this Event (e.g.
// "Modeling Director") — saves on blur/Enter rather than needing its own
// Save button, since it's a single field in an already-dense table row.
// Visible to the Client too (see ClientStaffList) — no separate RLS policy
// needed, roster_entries' existing SELECT policies already expose it.
function RosterTitleCell({
  eventId,
  eventStaffId,
  initialTitle,
  disabled,
  onError,
}: {
  eventId: string;
  eventStaffId: string;
  initialTitle: string | null;
  disabled: boolean;
  onError: (message: string | null) => void;
}) {
  const [value, setValue] = useState(initialTitle ?? "");
  const [isPending, startTransition] = useTransition();
  const lastSaved = useRef(initialTitle ?? "");

  const save = () => {
    const trimmed = value.trim();
    if (trimmed === lastSaved.current) return;
    onError(null);
    startTransition(async () => {
      const result = await setRosterTitle(eventId, eventStaffId, trimmed || null);
      if (result?.error) onError(result.error);
      else lastSaved.current = trimmed;
    });
  };

  return (
    <input
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onBlur={save}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          (e.target as HTMLInputElement).blur();
        }
      }}
      placeholder="e.g. Modeling Director"
      disabled={disabled || isPending}
      className={styles.input}
    />
  );
}

export default function RosterManager({
  eventId,
  rosterMembers,
  availableStaff,
  isLocked,
}: {
  eventId: string;
  rosterMembers: RosterMemberData[];
  availableStaff: StaffOption[];
  isLocked: boolean;
}) {
  const router = useRouter();
  const [selectedStaffId, setSelectedStaffId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [inviteOpen, setInviteOpen] = useState(false);

  const handleAdd = () => {
    if (!selectedStaffId) return;
    setError(null);
    startTransition(async () => {
      const result = await addToRoster(eventId, selectedStaffId);
      if (result?.error) setError(result.error);
      else setSelectedStaffId("");
    });
  };

  const handleRemove = (staffId: string) => {
    setError(null);
    startTransition(async () => {
      const result = await removeFromRoster(eventId, staffId);
      if (result?.error) setError(result.error);
    });
  };

  return (
    <div className={styles.form}>
      {error && <p className={styles.error}>{error}</p>}

      {rosterMembers.length === 0 ? (
        <p className={styles.emptyState}>No staff on this event&apos;s roster yet.</p>
      ) : (
        <table className={`${styles.table} ${styles.cardRows}`}>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Title</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {rosterMembers.map((member) => (
              <tr key={member.id}>
                <td data-label="Name" className={styles.cardPrimaryCell}>
                  {member.name}
                </td>
                <td data-label="Email">{member.email}</td>
                <td data-label="Title">
                  <RosterTitleCell
                    eventId={eventId}
                    eventStaffId={member.id}
                    initialTitle={member.title}
                    disabled={isLocked}
                    onError={setError}
                  />
                </td>
                <td className={styles.cardActionCell}>
                  {!isLocked && (
                    <button
                      type="button"
                      className={styles.dangerButton}
                      disabled={isPending}
                      onClick={() => handleRemove(member.id)}
                    >
                      Remove
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {!isLocked && (
        <div className={styles.formRow}>
          <SelectDropdown
            options={availableStaff.map((staff) => ({
              id: staff.id,
              label: `${staff.name} (${staff.email})`,
            }))}
            value={selectedStaffId}
            onChange={setSelectedStaffId}
            placeholder="Add staff to roster…"
            searchable
            searchPlaceholder="Search staff…"
            createLabel="Invite New Staff"
            onCreate={() => setInviteOpen(true)}
          />
          <button
            type="button"
            className={styles.secondaryButton}
            disabled={!selectedStaffId || isPending}
            onClick={handleAdd}
          >
            Add
          </button>
        </div>
      )}

      <Modal open={inviteOpen} onClose={() => setInviteOpen(false)} title="Invite Staff">
        <NewStaffForm
          onCreated={() => {
            setInviteOpen(false);
            router.refresh();
          }}
        />
      </Modal>
    </div>
  );
}
