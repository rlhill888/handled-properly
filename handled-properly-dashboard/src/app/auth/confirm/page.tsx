"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import styles from "../../portal/signin/portal.module.css";

// Landing point for every Supabase Auth email link (invite, password
// reset, etc.). GoTrue's own /verify endpoint does the token exchange and
// redirects here with the session delivered as a URL *hash fragment*
// (#access_token=...&refresh_token=...) — fragments never reach the
// server, so this has to run client-side rather than as a Route Handler.
function ConfirmContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const next = searchParams.get("next") ?? "/portal";
    const hashParams = new URLSearchParams(window.location.hash.slice(1));
    const accessToken = hashParams.get("access_token");
    const refreshToken = hashParams.get("refresh_token");

    if (!accessToken || !refreshToken) {
      setError("invite-link-invalid");
      return;
    }

    const supabase = createClient();
    supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken }).then(
      ({ error: sessionError }) => {
        if (sessionError) {
          setError("invite-link-invalid");
          return;
        }
        router.replace(next);
      }
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (error) {
    return (
      <p className={styles.error}>
        This link is invalid or has expired. Ask an admin to send a new invite.
      </p>
    );
  }

  return <p className={styles.subtext}>Confirming…</p>;
}

export default function AuthConfirmPage() {
  return (
    <main className={styles.page}>
      <div className={styles.card}>
        <Suspense fallback={<p className={styles.subtext}>Confirming…</p>}>
          <ConfirmContent />
        </Suspense>
      </div>
    </main>
  );
}
