"use client";

import { useActionState, useEffect, useState } from "react";
import { updateAboutPage, type ActionState } from "./actions";
import SubmitButton from "@/components/portal/SubmitButton";
import styles from "@/styles/admin-shared.module.css";
import type { AboutPage } from "@/lib/data/site-content";

// One image upload + optional "remove current image" checkbox, reused for
// all seven of the page's section images -- each behaves identically
// (instant local preview via an object URL, same as every other image
// field across the admin site), so this is the one place that logic
// lives instead of seven near-identical copies of it.
function ImageField({
  idPrefix,
  fileFieldName,
  removeFieldName,
  label,
  currentUrl,
}: {
  idPrefix: string;
  fileFieldName: string;
  removeFieldName: string;
  label: string;
  currentUrl: string | null;
}) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setPreviewUrl(file ? URL.createObjectURL(file) : null);
  };

  const displayUrl = previewUrl ?? currentUrl;

  return (
    <>
      {displayUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={displayUrl}
          alt=""
          className={styles.eventHeaderImage}
          style={{ maxHeight: 160, width: "auto" }}
        />
      )}

      <div className={styles.field}>
        <label className={styles.label} htmlFor={`${idPrefix}-image`}>
          {currentUrl ? `Replace ${label.toLowerCase()}` : label} <span className={styles.optional}>(optional)</span>
        </label>
        <input
          id={`${idPrefix}-image`}
          name={fileFieldName}
          type="file"
          accept="image/*"
          className={styles.input}
          onChange={handleChange}
        />
      </div>

      {currentUrl && !previewUrl && (
        <label className={styles.checkboxRow}>
          <input type="checkbox" name={removeFieldName} />
          Remove current {label.toLowerCase()}
        </label>
      )}
    </>
  );
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h3 style={{ fontSize: 14, fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase", margin: "8px 0 -8px" }}>
      {children}
    </h3>
  );
}

export default function AboutPageForm({ about }: { about: AboutPage }) {
  const [state, formAction] = useActionState<ActionState, FormData>(updateAboutPage, null);

  return (
    <form action={formAction} className={styles.form}>
      {state?.error && <p className={styles.error}>{state.error}</p>}

      <SectionHeading>Hero / Introduction</SectionHeading>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="about-headline">
          Headline
        </label>
        <textarea
          id="about-headline"
          name="headline"
          rows={3}
          defaultValue={about.headline}
          className={styles.input}
          placeholder={"Big moments.\nSmall details.\nHandled properly."}
        />
        <p className={styles.optional}>One line per line break. The last line is shown in a lighter, muted color.</p>
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="about-hero-intro">
          Short intro — who you are
        </label>
        <textarea
          id="about-hero-intro"
          name="hero_intro"
          rows={3}
          defaultValue={about.heroIntro}
          className={styles.input}
        />
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="about-hero-tagline">
          One-line mission / positioning
        </label>
        <input
          id="about-hero-tagline"
          name="hero_tagline"
          defaultValue={about.heroTagline}
          className={styles.input}
        />
      </div>

      <ImageField
        idPrefix="about-hero"
        fileFieldName="hero_image"
        removeFieldName="remove_hero_image"
        label="Hero photo"
        currentUrl={about.heroImageUrl}
      />

      <SectionHeading>Our Story</SectionHeading>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="about-story-body">
          Where it started, the original idea, key moments along the way
        </label>
        <textarea
          id="about-story-body"
          name="story_body"
          rows={8}
          defaultValue={about.storyBody}
          className={styles.input}
        />
        <p className={styles.optional}>Leave a blank line between paragraphs.</p>
      </div>

      <ImageField
        idPrefix="about-story"
        fileFieldName="story_image"
        removeFieldName="remove_story_image"
        label="Story photo"
        currentUrl={about.storyImageUrl}
      />

      <SectionHeading>Who We Are</SectionHeading>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="about-who-we-are-body">
          The people behind it, backgrounds, what brings everyone together
        </label>
        <textarea
          id="about-who-we-are-body"
          name="who_we_are_body"
          rows={6}
          defaultValue={about.whoWeAreBody}
          className={styles.input}
        />
      </div>

      <ImageField
        idPrefix="about-who-we-are"
        fileFieldName="who_we_are_image"
        removeFieldName="remove_who_we_are_image"
        label="Photo"
        currentUrl={about.whoWeAreImageUrl}
      />

      <SectionHeading>What We Do</SectionHeading>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="about-what-we-do-body">
          Core products/services, what you provide, and who for
        </label>
        <textarea
          id="about-what-we-do-body"
          name="what_we_do_body"
          rows={6}
          defaultValue={about.whatWeDoBody}
          className={styles.input}
        />
      </div>

      <ImageField
        idPrefix="about-what-we-do"
        fileFieldName="what_we_do_image"
        removeFieldName="remove_what_we_do_image"
        label="Photo"
        currentUrl={about.whatWeDoImageUrl}
      />

      <SectionHeading>Our Mission</SectionHeading>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="about-mission-body">
          Why you exist, the change you&apos;re trying to create
        </label>
        <textarea
          id="about-mission-body"
          name="mission_body"
          rows={6}
          defaultValue={about.missionBody}
          className={styles.input}
        />
      </div>

      <ImageField
        idPrefix="about-mission"
        fileFieldName="mission_image"
        removeFieldName="remove_mission_image"
        label="Photo"
        currentUrl={about.missionImageUrl}
      />

      <SectionHeading>Our Vision</SectionHeading>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="about-vision-body">
          Where you&apos;re going, what the future looks like if you succeed
        </label>
        <textarea
          id="about-vision-body"
          name="vision_body"
          rows={6}
          defaultValue={about.visionBody}
          className={styles.input}
        />
      </div>

      <ImageField
        idPrefix="about-vision"
        fileFieldName="vision_image"
        removeFieldName="remove_vision_image"
        label="Photo"
        currentUrl={about.visionImageUrl}
      />

      <SectionHeading>Our Values</SectionHeading>
      <p className={styles.optional} style={{ marginTop: -8 }}>
        One section photo — the individual value cards themselves are managed below, in their own list.
      </p>

      <ImageField
        idPrefix="about-values"
        fileFieldName="values_image"
        removeFieldName="remove_values_image"
        label="Photo"
        currentUrl={about.valuesImageUrl}
      />

      <SectionHeading>Closing CTA</SectionHeading>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="about-cta-heading">
          Heading
        </label>
        <input id="about-cta-heading" name="cta_heading" defaultValue={about.ctaHeading} className={styles.input} />
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="about-cta-button-text">
          Button text
        </label>
        <input
          id="about-cta-button-text"
          name="cta_button_text"
          defaultValue={about.ctaButtonText}
          className={styles.input}
        />
      </div>

      <div className={styles.actions}>
        <SubmitButton pendingLabel="Saving…">Save Changes</SubmitButton>
      </div>
    </form>
  );
}
