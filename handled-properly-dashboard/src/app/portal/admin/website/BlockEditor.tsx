"use client";

import { useState } from "react";
import {
  createEmptyBlock,
  siteImagePublicUrl,
  type Block,
  type GalleryItem,
  type FeatureItem,
} from "@/lib/blocks";
import { uploadSiteImage } from "./actions";
import RichTextEditor from "@/components/portal/RichTextEditor";
import BlockPreview from "./BlockPreview";
import sharedStyles from "@/styles/admin-shared.module.css";
import styles from "./BlockEditor.module.css";

const BLOCK_TYPE_LABELS: Record<Block["type"], string> = {
  title: "Title",
  paragraph: "Paragraph",
  image: "Image",
  image_text: "Image & Text",
  gallery: "Gallery/Carousel",
  divider: "Divider",
  features: "Features",
  cta: "Call to Action",
};

async function uploadImage(file: File): Promise<{ path: string } | { error: string }> {
  const formData = new FormData();
  formData.append("image", file);
  return uploadSiteImage(formData);
}

function ImagePicker({
  imagePath,
  onUploaded,
  label,
}: {
  imagePath: string | null;
  onUploaded: (path: string) => void;
  label: string;
}) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setIsUploading(true);
    setError(null);
    const result = await uploadImage(file);
    setIsUploading(false);

    if ("error" in result) {
      setError(result.error);
      return;
    }
    onUploaded(result.path);
  };

  return (
    <div className={styles.imageUpload}>
      {imagePath ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={siteImagePublicUrl(imagePath)} alt="" className={styles.imagePreview} />
      ) : (
        <span className={styles.imagePlaceholder}>No image</span>
      )}
      <div className={sharedStyles.field}>
        <label className={sharedStyles.secondaryButton} style={{ alignSelf: "flex-start" }}>
          {isUploading ? "Uploading…" : imagePath ? `Replace ${label}` : `Add ${label}`}
          <input type="file" accept="image/*" hidden disabled={isUploading} onChange={handleChange} />
        </label>
        {error && <p className={sharedStyles.error}>{error}</p>}
      </div>
    </div>
  );
}

function TitleBlockEditor({
  block,
  onChange,
}: {
  block: Extract<Block, { type: "title" }>;
  onChange: (b: Block) => void;
}) {
  return (
    <>
      <div className={sharedStyles.field}>
        <label className={sharedStyles.label}>
          Heading <span className={sharedStyles.optional}>(one line per row)</span>
        </label>
        <textarea
          className={sharedStyles.textarea}
          value={block.text}
          onChange={(e) => onChange({ ...block, text: e.target.value })}
          placeholder={"BIG MOMENTS.\nSMALL DETAILS."}
        />
      </div>
      <div className={sharedStyles.field}>
        <label className={sharedStyles.label}>
          Muted line <span className={sharedStyles.optional}>(optional, shown in gray after the heading)</span>
        </label>
        <textarea
          className={sharedStyles.textarea}
          value={block.mutedText ?? ""}
          onChange={(e) => onChange({ ...block, mutedText: e.target.value || null })}
          placeholder="ALL HANDLED."
        />
      </div>
      <div className={sharedStyles.field}>
        <label className={sharedStyles.label}>
          Supporting text{" "}
          <span className={sharedStyles.optional}>(optional — shows beside the heading with a divider)</span>
        </label>
        <textarea
          className={sharedStyles.textarea}
          value={block.supportingText ?? ""}
          onChange={(e) => onChange({ ...block, supportingText: e.target.value || null })}
          placeholder="We bring the moving pieces together, so you can focus on bringing people together."
        />
      </div>
    </>
  );
}

function ParagraphBlockEditor({
  block,
  onChange,
}: {
  block: Extract<Block, { type: "paragraph" }>;
  onChange: (b: Block) => void;
}) {
  return (
    <RichTextEditor
      value={block.html}
      onChange={(html) => onChange({ ...block, html })}
      placeholder="Write this section's text…"
      toolbar={["italic"]}
    />
  );
}

function ImageBlockEditor({ block, onChange }: { block: Extract<Block, { type: "image" }>; onChange: (b: Block) => void }) {
  return (
    <>
      <ImagePicker
        imagePath={block.imagePath || null}
        onUploaded={(path) => onChange({ ...block, imagePath: path })}
        label="image"
      />
      <div className={sharedStyles.field}>
        <label className={sharedStyles.label}>
          Caption <span className={sharedStyles.optional}>(optional)</span>
        </label>
        <input
          className={sharedStyles.input}
          value={block.caption ?? ""}
          onChange={(e) => onChange({ ...block, caption: e.target.value || null })}
        />
      </div>
      <label className={sharedStyles.checkboxRow}>
        <input
          type="checkbox"
          checked={block.grayscale}
          onChange={(e) => onChange({ ...block, grayscale: e.target.checked })}
        />
        Grayscale
      </label>
    </>
  );
}

function ImageTextBlockEditor({
  block,
  onChange,
}: {
  block: Extract<Block, { type: "image_text" }>;
  onChange: (b: Block) => void;
}) {
  return (
    <>
      <ImagePicker
        imagePath={block.imagePath}
        onUploaded={(path) => onChange({ ...block, imagePath: path })}
        label="image"
      />
      <RichTextEditor
        value={block.html}
        onChange={(html) => onChange({ ...block, html })}
        placeholder="Write this section's text…"
        toolbar={["bold", "italic"]}
      />
      <div className={sharedStyles.field}>
        <label className={sharedStyles.label}>
          Image height (px) <span className={sharedStyles.optional}>(blank = natural size)</span>
        </label>
        <input
          type="number"
          min={0}
          className={sharedStyles.input}
          value={block.mediaHeight ?? ""}
          onChange={(e) =>
            onChange({ ...block, mediaHeight: e.target.value === "" ? null : Number(e.target.value) })
          }
        />
      </div>
      <div className={sharedStyles.checkboxRowGroup}>
        <label className={sharedStyles.checkboxRow}>
          <input
            type="radio"
            name={`position-${block.id}`}
            checked={block.imagePosition === "left"}
            onChange={() => onChange({ ...block, imagePosition: "left" })}
          />
          Image on left
        </label>
        <label className={sharedStyles.checkboxRow}>
          <input
            type="radio"
            name={`position-${block.id}`}
            checked={block.imagePosition === "right"}
            onChange={() => onChange({ ...block, imagePosition: "right" })}
          />
          Image on right
        </label>
        <label className={sharedStyles.checkboxRow}>
          <input
            type="checkbox"
            checked={block.dark}
            onChange={(e) => onChange({ ...block, dark: e.target.checked })}
          />
          Dark statement style
        </label>
      </div>
    </>
  );
}

function GalleryBlockEditor({
  block,
  onChange,
}: {
  block: Extract<Block, { type: "gallery" }>;
  onChange: (b: Block) => void;
}) {
  const updateItem = (index: number, item: GalleryItem) => {
    const items = block.items.slice();
    items[index] = item;
    onChange({ ...block, items });
  };

  const removeItem = (index: number) => {
    onChange({ ...block, items: block.items.filter((_, i) => i !== index) });
  };

  return (
    <div className={styles.galleryList}>
      <div className={sharedStyles.checkboxRowGroup}>
        <label className={sharedStyles.checkboxRow}>
          <input
            type="radio"
            name={`gallery-display-${block.id}`}
            checked={block.displayMode === "grid"}
            onChange={() => onChange({ ...block, displayMode: "grid" })}
          />
          Grid
        </label>
        <label className={sharedStyles.checkboxRow}>
          <input
            type="radio"
            name={`gallery-display-${block.id}`}
            checked={block.displayMode === "carousel"}
            onChange={() => onChange({ ...block, displayMode: "carousel" })}
          />
          Carousel
        </label>
      </div>

      {block.displayMode === "carousel" && (
        <label className={sharedStyles.checkboxRow}>
          <input
            type="checkbox"
            checked={block.autoplay}
            onChange={(e) => onChange({ ...block, autoplay: e.target.checked })}
          />
          Automatically advance slides (visitors can still pause and navigate manually)
        </label>
      )}

      {block.items.map((item, index) => (
        <div key={index} className={styles.galleryItem}>
          <ImagePicker
            imagePath={item.imagePath || null}
            onUploaded={(path) => updateItem(index, { ...item, imagePath: path })}
            label="image"
          />
          <div className={styles.galleryItemFields}>
            <input
              className={sharedStyles.input}
              placeholder="Title (optional)"
              value={item.title ?? ""}
              onChange={(e) => updateItem(index, { ...item, title: e.target.value || null })}
            />
            <input
              className={sharedStyles.input}
              placeholder="Caption (optional)"
              value={item.caption ?? ""}
              onChange={(e) => updateItem(index, { ...item, caption: e.target.value || null })}
            />
            <button
              type="button"
              className={sharedStyles.dangerButton}
              style={{ alignSelf: "flex-start" }}
              onClick={() => removeItem(index)}
            >
              Remove
            </button>
          </div>
        </div>
      ))}

      <label className={sharedStyles.secondaryButton} style={{ alignSelf: "flex-start" }}>
        Add Image
        <input
          type="file"
          accept="image/*"
          hidden
          onChange={async (e) => {
            const file = e.target.files?.[0];
            e.target.value = "";
            if (!file) return;
            const result = await uploadImage(file);
            if ("error" in result) return;
            onChange({
              ...block,
              items: [...block.items, { imagePath: result.path, title: null, caption: null }],
            });
          }}
        />
      </label>
    </div>
  );
}

function FeaturesBlockEditor({
  block,
  onChange,
}: {
  block: Extract<Block, { type: "features" }>;
  onChange: (b: Block) => void;
}) {
  const updateItem = (index: number, item: FeatureItem) => {
    const items = block.items.slice();
    items[index] = item;
    onChange({ ...block, items });
  };

  const removeItem = (index: number) => {
    onChange({ ...block, items: block.items.filter((_, i) => i !== index) });
  };

  return (
    <div className={styles.galleryList}>
      {block.items.map((item, index) => (
        <div key={index} className={sharedStyles.card}>
          <div className={sharedStyles.field}>
            <label className={sharedStyles.label}>
              {String(index + 1).padStart(2, "0")} — Title
            </label>
            <input
              className={sharedStyles.input}
              value={item.title}
              onChange={(e) => updateItem(index, { ...item, title: e.target.value })}
              placeholder="Clarity at every step."
            />
          </div>
          <div className={sharedStyles.field} style={{ marginTop: 8 }}>
            <label className={sharedStyles.label}>Description</label>
            <textarea
              className={sharedStyles.textarea}
              value={item.description}
              onChange={(e) => updateItem(index, { ...item, description: e.target.value })}
              placeholder="From ideas to itineraries, keep everything organized and easy to manage."
            />
          </div>
          <button
            type="button"
            className={sharedStyles.dangerButton}
            style={{ alignSelf: "flex-start", marginTop: 8 }}
            onClick={() => removeItem(index)}
          >
            Remove
          </button>
        </div>
      ))}

      <button
        type="button"
        className={sharedStyles.secondaryButton}
        style={{ alignSelf: "flex-start" }}
        onClick={() => onChange({ ...block, items: [...block.items, { title: "", description: "" }] })}
      >
        Add Item
      </button>
    </div>
  );
}

function CtaBlockEditor({
  block,
  onChange,
}: {
  block: Extract<Block, { type: "cta" }>;
  onChange: (b: Block) => void;
}) {
  return (
    <>
      <div className={sharedStyles.field}>
        <label className={sharedStyles.label}>
          Heading <span className={sharedStyles.optional}>(one line per row)</span>
        </label>
        <textarea
          className={sharedStyles.textarea}
          value={block.heading}
          onChange={(e) => onChange({ ...block, heading: e.target.value })}
          placeholder={"YOUR NEXT EVENT.\nHANDLED PROPERLY."}
        />
      </div>
      <div className={sharedStyles.formRow}>
        <div className={sharedStyles.field}>
          <label className={sharedStyles.label}>Button text</label>
          <input
            className={sharedStyles.input}
            value={block.buttonText}
            onChange={(e) => onChange({ ...block, buttonText: e.target.value })}
          />
        </div>
        <div className={sharedStyles.field}>
          <label className={sharedStyles.label}>Button link</label>
          <input
            className={sharedStyles.input}
            value={block.buttonHref}
            onChange={(e) => onChange({ ...block, buttonHref: e.target.value })}
            placeholder="/get-started"
          />
        </div>
      </div>
      <label className={sharedStyles.checkboxRow}>
        <input
          type="checkbox"
          checked={block.dark}
          onChange={(e) => onChange({ ...block, dark: e.target.checked })}
        />
        Dark background
      </label>
    </>
  );
}

export default function BlockEditor({
  initialBlocks,
  fieldName = "blocks",
}: {
  initialBlocks: Block[];
  fieldName?: string;
}) {
  const [blocks, setBlocks] = useState<Block[]>(initialBlocks);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dropTargetIndex, setDropTargetIndex] = useState<number | null>(null);

  const updateBlock = (index: number, block: Block) => {
    setBlocks((current) => current.map((b, i) => (i === index ? block : b)));
  };

  const removeBlock = (index: number) => {
    if (!confirm("Remove this block?")) return;
    setBlocks((current) => current.filter((_, i) => i !== index));
  };

  const moveBlock = (index: number, direction: -1 | 1) => {
    setBlocks((current) => {
      const target = index + direction;
      if (target < 0 || target >= current.length) return current;
      const next = current.slice();
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  // Backing logic for the drag handle -- moveBlock only swaps adjacent
  // items, but a drag can drop a block several positions away in one go.
  const moveBlockTo = (from: number, to: number) => {
    if (from === to) return;
    setBlocks((current) => {
      const next = current.slice();
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
  };

  const addBlock = (type: Block["type"]) => {
    setBlocks((current) => [...current, createEmptyBlock(type)]);
  };

  return (
    <div className={sharedStyles.field}>
      <div className={styles.blockHeader}>
        <span className={sharedStyles.label}>Page Content</span>
        <button
          type="button"
          className={sharedStyles.secondaryButton}
          onClick={() => setPreviewOpen(true)}
          disabled={blocks.length === 0}
        >
          Preview
        </button>
      </div>

      <div className={styles.list}>
        {blocks.map((block, index) => (
          <div
            key={block.id}
            className={[
              styles.block,
              draggedIndex === index ? styles.blockDragging : "",
              dropTargetIndex === index && draggedIndex !== index ? styles.blockDropTarget : "",
            ]
              .filter(Boolean)
              .join(" ")}
            onDragOver={(e) => {
              if (draggedIndex === null || draggedIndex === index) return;
              e.preventDefault();
              e.dataTransfer.dropEffect = "move";
              setDropTargetIndex(index);
            }}
            onDrop={(e) => {
              e.preventDefault();
              if (draggedIndex !== null) moveBlockTo(draggedIndex, index);
              setDraggedIndex(null);
              setDropTargetIndex(null);
            }}
          >
            <div className={styles.blockHeader}>
              <div className={styles.blockHeaderLeft}>
                <span
                  className={styles.dragHandle}
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.effectAllowed = "move";
                    e.dataTransfer.setData("text/plain", String(index));
                    setDraggedIndex(index);
                  }}
                  onDragEnd={() => {
                    setDraggedIndex(null);
                    setDropTargetIndex(null);
                  }}
                  aria-label="Drag to reorder"
                  title="Drag to reorder"
                >
                  ⠿
                </span>
                <span className={styles.blockType}>{BLOCK_TYPE_LABELS[block.type]}</span>
              </div>
              <div className={styles.blockActions}>
                <button
                  type="button"
                  className={sharedStyles.iconButton}
                  aria-label="Move up"
                  disabled={index === 0}
                  onClick={() => moveBlock(index, -1)}
                >
                  ↑
                </button>
                <button
                  type="button"
                  className={sharedStyles.iconButton}
                  aria-label="Move down"
                  disabled={index === blocks.length - 1}
                  onClick={() => moveBlock(index, 1)}
                >
                  ↓
                </button>
                <button
                  type="button"
                  className={sharedStyles.iconButtonDanger}
                  aria-label="Remove block"
                  onClick={() => removeBlock(index)}
                >
                  ×
                </button>
              </div>
            </div>

            {block.type === "title" && <TitleBlockEditor block={block} onChange={(b) => updateBlock(index, b)} />}
            {block.type === "paragraph" && (
              <ParagraphBlockEditor block={block} onChange={(b) => updateBlock(index, b)} />
            )}
            {block.type === "image" && <ImageBlockEditor block={block} onChange={(b) => updateBlock(index, b)} />}
            {block.type === "image_text" && (
              <ImageTextBlockEditor block={block} onChange={(b) => updateBlock(index, b)} />
            )}
            {block.type === "gallery" && (
              <GalleryBlockEditor block={block} onChange={(b) => updateBlock(index, b)} />
            )}
            {block.type === "divider" && <hr className={styles.dividerPreview} />}
            {block.type === "features" && (
              <FeaturesBlockEditor block={block} onChange={(b) => updateBlock(index, b)} />
            )}
            {block.type === "cta" && <CtaBlockEditor block={block} onChange={(b) => updateBlock(index, b)} />}

            <div className={sharedStyles.formRow}>
              <div className={sharedStyles.field}>
                <label className={sharedStyles.label}>Top spacing (%)</label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  step={0.5}
                  className={sharedStyles.input}
                  value={block.marginTop}
                  onChange={(e) => updateBlock(index, { ...block, marginTop: Number(e.target.value) || 0 })}
                />
              </div>
              <div className={sharedStyles.field}>
                <label className={sharedStyles.label}>Bottom spacing (%)</label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  step={0.5}
                  className={sharedStyles.input}
                  value={block.marginBottom}
                  onChange={(e) => updateBlock(index, { ...block, marginBottom: Number(e.target.value) || 0 })}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {blocks.length === 0 && <p className={sharedStyles.emptyState}>No content blocks yet — add one below.</p>}

      <div className={styles.addBlockRow}>
        {(Object.keys(BLOCK_TYPE_LABELS) as Block["type"][]).map((type) => (
          <button
            key={type}
            type="button"
            className={sharedStyles.secondaryButton}
            onClick={() => addBlock(type)}
          >
            + {BLOCK_TYPE_LABELS[type]}
          </button>
        ))}
      </div>

      <input type="hidden" name={fieldName} value={JSON.stringify(blocks)} />

      <BlockPreview blocks={blocks} open={previewOpen} onClose={() => setPreviewOpen(false)} />
    </div>
  );
}
