import { getAboutPageContent, getSocialLinks, getFeaturedItems } from "@/lib/data/site-content";
import AboutForm from "./AboutForm";
import SocialLinkList from "./SocialLinkList";
import NewSocialLinkForm from "./NewSocialLinkForm";
import FeaturedItemList from "./FeaturedItemList";
import NewFeaturedItemForm from "./NewFeaturedItemForm";
import AddModalButton from "@/components/portal/AddModalButton";
import styles from "@/styles/admin-shared.module.css";

export default async function AboutAndConnectAdminPage() {
  const [about, socialLinks, featuredItems] = await Promise.all([
    getAboutPageContent(),
    getSocialLinks(),
    getFeaturedItems(),
  ]);

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <span className={styles.eyebrow}>Website</span>
          <h1 className={styles.title}>About &amp; Connect</h1>
          <p className={styles.description}>Content shown on the public /about-and-connect page.</p>
        </div>
      </div>

      <div className={styles.card}>
        <h2 className={styles.title} style={{ fontSize: 18, marginTop: 0 }}>
          Headshot &amp; About Text
        </h2>
        <AboutForm about={about} />
      </div>

      <div className={styles.card}>
        <div className={styles.titleRow}>
          <h2 className={styles.title} style={{ fontSize: 18, marginTop: 0 }}>
            Social Links
          </h2>
          <AddModalButton label="New Social Link" modalTitle="New Social Link">
            <NewSocialLinkForm />
          </AddModalButton>
        </div>
        <p className={styles.description}>Icon buttons shown under the headshot — each opens its link in a new tab.</p>
        <SocialLinkList links={socialLinks} />
      </div>

      <div className={styles.card}>
        <div className={styles.titleRow}>
          <h2 className={styles.title} style={{ fontSize: 18, marginTop: 0 }}>
            Featured Items
          </h2>
          <AddModalButton label="New Featured Item" modalTitle="New Featured Item">
            <NewFeaturedItemForm />
          </AddModalButton>
        </div>
        <p className={styles.description}>Things you sell or want to promote — image, title, description, and an optional link.</p>
        <FeaturedItemList items={featuredItems} />
      </div>
    </div>
  );
}
