import type { Block, Spacing } from "@/lib/blocks";
import Reveal from "@/components/Reveal";
import GalleryCarousel from "@/components/GalleryCarousel";
import ArrowIcon from "@/components/icons/ArrowIcon";
import styles from "./BlockRenderer.module.css";

// .section deliberately has no gap of its own (see
// docs/adr/0020-per-block-margins.md) -- each block's own margin is the
// only thing spacing it from its neighbors.
function spacingStyle(block: Spacing): React.CSSProperties {
  return { marginTop: `${block.marginTop}%`, marginBottom: `${block.marginBottom}%` };
}

// Renders a Content Block stack (an About page, or a Blog Post's body) on
// the public site. Block html is already sanitized before it reaches the
// database (see docs/adr/0019-sanitize-block-html-server-side.md) -- this
// never re-sanitizes, it just renders what was already made safe.
export default function BlockRenderer({
  blocks,
  imageUrls,
}: {
  blocks: Block[];
  // Resolved public URLs keyed by storage path -- resolving happens once,
  // server-side, in src/lib/data/site-content.ts, the same way
  // logo_path/cover_image_path/photo_path are already resolved elsewhere.
  imageUrls: Record<string, string>;
}) {
  if (blocks.length === 0) return null;

  return (
    <div className={styles.section}>
      {blocks.map((block) => {
        if (block.type === "title") {
          const textLines = block.text.split("\n").filter(Boolean);
          const mutedLines = block.mutedText?.split("\n").filter(Boolean) ?? [];
          const heading = (
            <h2 className={styles.title}>
              {textLines.map((line, i) => (
                <span key={`t${i}`} className={styles.titleLine}>
                  {line}
                </span>
              ))}
              {mutedLines.map((line, i) => (
                <span key={`m${i}`} className={`${styles.titleLine} ${styles.titleLineMuted}`}>
                  {line}
                </span>
              ))}
            </h2>
          );

          if (!block.supportingText) {
            return (
              <Reveal key={block.id} style={spacingStyle(block)}>
                {heading}
              </Reveal>
            );
          }

          return (
            <Reveal key={block.id} style={spacingStyle(block)}>
              <div className={styles.titleSplit}>
                {heading}
                <div className={styles.titleDivider} />
                <p className={styles.titleSupporting}>{block.supportingText}</p>
              </div>
            </Reveal>
          );
        }

        if (block.type === "paragraph") {
          return (
            <Reveal key={block.id} style={spacingStyle(block)}>
              <div className={styles.text} dangerouslySetInnerHTML={{ __html: block.html }} />
            </Reveal>
          );
        }

        if (block.type === "image") {
          const url = imageUrls[block.imagePath];
          if (!url) return null;
          const imageClass = [styles.imageFull, block.grayscale ? styles.imageGrayscale : ""]
            .filter(Boolean)
            .join(" ");
          return (
            <Reveal key={block.id} style={spacingStyle(block)}>
              <figure className={styles.image}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt={block.caption ?? ""} className={imageClass} />
                {block.caption && <figcaption className={styles.caption}>{block.caption}</figcaption>}
              </figure>
            </Reveal>
          );
        }

        if (block.type === "image_text") {
          const url = block.imagePath ? imageUrls[block.imagePath] : undefined;
          const containerClass = [
            styles.imageText,
            block.imagePosition === "right" ? styles.imageTextReverse : "",
            block.dark ? styles.dark : "",
          ]
            .filter(Boolean)
            .join(" ");

          return (
            <Reveal key={block.id} style={spacingStyle(block)}>
              <div className={containerClass}>
                {url && (
                  <div
                    className={styles.imageTextMedia}
                    style={block.mediaHeight ? { height: block.mediaHeight } : undefined}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={url}
                      alt=""
                      className={styles.imageTextMediaImg}
                      style={block.mediaHeight ? { height: "100%" } : undefined}
                    />
                  </div>
                )}
                <div
                  className={styles.imageTextBody}
                  dangerouslySetInnerHTML={{ __html: block.html }}
                />
              </div>
            </Reveal>
          );
        }

        if (block.type === "gallery") {
          if (block.displayMode === "carousel") {
            return (
              <Reveal key={block.id} style={spacingStyle(block)}>
                <GalleryCarousel items={block.items} imageUrls={imageUrls} autoplay={block.autoplay} />
              </Reveal>
            );
          }

          return (
            <Reveal key={block.id} style={spacingStyle(block)}>
              <div className={styles.gallery}>
                {block.items.map((item, index) => {
                  const url = imageUrls[item.imagePath];
                  if (!url) return null;
                  return (
                    <div key={index} className={styles.galleryItem}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={url} alt={item.title ?? ""} className={styles.galleryImage} />
                      {item.title && <p className={styles.galleryTitle}>{item.title}</p>}
                      {item.caption && <p className={styles.galleryCaption}>{item.caption}</p>}
                    </div>
                  );
                })}
              </div>
            </Reveal>
          );
        }

        if (block.type === "divider") {
          return (
            <Reveal key={block.id} style={spacingStyle(block)}>
              <hr className={styles.divider} />
            </Reveal>
          );
        }

        if (block.type === "features") {
          return (
            <Reveal key={block.id} style={spacingStyle(block)}>
              <div className={styles.features}>
                {block.items.map((item, index) => (
                  <div key={index} className={styles.featureItem}>
                    <span className={styles.featureNumber}>{String(index + 1).padStart(2, "0")}</span>
                    <p className={styles.featureTitle}>{item.title}</p>
                    <p className={styles.featureDescription}>{item.description}</p>
                  </div>
                ))}
              </div>
            </Reveal>
          );
        }

        if (block.type === "cta") {
          const headingLines = block.heading.split("\n").filter(Boolean);
          return (
            <Reveal key={block.id} style={spacingStyle(block)}>
              <div className={`${styles.cta} ${block.dark ? styles.ctaDark : styles.ctaLight}`}>
                <h2 className={styles.ctaHeading}>
                  {headingLines.map((line, i) => (
                    <span key={i} className={styles.ctaHeadingLine}>
                      {line}
                    </span>
                  ))}
                </h2>
                <a href={block.buttonHref} className={styles.ctaButton}>
                  <span>{block.buttonText}</span>
                  <ArrowIcon direction="up-right" />
                </a>
              </div>
            </Reveal>
          );
        }

        return null;
      })}
    </div>
  );
}
