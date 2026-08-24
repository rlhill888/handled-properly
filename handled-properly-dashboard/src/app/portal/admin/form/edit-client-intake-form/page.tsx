import FormBuilder, { type FormField } from "@/components/FormBuilder";
import styles from "./edit.module.css";

const NEW_CLIENT_INTAKE_FIELDS: FormField[] = [
  { id: "client-name", label: "Client Name", type: "text", required: true },
  { id: "email", label: "Email", type: "email", required: true },
  { id: "phone", label: "Phone Number", type: "tel", required: false },
  { id: "event-type", label: "Event Type", type: "select", required: true },
  { id: "event-date", label: "Event Date", type: "date", required: true },
  {
    id: "guest-count",
    label: "Estimated Guest Count",
    type: "number",
    required: false,
  },
  {
    id: "notes",
    label: "Additional Notes",
    type: "textarea",
    required: false,
  },
];

export default function EditClientIntakeFormPage() {
  return (
    <div className={styles.page}>
      <a href="/portal/admin/form" className={styles.back}>
        ← Back to Forms
      </a>

      <span className={styles.eyebrow}>Admin</span>
      <h1 className={styles.title}>Edit Client Intake Form</h1>
      <p className={styles.description}>
        Customize the fields clients see when they fill out the intake form.
      </p>

      <div className={styles.builderWrapper}>
        <FormBuilder initialFields={NEW_CLIENT_INTAKE_FIELDS} />
      </div>
    </div>
  );
}
