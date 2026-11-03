import { Button } from "@/components/ui/button";

/** Hai lối vào cuối trang: lớp học (giảng viên) và tài khoản cá nhân (học viên). */
export function LandingCta() {
  return (
    <section aria-label="Bắt đầu" className="px-4 pb-12 sm:px-8 lg:pb-14">
      <div className="mx-auto grid max-w-7xl gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-border bg-surface p-8">
          <span className="rounded-sm bg-border-soft px-2 py-0.5 text-2xs font-bold text-navy">Nhóm học tập</span>
          <h2 className="mt-3 text-2xl font-bold tracking-tight text-navy">Giảng viên giao bài, cả lớp nộp ở một chỗ</h2>
          <p className="mt-2 text-base leading-7 text-text-muted">
            Tạo nhóm, giao bài có hạn nộp, xem tiến độ từng thành viên. Gói Free đủ cho một lớp nhỏ.
          </p>
          <Button href="/workspace/pricing" variant="outline" className="mt-5 h-10">Xem bảng giá nhóm</Button>
        </div>
        <div className="rounded-xl border border-primary/30 bg-primary-tint p-8">
          <span className="rounded-sm bg-primary px-2 py-0.5 text-2xs font-bold text-on-ink">Miễn phí</span>
          <h2 className="mt-3 text-2xl font-bold tracking-tight text-navy">Bắt đầu với một khóa miễn phí</h2>
          <p className="mt-2 text-base leading-7 text-text">Tạo tài khoản trong một phút, không cần thẻ thanh toán.</p>
          <Button href="/signup" className="mt-5 h-10">Đăng ký miễn phí</Button>
        </div>
      </div>
    </section>
  );
}
