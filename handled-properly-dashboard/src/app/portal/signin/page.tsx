"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import styles from "./portal.module.css";

export default function PortalLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const supabase = createClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        setError(signInError.message);
        return;
      }

      // /portal looks up whether this session belongs to the admin or an
      // event staff member and redirects to the right section.
      router.push("/portal");
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className={styles.page}>
      <div className={styles.card}>
        <a href="/" className={styles.logo}>
          <span className={styles.logoText}>HANDLED PROPERLY</span>
        </a>

        <div className={styles.heading}>
          <span className={styles.eyebrow}>Staff Portal</span>
          <h1 className={styles.title}>Sign in</h1>
        </div>

        <form className={styles.form} onSubmit={handleSubmit}>
          <label className={styles.field}>
            <span className={styles.fieldLabel}>Email</span>
            <input
              type="email"
              name="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={styles.input}
              placeholder="you@handledproperly.com"
            />
          </label>

          <label className={styles.field}>
            <span className={styles.fieldLabel}>Password</span>
            <input
              type="password"
              name="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={styles.input}
              placeholder="••••••••"
            />
          </label>

          {error && <p className={styles.error}>{error}</p>}

          <button type="submit" className={styles.submit} disabled={submitting}>
            <span>{submitting ? "Signing in..." : "Sign In"}</span>
            <span className={styles.submitArrow} aria-hidden="true">
              ↗
            </span>
          </button>
        </form>

        <p className={styles.footnote}>
          Staff access is by invitation. Contact an admin if you need an
          account.
        </p>
      </div>
    </main>
  );
}
