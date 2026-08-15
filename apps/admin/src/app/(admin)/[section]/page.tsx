import { notFound } from "next/navigation";
import { AdminSectionPage } from "@/features/admin-section/components/admin-section-page";
import { adminSections } from "@/features/admin-section/data/admin-sections";

export function generateStaticParams() {
  return Object.keys(adminSections).map((section) => ({ section }));
}

export default async function Page({ params }: { params: Promise<{ section: string }> }) {
  const { section: slug } = await params;
  const section = adminSections[slug];

  if (!section) notFound();

  return <AdminSectionPage section={section} />;
}
