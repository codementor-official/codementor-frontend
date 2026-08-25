import { ProfileManagementPage } from "@/components/profile/profile-management-page";

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab } = await searchParams;
  const initialTab = tab === "settings" || tab === "personalization" ? tab : "profile";
  return <ProfileManagementPage initialTab={initialTab} />;
}
