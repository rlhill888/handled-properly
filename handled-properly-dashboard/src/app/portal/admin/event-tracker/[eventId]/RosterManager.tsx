"use client";

import { useState, useTransition } from "react";
import { addToRoster, removeFromRoster } from "../actions";
import styles from "@/styles/admin-shared.module.css";

export type StaffOption = { id: string; name: string; email: string };

export default function RosterManager({
  eventId,
  rosterMembers,
  availableStaff,
  isLocked,
}: {
  eventId: string;
  rosterMembers: StaffOption[];
  availableStaff: StaffOption[];
  isLocked: boolean;
}) {
  const [selectedStaffId, setSelectedStaffId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

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
        <p className={styles.emptyState}>No staff on this event's roster yet.</p>
      ) : (
        <table className={styles.table}>
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
                <td>{member.name}</td>
                <td>{member.email}</td>
                <td>
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
          <select
            className={styles.select}
            value={selectedStaffId}
            onChange={(e) => setSelectedStaffId(e.target.value)}
          >
            <option value="">Add staff to roster…</option>
            {availableStaff.map((staff) => (
              <option key={staff.id} value={staff.id}>
                {staff.name} ({staff.email})
              </option>
            ))}
          </select>
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
    </div>
  );
}
