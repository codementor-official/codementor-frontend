import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { Placeholder } from "@/components/placeholder";

const paths = ["nhap-mon", "cau-truc-du-lieu", "oop-cpp", "python-co-ban"];

export default function PathsPage() {
  return (
    <div>
      <PageHeader
        title="Lộ trình học"
        subtitle="Chuỗi mô-đun có cấu trúc cho chương trình lập trình cốt lõi"
      />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Placeholder label="Tổng số lộ trình" />
        <Placeholder label="Đang học dở" />
        <Placeholder label="Trung bình hoàn thành" />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {paths.map((id) => (
          <Link key={id} href={`/paths/${id}`}>
            <Placeholder label={`Lộ trình: ${id}`} />
          </Link>
        ))}
      </div>
    </div>
  );
}
