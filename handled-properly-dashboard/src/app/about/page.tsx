import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ScrollReveal from "@/components/ScrollReveal";
import ArrowIcon from "@/components/icons/ArrowIcon";
import { getAboutPage, getAboutValues } from "@/lib/data/site-content";
import styles from "./about.module.css";

// Hand-coded, not Content-Block-driven -- see
// docs/adr/0031-about-page-hand-coded-not-block-driven.md -- but its seven
// named sections (Hero/Introduction, Our Story, Who We Are, What We Do,
// Our Mission, Our Vision, Our Values) plus a closing CTA are each
// admin-editable, via their own dedicated fields. See
// docs/adr/0034-about-page-editable-fields-not-blocks.md and
// docs/adr/0035-about-page-seven-sections.md. Admin content, so this
// can't statically prerender.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "About — Handled Properly",
  description: "Learn about Handled Properly, the all-in-one portal for planning unforgettable events.",
};

function paragraphs(body: string): string[] {
  return body
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);
}

// This site's drifting wave/grid line-art motif (same technique as the
// homepage's Hero/BuiltForMoments/ClosingCta) -- shared by every black
// section on this page (Our Story, What We Do, Our Vision, the closing
// CTA) rather than four copies of the same SVG markup. Each section wraps
// it in position: relative; overflow: hidden (see .story/.what/.vision/
// .cta in about.module.css) since this renders position: absolute; inset:
// 0 via .whatArt.
function WaveTexture() {
  return (
    <svg className={styles.whatArt} viewBox="0 0 800 500" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <path
        className={`${styles.whatWave} ${styles.whatWave1}`}
        d="M -50 340 C 150 260, 300 420, 500 300 C 650 220, 750 280, 850 240"
        stroke="rgba(255,255,255,0.16)"
        strokeWidth="2"
        fill="none"
      />
      <path
        className={`${styles.whatWave} ${styles.whatWave2}`}
        d="M -50 380 C 150 300, 300 460, 500 340 C 650 260, 750 320, 850 280"
        stroke="rgba(255,255,255,0.09)"
        strokeWidth="2"
        fill="none"
      />
      <g stroke="rgba(255,255,255,0.07)" strokeWidth="1">
        {Array.from({ length: 9 }).map((_, i) => (
          <line key={`v-${i}`} x1={i * 100} y1="0" x2={i * 100} y2="500" />
        ))}
        {Array.from({ length: 6 }).map((_, i) => (
          <line key={`h-${i}`} x1="0" y1={i * 100} x2="800" y2={i * 100} />
        ))}
      </g>
    </svg>
  );
}

export default async function AboutPage() {
  const [about, values] = await Promise.all([getAboutPage(), getAboutValues()]);

  const headlineLines = about.headline.split("\n").map((line) => line.trim()).filter(Boolean);

  return (
    <>
      <Navbar />
      <main className={styles.page}>
        {/* 1. Hero / Introduction -- white, the first beat of the page's
            alternating white/black/white... rhythm (see the comment on
            .hero in about.module.css). Immediately in view on load, so
            this is the one section that animates on a load-time stagger
            (see .reveal below) rather than a scroll-triggered one;
            there's nothing to scroll past to see it. */}
        <section className={styles.hero}>
          <div className={styles.heroText}>
            <p className={`${styles.eyebrow} ${styles.reveal}`} style={{ animationDelay: "0.02s" }}>
              <span className={styles.eyebrowLine} />
              ABOUT US
            </p>
            <h1 className={styles.headline}>
              {headlineLines.map((line, i) => (
                <span
                  key={i}
                  className={`${styles.headlineLine} ${
                    i === headlineLines.length - 1 ? styles.headlineMuted : ""
                  } ${styles.reveal}`}
                  style={{ animationDelay: `${0.14 + i * 0.1}s` }}
                >
                  {line}
                </span>
              ))}
            </h1>
            {about.heroIntro && (
              <p className={`${styles.heroIntro} ${styles.reveal}`} style={{ animationDelay: "0.5s" }}>
                {about.heroIntro}
              </p>
            )}
            {about.heroTagline && (
              <p className={`${styles.heroTagline} ${styles.reveal}`} style={{ animationDelay: "0.62s" }}>
                <span className={styles.heroTaglineBar} aria-hidden="true" />
                {about.heroTagline}
              </p>
            )}
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={about.heroImageUrl ?? "/about/hero.png"}
            alt=""
            className={`${styles.heroImage} ${styles.reveal}`}
            style={{ animationDelay: "0.74s" }}
          />
        </section>

        {/* 2. Our Story -- black, full-bleed edge to edge on desktop (see
            the comment on .hero in about.module.css), same drifting
            wave/grid texture as every other black section on this page --
            image beside text, centered at the page's usual 1440px width
            via the inner .sectionRow wrapper. */}
        <ScrollReveal as="section" className={styles.story}>
          <WaveTexture />
          <div className={styles.sectionRow}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={about.storyImageUrl ?? "/about/story.png"} alt="" className={styles.storyImage} />
            <div className={styles.storyText}>
              <p className={styles.kicker}>OUR STORY</p>
              {paragraphs(about.storyBody).map((p, i) => (
                <p key={i} className={styles.storyParagraph}>
                  {p}
                </p>
              ))}
            </div>
          </div>
        </ScrollReveal>

        {/* 3. Who We Are -- text/image order flipped from Our Story for
            rhythm, and back to white -- sections alternate white/black
            down the page (see the comment on .hero in about.module.css). */}
        <ScrollReveal as="section" className={styles.who}>
          <div className={styles.sectionRow}>
            <div className={styles.storyText}>
              <p className={styles.kicker}>WHO WE ARE</p>
              {paragraphs(about.whoWeAreBody).map((p, i) => (
                <p key={i} className={styles.storyParagraph}>
                  {p}
                </p>
              ))}
            </div>
            {about.whoWeAreImageUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={about.whoWeAreImageUrl} alt="" className={styles.storyImage} />
            )}
          </div>
        </ScrollReveal>

        {/* 4. What We Do -- black, full-bleed edge to edge on desktop (see
            the comment on .hero in about.module.css), this site's
            drifting wave/grid line-art motif (same technique as the
            homepage's Hero/BuiltForMoments/ClosingCta) now spanning the
            full section width too, not just its 1440px content column. */}
        <ScrollReveal as="section" className={styles.what}>
          <WaveTexture />
          <div className={styles.whatContent}>
            {about.whatWeDoImageUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={about.whatWeDoImageUrl} alt="" className={styles.whatImage} />
            )}
            <div className={styles.whatText}>
              <p className={styles.kickerLight}>WHAT WE DO</p>
              {paragraphs(about.whatWeDoBody).map((p, i) => (
                <p key={i} className={styles.whatParagraph}>
                  {p}
                </p>
              ))}
            </div>
          </div>
        </ScrollReveal>

        {/* 5. Our Mission -- white for the section itself, with a dark,
            rounded "statement" card inside it: a photo with a scrim and
            large centered text over it (same full-bleed-photo + gradient-
            scrim + overlaid-white-text technique the /about-and-connect
            profile card uses), rather than another side-by-side section
            -- the one section on this page meant to read as a single bold
            declaration. Not full-bleed -- it's white, and was already an
            inset card rather than an edge-to-edge section. */}
        <ScrollReveal as="section" className={styles.mission}>
          <div className={styles.missionCard}>
            {about.missionImageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={about.missionImageUrl} alt="" className={styles.missionImage} />
            ) : (
              <div className={styles.missionPlaceholder} aria-hidden="true" />
            )}
            <div className={styles.missionScrim} aria-hidden="true" />
            <div className={styles.missionContent}>
              <p className={styles.kickerLight}>OUR MISSION</p>
              {paragraphs(about.missionBody).map((p, i) => (
                <p key={i} className={styles.missionParagraph}>
                  {p}
                </p>
              ))}
            </div>
          </div>
        </ScrollReveal>

        {/* 6. Our Vision -- back to black, full-bleed edge to edge on
            desktop (see the comment on .hero in about.module.css), same
            drifting wave/grid texture as every other black section: a
            tall image card with the same shine sweep the
            /about-and-connect profile photo uses, beside the text -- the
            flourish that makes this section its own thing rather than a
            repeat of Our Story. */}
        <ScrollReveal as="section" className={styles.vision}>
          <WaveTexture />
          <div className={styles.sectionRow}>
            <div className={styles.storyText}>
              <p className={styles.kicker}>OUR VISION</p>
              {paragraphs(about.visionBody).map((p, i) => (
                <p key={i} className={styles.storyParagraph}>
                  {p}
                </p>
              ))}
            </div>
            <div className={styles.visionImageWrap}>
              {about.visionImageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={about.visionImageUrl} alt="" className={styles.visionImage} />
              ) : (
                <div className={styles.missionPlaceholder} aria-hidden="true" />
              )}
              <span className={styles.visionShine} aria-hidden="true" />
            </div>
          </div>
        </ScrollReveal>

        {/* 7. Our Values -- white, one section-level photo as a slim
            banner above the grid of short title+description cards
            (unchanged shape from the previous "what makes us different"
            grid, just reframed as principles -- see AboutValue in
            site-content.ts). Not full-bleed, like Our Mission. */}
        {values.length > 0 && (
          <ScrollReveal as="section" className={styles.values}>
            <p className={styles.kicker}>OUR VALUES</p>
            {about.valuesImageUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={about.valuesImageUrl} alt="" className={styles.valuesImage} />
            )}
            <div className={styles.valuesGrid}>
              {values.map((value, index) => (
                <div key={value.id} className={styles.valueItem}>
                  <span className={styles.valueNumber}>{String(index + 1).padStart(2, "0")}</span>
                  <p className={styles.valueTitle}>{value.title}</p>
                  <p className={styles.valueDescription}>{value.description}</p>
                </div>
              ))}
            </div>
          </ScrollReveal>
        )}

        {/* 8. Closing CTA -- black, same line-art treatment as every other
            black section on this page and the homepage's own ClosingCta.
            Not full-bleed -- like Our Mission/Our Values, it's an inset
            card, matching every other marketing page on this site closing
            on a dark CTA. */}
        <ScrollReveal as="section" className={styles.cta}>
          <WaveTexture />
          <h2 className={styles.ctaHeading}>{about.ctaHeading}</h2>
          <a href="/get-started" className={styles.ctaButton}>
            <span>{about.ctaButtonText}</span>
            <ArrowIcon direction="up-right" />
          </a>
        </ScrollReveal>
      </main>
      <Footer />
    </>
  );
}
