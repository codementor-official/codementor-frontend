"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Users } from "lucide-react";
import { ApiClientError } from "@codementor/api-client";
import { useToast } from "@codementor/ui";
import { Card } from "@/components/ui/card";
import { CatalogueEmpty, CatalogueError } from "@/components/ui/catalogue-state";
import { api } from "@/lib/api";
import { toStudyGroup } from "@/lib/study-group/study-group-stats";
import type { StudyGroup } from "@/types/study-group";
import { StudyGroupCard } from "./study-group-card";

/** Cùng lưới với `StudyGroupBoard` — thẻ đề xuất phải rộng đúng bằng thẻ ở danh sách dưới. */
const GRID = "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4";

/** Lấy dư rồi cắt: `discover` xếp theo nhóm đông và hoạt động gần đây, còn thứ tự cuối
 * cùng là của recommendation-service. */
const CANDIDATE_LIMIT = 12;

/**
 * Dải "nhóm có thể hợp với bạn". `recommendation-service` chỉ xếp hạng — nó trả về id,
 * tiêu đề và điểm, không có số thành viên hay tiến độ. Nên lấy thứ tự từ nó rồi ghép với
 * `scope=discover` (đúng tập nhóm công khai chưa tham gia mà nó xếp hạng), và vẽ bằng
 * `StudyGroupCard` như danh sách nhóm bên dưới: một loại thẻ, một bộ số, không có thanh
 * "hoàn thành" nào thật ra là mức phổ biến.
 *
 * Ghép ở client thay vì lọc theo slug ở server: dải gợi ý không đáng để phụ thuộc vào một
 * tham số truy vấn mới — `forbidNonWhitelisted` biến mọi bản backend chưa kịp deploy thành
 * 400 ngay trên màn hình.
 */
export function RecommendedGroups({ limit = 3 }: { limit?: number }) {
  const toast = useToast();
  const [groups, setGroups] = useState<StudyGroup[]>([]);
  const [personalized, setPersonalized] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      // Danh sách nhóm là bắt buộc, thứ hạng thì không: recommendation-service chết chỉ
      // làm mất thứ tự cá nhân hóa, không nên làm mất luôn cả dải gợi ý.
      const [rankResult, page] = await Promise.all([
        api.recommendations.groups(limit).catch(() => null),
        api.workspaces.list({ scope: "discover", limit: CANDIDATE_LIMIT }),
      ]);
      setPersonalized(rankResult?.personalized ?? false);
      const rank = new Map(
        (rankResult?.items ?? []).map((item, index) => [item.slug, index]),
      );
      // Nhóm không được xếp hạng vẫn hiện, chỉ đứng sau.
      const ordered = [...page.items].sort(
        (left, right) =>
          (rank.get(left.slug) ?? Number.MAX_SAFE_INTEGER) -
          (rank.get(right.slug) ?? Number.MAX_SAFE_INTEGER),
      );
      setGroups(ordered.slice(0, limit).map(toStudyGroup));
    } catch (cause) {
      setError(
        cause instanceof ApiClientError
          ? cause.message
          : "Không tải được đề xuất từ máy chủ.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [limit]);

  const requestAccess = async (group: StudyGroup) => {
    try {
      const result = await api.workspaces.requestJoin(group.id);
      if (result.status === "joined") {
        toast.success(`Đã tham gia nhóm “${group.name}”`);
        window.location.assign(`/workspace/${group.id}`);
        return;
      }
      toast.success(`Đã gửi yêu cầu tham gia “${group.name}”`);
      await load();
    } catch (cause) {
      toast.error(
        cause instanceof ApiClientError
          ? cause.message
          : "Không thể gửi yêu cầu tham gia.",
      );
    }
  };

  if (error) return <CatalogueError message={error} />;
  if (loading)
    return (
      <div className={GRID}>
        {Array.from({ length: limit }, (_, index) => (
          <Card key={index} className="h-56 animate-pulse bg-border-soft" />
        ))}
      </div>
    );
  if (groups.length === 0)
    return (
      <CatalogueEmpty
        icon={Users}
        title="Chưa có nhóm nào để đề xuất"
        description="Bạn đã tham gia mọi nhóm công khai đang hoạt động."
      />
    );

  return (
    <>
      {!personalized && (
        <p className="mb-3 text-2xs text-text-faint">
          Đang xếp theo mức phổ biến chung.{" "}
          <Link
            href="/profile?tab=personalization"
            className="font-semibold text-primary hover:underline"
          >
            Hoàn tất hồ sơ học tập
          </Link>{" "}
          để nhận đề xuất theo mục tiêu của bạn.
        </p>
      )}
      <ul className={GRID} aria-label="Nhóm có thể hợp với bạn">
        {groups.map((group) => (
          <li key={group.id}>
            <StudyGroupCard
              group={group}
              onRequestJoin={(target) => void requestAccess(target)}
            />
          </li>
        ))}
      </ul>
    </>
  );
}
