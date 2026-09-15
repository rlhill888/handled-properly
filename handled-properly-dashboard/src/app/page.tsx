import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import TrustedBy from "@/components/TrustedBy";
import Services from "@/components/Services";
import FeaturedEvents from "@/components/FeaturedEvents";
import Footer from "@/components/Footer";
import Reveal from "@/components/Reveal";
import AmbientBackground from "@/components/AmbientBackground";
import { getTrustedPartners, getFeaturedBlogPosts } from "@/lib/data/site-content";

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
    <main>
      <AmbientBackground />
      <Navbar />
      <Hero />
      <Reveal>
        <TrustedBy partners={partners} />
      </Reveal>
      <Reveal>
        <Services />
      </Reveal>
      <Reveal>
        <FeaturedEvents posts={featuredPosts} />
      </Reveal>
      <Footer />
    </main>
  );
}
