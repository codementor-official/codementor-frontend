import { PageHeader } from "@/components/page-header";
import { Placeholder } from "@/components/placeholder";

export default function SettingsPage() {
  return (
    <div>
      <PageHeader title="Cài đặt" subtitle="Quản lý hồ sơ, tùy chọn và tích hợp của bạn" />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Placeholder label="Hồ sơ học tập" className="lg:col-span-2" />
        <Placeholder label="Hồ sơ" />
        <Placeholder label="Tùy chọn" />
        <Placeholder label="Tích hợp" className="lg:col-span-2" />
      </div>
    </div>
  );
}
