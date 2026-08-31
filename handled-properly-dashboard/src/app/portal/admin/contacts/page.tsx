import Link from "next/link";
import { createClient as createSupabaseServerClient } from "@/lib/supabase/server";
import CategoryManager from "./CategoryManager";
import NewCategoryForm from "./NewCategoryForm";
import NewContactForm from "./NewContactForm";
import ContactsList from "./ContactsList";
import { type ContactRowData } from "./ContactRow";
import AddModalButton from "@/components/portal/AddModalButton";
import styles from "@/styles/admin-shared.module.css";

export default async function ContactsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category: categoryFilter } = await searchParams;
  const supabase = await createSupabaseServerClient();

  const [{ data: contacts, error }, { data: categories }] = await Promise.all([
    supabase
      .from("contacts")
      .select(
        "id, name, email, phone, clients(id), event_staff(id), contact_categories(category_id), event_attendance(events(id,name))"
      )
      .order("name", { ascending: true }),
    supabase.from("categories").select("id, name").order("name", { ascending: true }),
  ]);

  const categoryOptions = categories ?? [];

  let rows: ContactRowData[] = (contacts ?? []).map((row) => ({
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    isClient: row.clients !== null,
    isStaff: row.event_staff !== null,
    categoryIds: row.contact_categories.map((cc) => cc.category_id),
    attendingEventNames: row.event_attendance
      .map((ea) => ea.events?.name)
      .filter((name): name is string => Boolean(name)),
  }));

  if (categoryFilter) {
    rows = rows.filter((row) => row.categoryIds.includes(categoryFilter));
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <span className={styles.eyebrow}>Admin</span>
          <div className={styles.titleRow}>
            <h1 className={styles.title}>Contacts</h1>
            <AddModalButton label="Add Contact" modalTitle="Add Contact">
              <NewContactForm />
            </AddModalButton>
          </div>
          <p className={styles.description}>
            Every Client and Event Staff member automatically appears here. Add anyone else — and
            tag categories or event attendance — manually.
          </p>
        </div>
      </div>

      {error && <p className={styles.error}>Could not load contacts: {error.message}</p>}

      <div className={styles.card}>
        <div className={styles.cardHeaderRow}>
          <h2 className={styles.cardTitle} style={{ marginBottom: 0 }}>
            Categories
          </h2>
          <AddModalButton label="Add Category" modalTitle="Add Category">
            <NewCategoryForm />
          </AddModalButton>
        </div>
        <CategoryManager categories={categoryOptions} />
      </div>

      <div className={styles.card}>
        <div className={styles.header} style={{ marginBottom: 0 }}>
          <h2 className={styles.cardTitle}>All Contacts ({rows.length})</h2>
          <div className={styles.metaRow}>
            <Link
              href="/portal/admin/contacts"
              className={!categoryFilter ? styles.badge : styles.badgeMuted}
            >
              All
            </Link>
            {categoryOptions.map((category) => (
              <Link
                key={category.id}
                href={`/portal/admin/contacts?category=${category.id}`}
                className={categoryFilter === category.id ? styles.badge : styles.badgeMuted}
              >
                {category.name}
              </Link>
            ))}
          </div>
        </div>

        <ContactsList contacts={rows} allCategories={categoryOptions} />
      </div>
    </div>
  );
}
