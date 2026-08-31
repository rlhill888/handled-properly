"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateStaffNotes } from "./actions";
import type { StaffMemberData } from "./data";
import Modal from "@/components/portal/Modal";
import styles from "@/styles/admin-shared.module.css";

export default function StaffList({ staff }: { staff: StaffMemberData[] }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [notesDraft, setNotesDraft] = useState("");

  const editingMember = staff.find((m) => m.id === editingId) ?? null;

  const openEdit = (member: StaffMemberData) => {
    setEditingId(member.id);
    setNotesDraft(member.notes ?? "");
  };

  const handleSaveNotes = () => {
    if (!editingId) return;
    setError(null);
    startTransition(async () => {
      const result = await updateStaffNotes(editingId, notesDraft);
      if (result?.error) setError(result.error);
      router.refresh();
    });
  };

  // Search matches name, email, or any roster category this person has
  // ever been tagged with (across every event) — e.g. "Catering" surfaces
  // anyone who's ever been assigned that roster category.
  const q = query.trim().toLowerCase();
  const matches = (member: StaffMemberData) => {
    if (!q) return true;
    return (
      member.name.toLowerCase().includes(q) ||
      member.email.toLowerCase().includes(q) ||
      member.categoryNames.some((name) => name.toLowerCase().includes(q))
    );
  };

  const activeStaff = staff.filter((m) => m.isActive && matches(m));
  const pastStaff = staff.filter((m) => !m.isActive && matches(m));

  const renderTable = (members: StaffMemberData[], emptyLabel: string) =>
    members.length === 0 ? (
      <p className={styles.emptyState}>{emptyLabel}</p>
    ) : (
      <table className={`${styles.table} ${styles.cardRows}`}>
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Phone</th>
            <th>Status</th>
            <th>Tags</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {members.map((member) => (
            <tr key={member.id}>
              <td data-label="Name" className={styles.cardPrimaryCell}>
                {member.name}
              </td>
              <td data-label="Email">{member.email}</td>
              <td data-label="Phone">{member.phone || "—"}</td>
              <td data-label="Status">
                <span className={member.inviteStatus === "active" ? styles.badge : styles.badgeMuted}>
                  {member.inviteStatus}
                </span>
              </td>
              <td data-label="Tags">
                {member.categoryNames.length === 0 ? (
                  "—"
                ) : (
                  <div className={styles.metaRow}>
                    {member.categoryNames.map((name) => (
                      <span key={name} className={styles.pill}>
                        {name}
                      </span>
                    ))}
                  </div>
                )}
              </td>
              <td className={styles.cardActionCell}>
                <button
                  type="button"
                  className={styles.secondaryButton}
                  onClick={() => openEdit(member)}
                >
                  Notes
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    );

  return (
    <div className={styles.form}>
      {error && <p className={styles.error}>{error}</p>}

      <div className={styles.field}>
        <label className={styles.label} htmlFor="staff-search">
          Search
        </label>
        <input
          id="staff-search"
          type="search"
          className={styles.input}
          placeholder="Search by name, email, or tag…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      <div className={styles.card}>
        <h2 className={styles.cardTitle}>Active ({activeStaff.length})</h2>
        <p className={styles.description}>Currently on the roster of at least one active event.</p>
        {renderTable(activeStaff, "No staff currently on an active event.")}
      </div>

      <div className={styles.card}>
        <h2 className={styles.cardTitle}>Past ({pastStaff.length})</h2>
        <p className={styles.description}>Not currently on any active event&apos;s roster.</p>
        {renderTable(pastStaff, "No past staff.")}
      </div>

      <Modal
        open={editingId !== null}
        onClose={() => setEditingId(null)}
        title={editingMember ? `Notes — ${editingMember.name}` : "Notes"}
      >
        {editingMember && (
          <div className={styles.form}>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="staff-notes">
                Notes
              </label>
              <textarea
                id="staff-notes"
                className={styles.textarea}
                rows={4}
                value={notesDraft}
                onChange={(e) => setNotesDraft(e.target.value)}
              />
            </div>

            <div className={styles.actions}>
              <button
                type="button"
                className={styles.secondaryButton}
                disabled={isPending}
                onClick={handleSaveNotes}
              >
                Save Notes
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
