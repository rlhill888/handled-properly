import { notFound } from "next/navigation";
import { getFillForm } from "./data";
import FormFillView from "./FormFillView";

export default async function FormFillPage({
  params,
}: {
  params: Promise<{ formId: string }>;
}) {
  const { formId } = await params;
  const form = await getFillForm(formId);

  if (!form) notFound();

  return (
    <FormFillView
      formId={form.id}
      name={form.name}
      description={form.description}
      theme={form.theme}
      fields={form.fields}
    />
  );
}
