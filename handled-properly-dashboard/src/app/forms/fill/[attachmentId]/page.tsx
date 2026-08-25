import { notFound } from "next/navigation";
import { getFillAttachment } from "./data";
import FormFillView from "./FormFillView";

export default async function FormFillPage({
  params,
}: {
  params: Promise<{ attachmentId: string }>;
}) {
  const { attachmentId } = await params;
  const attachment = await getFillAttachment(attachmentId);

  if (!attachment) notFound();

  return (
    <FormFillView
      attachmentId={attachment.id}
      templateName={attachment.templateName}
      templateDescription={attachment.templateDescription}
      fields={attachment.fields}
    />
  );
}
