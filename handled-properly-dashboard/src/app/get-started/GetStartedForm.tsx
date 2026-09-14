"use client";

import { useActionState } from "react";
import { submitApplication, type ActionState } from "./actions";
import styles from "./get-started.module.css";

export default function GetStartedForm() {
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(
    submitApplication,
    null,
  );

  if (state && "success" in state) {
    return (
      <div className={styles.successCard}>
        <p className={styles.successTitle}>Thanks — we got your inquiry!</p>
        <p className={styles.successBody}>
          We&apos;ll take a look and follow up soon to talk through the details.
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className={styles.form}>
      {state && "error" in state && <p className={styles.error}>{state.error}</p>}

      <div className={styles.row}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="name">
            Your name<span className={styles.required}>*</span>
          </label>
          <input id="name" name="name" required className={styles.input} placeholder="Jane Doe" />
        </div>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="email">
            Email<span className={styles.required}>*</span>
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            className={styles.input}
            placeholder="jane@example.com"
          />
        </div>
      </div>

      <div className={styles.row}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="phone">
            Phone <span className={styles.optional}>(optional)</span>
          </label>
          <input id="phone" name="phone" className={styles.input} placeholder="(555) 555-5555" />
        </div>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="company_name">
            Company / organization <span className={styles.optional}>(optional)</span>
          </label>
          <input id="company_name" name="company_name" className={styles.input} />
        </div>
      </div>

      <div className={styles.row}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="event_date">
            Event date <span className={styles.optional}>(optional)</span>
          </label>
          <input id="event_date" name="event_date" type="date" className={styles.input} />
        </div>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="guest_count">
            Estimated guest count <span className={styles.optional}>(optional)</span>
          </label>
          <input id="guest_count" name="guest_count" type="number" min="0" className={styles.input} />
        </div>
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="location">
          Event location <span className={styles.optional}>(optional)</span>
        </label>
        <input id="location" name="location" className={styles.input} placeholder="City, venue…" />
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="budget">
          Estimated budget <span className={styles.optional}>(optional)</span>
        </label>
        <input id="budget" name="budget" className={styles.input} placeholder="e.g. $5,000–$10,000" />
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="message">
          Tell us about your event<span className={styles.required}>*</span>
        </label>
        <textarea
          id="message"
          name="message"
          required
          className={styles.textarea}
          placeholder="What are you planning, and what kind of help do you need?"
        />
      </div>

      <button type="submit" className={styles.submitButton} disabled={isPending}>
        {isPending ? "Sending…" : "Send Inquiry"}
      </button>
    </form>
  );
}
