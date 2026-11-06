import { PageBody } from "@/components/page/page-body";
import { CertificateTemplateEditor } from "@/features/certificates/certificate-template-editor";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <PageBody>
      <CertificateTemplateEditor id={id} />
    </PageBody>
  );
}
