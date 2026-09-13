"use client";

import { useState, useTransition } from "react";
import { addToRoster, removeFromRoster } from "../actions";
import SelectDropdown from "@/components/portal/SelectDropdown";
import Modal from "@/components/portal/Modal";
import NewStaffForm from "@/app/portal/admin/staff/NewStaffForm";
import { useRouter } from "next/navigation";
import styles from "@/styles/admin-shared.module.css";

export type StaffOption = { id: string; name: string; email: string };
export type RosterMemberData = StaffOption;

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
