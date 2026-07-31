import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { Placeholder } from "@/components/placeholder";

const myGroups = ["nhap-mon-lt"];
const joinedGroups = ["on-thi-dsa", "python-cho-nguoi-moi"];

export default function WorkspaceListPage() {
  return (
    <div>
      <PageHeader
        title="Không gian học tập"
        subtitle="Nơi học và luyện tập cùng các nhóm của bạn"
      />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Placeholder label="Tổng số nhóm" />
        <Placeholder label="Tiến độ trung bình" />
        <Placeholder label="Bạn học cùng" />
      </div>

      <h2 className="mb-3 text-base font-semibold text-zinc-900">Nhóm do bạn tạo</h2>
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {myGroups.map((id) => (
          <Link key={id} href={`/workspace/${id}`}>
            <Placeholder label={`Nhóm: ${id} (Chủ nhóm)`} />
          </Link>
        ))}
      </div>

      <h2 className="mb-3 text-base font-semibold text-zinc-900">Nhóm bạn đã tham gia</h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {joinedGroups.map((id) => (
          <Link key={id} href={`/workspace/${id}`}>
            <Placeholder label={`Nhóm: ${id} (Thành viên)`} />
          </Link>
        ))}
      </div>
    </div>
  );
}
