import { createClient as createSupabaseServerClient } from "@/lib/supabase/server";
import NewVendorForm from "./NewVendorForm";
import VendorList, { type VendorRowData } from "./VendorList";
import AddModalButton from "@/components/portal/AddModalButton";
import styles from "@/styles/admin-shared.module.css";

export default async function VendorsPage() {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("vendors")
    .select("id, category, contacts(name, email, phone)")
    .order("created_at", { ascending: false });

  const vendors: VendorRowData[] = (data ?? [])
    .filter((row) => row.contacts !== null)
    .map((row) => ({
      id: row.id,
      name: row.contacts!.name,
      email: row.contacts!.email,
      phone: row.contacts!.phone,
      category: row.category,
    }));

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <span className={styles.eyebrow}>Admin</span>
          <div className={styles.titleRow}>
            <h1 className={styles.title}>Vendors</h1>
            <AddModalButton label="Add Vendor" modalTitle="Add Vendor">
              <NewVendorForm />
            </AddModalButton>
          </div>
          <p className={styles.description}>
            External vendors (caterers, photographers, ...) you can add to an Event&apos;s Vendor
            list for the client to see. Vendors don&apos;t log in.
          </p>
        </div>
      </div>

      {error && <p className={styles.error}>Could not load vendors: {error.message}</p>}

      <VendorList vendors={vendors} />
    </div>
  );
}
