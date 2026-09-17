import type { Metadata } from "next";
import AmbientBackground from "@/components/AmbientBackground";
import AboutBackground from "@/components/AboutBackground";
import ImageGate from "./ImageGate";
import { getAboutPageContent, getSocialLinks, getFeaturedItems } from "@/lib/data/site-content";
import styles from "./about-and-connect.module.css";

// Admin-customizable landing/bio-link page -- headshot, about text, social
// links, and featured items all come from the database and can change
// between deploys, so (like the homepage) this can't statically
// prerender. See docs/adr/0032-about-page-editable-landing-page.md.
//
// Deliberately no <Navbar /> -- this is meant to work as a standalone
// bio-link-style page (the kind of link shared directly, e.g. in a social
// media profile), not as a page users arrive at already inside the site's
// own navigation.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "About & Connect — Handled Properly",
  description: "Connect with Handled Properly — social links and what we're sharing right now.",
};

// The about section sits next to a fixed-size photo, not a scrollable
// column of its own -- an admin pasting in a long multi-paragraph write-up
// would otherwise run on well past the photo and throw off the layout, so
// it's capped to roughly a short paragraph's worth of text. Cuts at the
// last full word rather than mid-word.
const MAX_ABOUT_CHARS = 360;

function truncateAboutBody(text: string): string {
  if (text.length <= MAX_ABOUT_CHARS) return text;
  const cut = text.slice(0, MAX_ABOUT_CHARS);
  const lastSpace = cut.lastIndexOf(" ");
  return `${cut.slice(0, lastSpace > 0 ? lastSpace : MAX_ABOUT_CHARS)}…`;
}

export default async function AboutAndConnectPage() {
  const [about, socialLinks, featuredItems] = await Promise.all([
    getAboutPageContent(),
    getSocialLinks(),
    getFeaturedItems(),
  ]);

  const aboutBody = truncateAboutBody(about.aboutBody);
  const paragraphs = aboutBody.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);

  return (
    <>
      <AmbientBackground />
      <AboutBackground />
      <ImageGate>
        <main className={styles.page}>
          <section className={styles.hero}>
            <div className={styles.profileCard}>
              {about.headshotUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={about.headshotUrl} alt="" className={styles.profileImage} />
              ) : (
                <div className={styles.profilePlaceholder} aria-hidden="true" />
              )}
              <div className={styles.profileScrim} aria-hidden="true" />
              <div className={styles.profileShine} aria-hidden="true" />

              <div className={styles.profileContent}>
                <p className={styles.profileName}>ANTHONY A SERANNO</p>

                <div className={styles.aboutBody}>
                  {paragraphs.length > 0 ? (
                    <p>{paragraphs[0]}</p>
                  ) : (
                    <p className={styles.aboutBodyEmpty}>Add about text from the admin dashboard.</p>
                  )}
                </div>

                {socialLinks.length > 0 && (
                  <div className={styles.socialRow}>
                    {socialLinks.map((link, i) => (
                      <a
                        key={link.id}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.socialButton}
                        aria-label="Social link"
                        style={{ animationDelay: `${0.25 + i * 0.04}s` }}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={link.iconUrl} alt="" className={styles.socialIcon} />
                      </a>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </section>

          {featuredItems.length > 0 && (
            <section className={styles.featured}>
              <p className={styles.kicker}>FEATURED</p>
              <div className={styles.featuredGrid}>
                {featuredItems.map((item, i) => {
                  // Alternates black/white down the list -- even cards
                  // dark, odd cards light.
                  const cardClassName = `${styles.featuredCard} ${
                    i % 2 === 0 ? styles.featuredCardDark : styles.featuredCardLight
                  }`;

                  // Rises into place after the kicker label above it
                  // (0.3s), 40ms apart per card -- see .ready .featuredCard
                  // in the CSS module.
                  const entranceStyle = { animationDelay: `${0.35 + i * 0.04}s` };

                  const content = (
                    <>
                      <span className={styles.featuredShine} aria-hidden="true" />
                      {item.imageUrl && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={item.imageUrl} alt="" className={styles.featuredIcon} />
                      )}
                      <div className={styles.featuredTextPanel}>
                        <p className={styles.featuredTitle}>{item.title}</p>
                        {item.description && <p className={styles.featuredDescription}>{item.description}</p>}
                      </div>
                    </>
                  );

                  return item.linkUrl ? (
                    <a
                      key={item.id}
                      href={item.linkUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={cardClassName}
                      style={entranceStyle}
                    >
                      {content}
                    </a>
                  ) : (
                    <div key={item.id} className={cardClassName} style={entranceStyle}>
                      {content}
                    </div>
                  );
                })}
              </div>
            </section>
          )}
        </main>
      </ImageGate>
    </>
  );
}
