import Link from "next/link";
import { createClient as createSupabaseServerClient } from "@/lib/supabase/server";
import ArrowIcon from "@/components/icons/ArrowIcon";
import styles from "@/styles/admin-shared.module.css";

export default async function WebsitePage() {
  const supabase = await createSupabaseServerClient();

  const [{ count: partnerCount }, { data: posts }] = await Promise.all([
    supabase.from("site_trusted_partners").select("id", { count: "exact", head: true }),
    supabase.from("site_blog_posts").select("is_featured"),
  ]);

  const postCount = posts?.length ?? 0;
  const featuredCount = posts?.filter((post) => post.is_featured).length ?? 0;

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <span className={styles.eyebrow}>Admin</span>
          <h1 className={styles.title}>Website</h1>
          <p className={styles.description}>
            Manage the public marketing site — the homepage&apos;s Trusted By strip and Featured
            Events, the Events blog, the About page, and the About &amp; Connect page.
          </p>
        </div>
      </div>

      <div className={styles.resourceGrid}>
        <Link href="/portal/admin/website/trusted-by" className={styles.resourceCard}>
          <div className={styles.resourceCardBody}>
            <p className={styles.resourceCardTitle}>Trusted By</p>
            <p className={styles.resourceCardSubtitle}>
              {partnerCount ?? 0} {partnerCount === 1 ? "partner" : "partners"}
            </p>
          </div>
          <span className={styles.resourceCardArrow}><ArrowIcon /></span>
        </Link>

        <Link href="/portal/admin/website/blog" className={styles.resourceCard}>
          <div className={styles.resourceCardBody}>
            <p className={styles.resourceCardTitle}>Events Blog</p>
            <p className={styles.resourceCardSubtitle}>
              {postCount} {postCount === 1 ? "post" : "posts"}, {featuredCount} featured
            </p>
          </div>
          <span className={styles.resourceCardArrow}><ArrowIcon /></span>
        </Link>

        <Link href="/portal/admin/website/about" className={styles.resourceCard}>
          <div className={styles.resourceCardBody}>
            <p className={styles.resourceCardTitle}>About Page</p>
            <p className={styles.resourceCardSubtitle}>Hero, Story, Who We Are, What We Do, Mission, Vision, Values, CTA</p>
          </div>
          <span className={styles.resourceCardArrow}><ArrowIcon /></span>
        </Link>

        <Link href="/portal/admin/website/about-and-connect" className={styles.resourceCard}>
          <div className={styles.resourceCardBody}>
            <p className={styles.resourceCardTitle}>About &amp; Connect</p>
            <p className={styles.resourceCardSubtitle}>Headshot, about text, social links, featured items</p>
          </div>
          <span className={styles.resourceCardArrow}><ArrowIcon /></span>
        </Link>
      </div>
    </div>
  );
}
