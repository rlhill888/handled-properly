"use client";

import { useActionState, useMemo, useState } from "react";
import { createEvent, type ActionState } from "./actions";
import SubmitButton from "@/components/portal/SubmitButton";
import styles from "@/styles/admin-shared.module.css";

type ClientOption = { id: string; name: string };
type SeriesOption = { id: string; label: string; clientId: string };

export default function NewEventForm({
  clients,
  series,
}: {
  clients: ClientOption[];
  series: SeriesOption[];
}) {
  const [state, formAction] = useActionState<ActionState, FormData>(createEvent, null);
  const [clientId, setClientId] = useState("");
  const [seriesMode, setSeriesMode] = useState<"one_time" | "existing_series" | "new_series">(
    "one_time"
  );

  const seriesForClient = useMemo(
    () => series.filter((s) => s.clientId === clientId),
    [series, clientId]
  );

  return (
    <form action={formAction} className={styles.form}>
      {state?.error && <p className={styles.error}>{state.error}</p>}

      <div className={styles.formRow}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="client_id">
            Client
          </label>
          <select
            id="client_id"
            name="client_id"
            required
            className={styles.select}
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
          >
            <option value="" disabled>
              Select a client…
            </option>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.name}
              </option>
            ))}
          </select>
        </div>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="name">
            Event Name
          </label>
          <input id="name" name="name" required className={styles.input} placeholder="Fall Gala" />
        </div>
      </div>

      <div className={styles.formRow}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="starts_at">
            Date &amp; time <span className={styles.optional}>(optional)</span>
          </label>
          <input
            id="starts_at"
            name="starts_at"
            type="datetime-local"
            className={styles.input}
          />
        </div>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="location">
            Location <span className={styles.optional}>(optional)</span>
          </label>
          <input id="location" name="location" className={styles.input} />
        </div>
      </div>

      <div className={styles.field}>
        <span className={styles.label}>Recurrence</span>
        <div className={styles.checkboxRow}>
          <label>
            <input
              type="radio"
              name="series_mode"
              value="one_time"
              checked={seriesMode === "one_time"}
              onChange={() => setSeriesMode("one_time")}
            />{" "}
            One-time event
          </label>
        </div>
        <div className={styles.checkboxRow}>
          <label>
            <input
              type="radio"
              name="series_mode"
              value="existing_series"
              checked={seriesMode === "existing_series"}
              onChange={() => setSeriesMode("existing_series")}
              disabled={seriesForClient.length === 0}
            />{" "}
            Add to an existing series
          </label>
        </div>
        <div className={styles.checkboxRow}>
          <label>
            <input
              type="radio"
              name="series_mode"
              value="new_series"
              checked={seriesMode === "new_series"}
              onChange={() => setSeriesMode("new_series")}
            />{" "}
            Start a new series
          </label>
        </div>
      </div>

      {seriesMode === "existing_series" && (
        <div className={styles.field}>
          <label className={styles.label} htmlFor="existing_series_id">
            Series
          </label>
          <select id="existing_series_id" name="existing_series_id" className={styles.select}>
            <option value="" disabled>
              Select a series…
            </option>
            {seriesForClient.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
      )}

      {seriesMode === "new_series" && (
        <div className={styles.field}>
          <label className={styles.label} htmlFor="new_series_label">
            Series name
          </label>
          <input
            id="new_series_label"
            name="new_series_label"
            className={styles.input}
            placeholder="Weekly Sound Check"
          />
        </div>
      )}

      <div className={styles.actions}>
        <SubmitButton pendingLabel="Creating…">Create Event</SubmitButton>
      </div>
    </form>
  );
}
