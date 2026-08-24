"use client";

import { useState, useTransition } from "react";
import { setStaffCanStartConversations } from "../actions";
import styles from "@/styles/admin-shared.module.css";

export default function ConversationSettingToggle({
  eventId,
  initialAllowed,
  disabled,
}: {
  eventId: string;
  initialAllowed: boolean;
  disabled: boolean;
}) {
  const [allowed, setAllowed] = useState(initialAllowed);
  const [isPending, startTransition] = useTransition();

  const handleChange = (checked: boolean) => {
    setAllowed(checked);
    startTransition(() => {
      setStaffCanStartConversations(eventId, checked);
    });
  };

  return (
    <label className={styles.checkboxRow}>
      <input
        type="checkbox"
        checked={allowed}
        disabled={disabled || isPending}
        onChange={(e) => handleChange(e.target.checked)}
      />
      Staff can start conversations for this event
    </label>
  );
}
