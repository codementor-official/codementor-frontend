import { Suspense } from "react";
import { Sidebar } from "@/components/sidebar";
import { Topbar } from "@/components/topbar";
import { OnboardingModal } from "@/components/onboarding/onboarding-modal";
import { AppContent } from "@/components/app-content";
import { RequireAuth } from "@/components/require-auth";
import { EmailVerificationBanner } from "@/features/account/components/email-verification";
import { WorkspaceChatLauncher } from "@/features/workspace/chat/workspace-chat-launcher";

/**
 * Mọi trang trong nhóm này đều cần phiên đăng nhập, nên cổng đặt ở layout chứ không rải
 * ra từng trang — thêm một trang mới là nó được bảo vệ sẵn, không phải nhớ.
 *
 * Toàn bộ dữ liệu ở đây đi qua `/api/backend/*`, mà proxy đó đòi phiên cho mọi đường,
 * kể cả danh mục khóa học. Nên trước khi có cổng này, khách chưa đăng nhập vẫn vào được
 * trang nhưng chỉ nhìn thấy lỗi — công khai trên danh nghĩa, hỏng trên thực tế. Muốn
 * cho xem danh mục khi chưa đăng nhập thì phải mở đường công khai ở proxy và gateway
 * trước; đó là việc khác.
 */
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    // Sidebar spans the full viewport height with the logo at its top, and the search
    // header sits beside it in the content column — Kaggle's arrangement. A full-width
    // top bar would push the sidebar (and logo) down a row instead.
    <div className="flex h-full min-h-0 flex-1">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar />
        <EmailVerificationBanner />
        <AppContent>
          <RequireAuth>{children}</RequireAuth>
        </AppContent>
      </div>
      <OnboardingModal />
      <Suspense fallback={null}><WorkspaceChatLauncher /></Suspense>
    </div>
  );
}
