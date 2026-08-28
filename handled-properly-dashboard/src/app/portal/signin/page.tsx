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
      <section className={styles.brandPanel}>
        <svg
          className={styles.brandArt}
          viewBox="0 0 800 600"
          preserveAspectRatio="xMidYMid slice"
          aria-hidden="true"
        >
          <rect width="800" height="600" fill="#0a0a0a" />
          <path
            d="M -50 420 C 150 320, 300 520, 500 380 C 650 280, 750 360, 850 300"
            stroke="rgba(255,255,255,0.55)"
            strokeWidth="2"
            fill="none"
          />
          <path
            d="M -50 470 C 150 380, 300 560, 500 430 C 650 340, 750 410, 850 350"
            stroke="rgba(255,255,255,0.3)"
            strokeWidth="2"
            fill="none"
          />
          <path
            d="M -50 380 C 150 270, 300 470, 500 330 C 650 230, 750 310, 850 250"
            stroke="rgba(255,255,255,0.18)"
            strokeWidth="2"
            fill="none"
          />
          <g stroke="rgba(255,255,255,0.08)" strokeWidth="1">
            {Array.from({ length: 9 }).map((_, i) => (
              <line key={`v-${i}`} x1={i * 100} y1="0" x2={i * 100} y2="600" />
            ))}
            {Array.from({ length: 7 }).map((_, i) => (
              <line key={`h-${i}`} x1="0" y1={i * 100} x2="800" y2={i * 100} />
            ))}
          </g>
        </svg>

        <a href="/" className={styles.brandLogo}>
          <span className={styles.brandLogoMark} aria-hidden="true" />
          <span className={styles.brandLogoText}>HANDLED PROPERLY</span>
        </a>

        <div className={styles.brandContent}>
          <p className={styles.brandEyebrow}>Staff Portal</p>
          <h1 className={styles.brandHeadline}>
            EVERY EVENT,
            <br />
            HANDLED PROPERLY.
          </h1>
        </div>

        <p className={styles.brandFootnote}>
          © {new Date().getFullYear()} Handled Properly. All rights reserved.
        </p>
      </section>

      <section className={styles.formPanel}>
        <div className={styles.card}>
          <a href="/" className={styles.cardLogo}>
            <span className={styles.logoMark} aria-hidden="true" />
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
      </section>
    </main>
  );
}
