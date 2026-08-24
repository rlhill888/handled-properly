"use client";

import { useActionState, useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import { setPassword, type ActionState } from "./actions";
import styles from "../signin/portal.module.css";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className={styles.submit} disabled={pending}>
      <span>{pending ? "Saving..." : "Set Password"}</span>
      <span className={styles.submitArrow} aria-hidden="true">
        ↗
      </span>
    </button>
  );
}

export default function SetPasswordPage() {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(
    setPassword,
    null
  );
  const wasPending = useRef(false);

  useEffect(() => {
    if (wasPending.current && !isPending && state === null) {
      router.push("/portal");
      router.refresh();
    }
    wasPending.current = isPending;
  }, [isPending, state, router]);

  return (
    <main className={styles.page}>
      <div className={styles.card}>
        <a href="/" className={styles.logo}>
          <span className={styles.logoText}>HANDLED PROPERLY</span>
        </a>

        <div className={styles.heading}>
          <span className={styles.eyebrow}>Welcome</span>
          <h1 className={styles.title}>Set your password</h1>
        </div>

        <form className={styles.form} action={formAction}>
          <label className={styles.field}>
            <span className={styles.fieldLabel}>Password</span>
            <input
              type="password"
              name="password"
              autoComplete="new-password"
              required
              minLength={8}
              className={styles.input}
              placeholder="••••••••"
            />
          </label>

          <label className={styles.field}>
            <span className={styles.fieldLabel}>Confirm password</span>
            <input
              type="password"
              name="confirm_password"
              autoComplete="new-password"
              required
              minLength={8}
              className={styles.input}
              placeholder="••••••••"
            />
          </label>

          {state?.error && <p className={styles.error}>{state.error}</p>}

          <SubmitButton />
        </form>
      </div>
    </main>
  );
}
