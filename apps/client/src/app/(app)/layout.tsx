import { Sidebar } from "@/components/sidebar";
import { Topbar } from "@/components/topbar";
import { OnboardingModal } from "@/components/onboarding/onboarding-modal";
import { AppContent } from "@/components/app-content";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    // Sidebar spans the full viewport height with the logo at its top, and the search
    // header sits beside it in the content column — Kaggle's arrangement. A full-width
    // top bar would push the sidebar (and logo) down a row instead.
    <div className="flex h-full min-h-0 flex-1">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar />
        <AppContent>{children}</AppContent>
      </div>
      <OnboardingModal />
    </div>
  );
}
