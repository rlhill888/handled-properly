import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import BuiltForMoments from "@/components/BuiltForMoments";
import TrustedBy from "@/components/TrustedBy";
import Services from "@/components/Services";
import HowItWorks from "@/components/HowItWorks";
import FeaturedEvents from "@/components/FeaturedEvents";
import ClosingCta from "@/components/ClosingCta";
import Footer from "@/components/Footer";
import AmbientBackground from "@/components/AmbientBackground";
import HeroPeekAdjuster from "@/components/HeroPeekAdjuster";
import { getTrustedPartners, getFeaturedBlogPosts } from "@/lib/data/site-content";
import styles from "./page.module.css";

// Admin-edited content (Trusted By, Featured Events) must show up on the
// next page load, not just the next deploy -- without this, Next prerenders
// the page once at build time as static HTML (see the "○ /" build output)
// since nothing here otherwise triggers dynamic rendering.
export const dynamic = "force-dynamic";

export default async function Home() {
  const [partners, featuredPosts] = await Promise.all([
    getTrustedPartners(),
    getFeaturedBlogPosts(4),
  ]);

  return (
    <main className={styles.main}>
      <AmbientBackground />
      <HeroPeekAdjuster />
      <Navbar />
      <div className={styles.hero}>
        <Hero />
      </div>
      {/* data-peek-card: HeroPeekAdjuster measures this wrapper on mount/
          resize and sets its margin-bottom so Featured Events peeks a
          consistent amount above the fold regardless of device height --
          see that component for why a fixed CSS margin can't do this. */}
      <div className={styles.builtForMoments} data-peek-card>
        <BuiltForMoments />
      </div>
      {/* TrustedBy/Services/FeaturedEvents each reveal their own pieces
          internally (per card/logo, staggered) rather than being wrapped
          as one lump here -- matches how bjp-vending-website's homepage
          applies ScrollReveal at the individual-block level. */}
      <div className={styles.trustedBy}>
        <TrustedBy partners={partners} />
      </div>
      <div className={styles.services}>
        <Services />
      </div>
      {/* HowItWorks pins itself (position: sticky) while its own
          scroll-linked progress crossfades between steps; a reveal
          wrapper's persistent `transform` on its visible state would
          change the sticky element's containing block in some browsers,
          breaking the pin. Its own crossfade already provides the
          "reveal" here. */}
      <div className={styles.howItWorks}>
        <HowItWorks />
      </div>
      {/* Mobile only (see page.module.css): reordered to sit directly
          under BuiltForMoments instead of after HowItWorks. */}
      <div className={styles.featuredEvents}>
        <FeaturedEvents posts={featuredPosts} />
      </div>
      <div className={styles.closingCta}>
        <ClosingCta />
      </div>
      <div className={styles.footer}>
        <Footer />
      </div>
    </main>
  );
}
