"use client";

import { useActionState } from "react";
import { updateAboutContent, type ActionState } from "./actions";
import SubmitButton from "@/components/portal/SubmitButton";
import BlockEditor from "../BlockEditor";
import styles from "@/styles/admin-shared.module.css";
import type { AboutContent } from "@/lib/data/site-content";

export default function AboutForm({ about }: { about: AboutContent }) {
  const [state, formAction] = useActionState<ActionState, FormData>(updateAboutContent, null);

  return (
    <form action={formAction} className={styles.form}>
      {state?.error && <p className={styles.error}>{state.error}</p>}

      <BlockEditor initialBlocks={about.blocks} />

      <div className={styles.actions}>
        <SubmitButton pendingLabel="Saving…">Save Changes</SubmitButton>
      </div>
    </form>
  );
}
