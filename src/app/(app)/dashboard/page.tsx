import { PageHeader } from "@/components/page-header";
import { Placeholder } from "@/components/placeholder";

export default function DashboardPage() {
  return (
    <div>
      <PageHeader
        title="Chào mừng trở lại, Gia Sĩ"
        subtitle="Tổng quan tiến độ học tập của bạn"
      />

      <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        <Placeholder label="Chuỗi ngày" />
        <Placeholder label="Mục tiêu tuần" />
        <Placeholder label="Tổng XP" />
        <Placeholder label="Bài đã giải" />
      </div>

      <Placeholder label="Banner đề xuất AI" className="mb-8" />

      <div className="grid grid-cols-1 gap-7 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="flex flex-col gap-8">
          <Placeholder label="Tiếp tục học" />
          <Placeholder label="Bài luyện tập đề xuất" />
          <Placeholder label="Đề xuất khóa học cho bạn" />
        </div>
        <div className="flex flex-col gap-4">
          <Placeholder label="Mục tiêu tuần" />
          <Placeholder label="Chuỗi ngày" />
          <Placeholder label="Hạn sắp tới" />
          <Placeholder label="Xem gần đây" />
        </div>
      </div>

      <Placeholder label="Chủ đề phổ biến" className="mt-8" />
    </div>
  );
}
