"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import {
  AlertCircle,
  BookOpen,
  CheckCircle2,
  Flame,
  GraduationCap,
  Loader2,
  LogIn,
  LogOut,
  Route,
  Trophy,
} from "lucide-react";
import { ApiClientError } from "@codementor/api-client";
import { SegmentedTabs, StatusBadge } from "@codementor/ui";
import { useAdminApi } from "@/features/auth/admin-api";
import {
  usersApi,
  type ActivityEntry,
  type AdminUser,
  type AdminUserDetail,
  type AuditLogEntry,
  type LoginEvent,
} from "@/lib/api";

const ROLE_LABELS: Record<string, string> = {
  learner: "Học viên",
  lecturer: "Giảng viên",
  admin: "Quản trị",
};

const STATUS_LABELS: Record<string, string> = {
  active: "Đang hoạt động",
  suspended: "Tạm khoá",
  deleted: "Đã xoá",
};

const LEVEL_LABELS: Record<string, string> = {
  basic: "Cơ bản",
  intermediate: "Trung cấp",
  advanced: "Nâng cao",
};

/** Nhãn tiếng Việt cho từng loại hoạt động, kèm biểu tượng nhận diện. */
const ACTIVITY_LABELS: Record<ActivityEntry["kind"], { label: string; icon: typeof BookOpen }> = {
  roadmap_enrolled: { label: "Bắt đầu lộ trình", icon: Route },
  course_enrolled: { label: "Ghi danh khoá học", icon: BookOpen },
  course_completed: { label: "Hoàn thành khoá học", icon: Trophy },
  lesson_completed: { label: "Hoàn thành bài học", icon: CheckCircle2 },
  exercise_solved: { label: "Giải được bài tập", icon: GraduationCap },
};

/**
 * Chữ cho từng hành động quản trị. Không có trong bảng này thì hiện `summary` mà backend
 * đã dựng sẵn lúc ghi — nên thêm một loại hành động mới ở backend không làm màn này vỡ,
 * chỉ là mất phần tô màu.
 */
const AUDIT_TONES: Record<string, "neutral" | "success" | "warning" | "danger"> = {
  "user.created": "success",
  "user.activated": "success",
  "user.role_changed": "warning",
  "user.suspended": "danger",
};

const dateTimeFormat = new Intl.DateTimeFormat("vi-VN", { dateStyle: "short", timeStyle: "short" });
const dateFormat = new Intl.DateTimeFormat("vi-VN", { dateStyle: "long" });

type TabValue = "profile" | "activity" | "audit" | "logins";

const TABS: { value: TabValue; label: string }[] = [
  { value: "profile", label: "Thông tin" },
  { value: "activity", label: "Hoạt động" },
  { value: "audit", label: "Nhật ký" },
  { value: "logins", label: "Đăng nhập" },
];

/**
 * Nạp dữ liệu của một tab, và chỉ khi tab đó được mở lần đầu.
 *
 * Nạp cả bốn lúc mở drawer sẽ bắn bốn request mà ba trong số đó thường không ai xem, và
 * một trong ba là lời gọi sang Keycloak — chậm nhất trong cả nhóm.
 */
function useLazyTab<T>(load: () => Promise<T>, active: boolean) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!active || data !== null || error !== null) return;
    let cancelled = false;
    void load()
      .then((value) => !cancelled && setData(value))
      .catch((cause: unknown) => !cancelled && setError(describe(cause)));
    return () => {
      cancelled = true;
    };
  }, [active, data, error, load]);

  return { data, error, loading: active && data === null && error === null };
}

/**
 * Chi tiết một tài khoản, bốn tab.
 *
 * Bốn nguồn khác nhau và cố ý tách rời: hồ sơ và thống kê ở core-service, hoạt động học
 * tập ở learning-service, nhật ký kiểm toán ở bảng `audit_logs`, lịch sử đăng nhập ở
 * Keycloak. Một tab hỏng không kéo theo ba tab kia.
 */
export function UserDetailDrawer({ user }: { user: AdminUser }) {
  const request = useAdminApi();
  const [tab, setTab] = useState<TabValue>("profile");

  const loadProfile = useCallback(() => usersApi.detail(request, user.id), [request, user.id]);
  const loadActivity = useCallback(() => usersApi.activity(request, user.id), [request, user.id]);
  const loadAudit = useCallback(() => usersApi.auditTrail(request, user.id), [request, user.id]);
  const loadLogins = useCallback(() => usersApi.loginHistory(request, user.id), [request, user.id]);

  const profile = useLazyTab<AdminUserDetail>(loadProfile, tab === "profile");
  const activity = useLazyTab<ActivityEntry[]>(loadActivity, tab === "activity");
  const audit = useLazyTab<AuditLogEntry[]>(loadAudit, tab === "audit");
  const logins = useLazyTab<LoginEvent[]>(loadLogins, tab === "logins");

  return (
    <div className="grid gap-5">
      <SegmentedTabs onChange={(value) => setTab(value as TabValue)} options={TABS} value={tab} />

      {tab === "profile" && (
        <Section error={profile.error} loading={profile.loading}>
          {profile.data && <ProfileTab detail={profile.data} />}
        </Section>
      )}

      {tab === "activity" && (
        <Section error={activity.error} loading={activity.loading}>
          {activity.data && <ActivityTab entries={activity.data} />}
        </Section>
      )}

      {tab === "audit" && (
        <Section error={audit.error} loading={audit.loading}>
          {audit.data && <AuditTab entries={audit.data} />}
        </Section>
      )}

      {tab === "logins" && (
        <Section error={logins.error} loading={logins.loading}>
          {logins.data && <LoginsTab events={logins.data} />}
        </Section>
      )}
    </div>
  );
}

function Section({
  loading,
  error,
  children,
}: {
  loading: boolean;
  error: string | null;
  children: ReactNode;
}) {
  if (error !== null) {
    return (
      <p
        className="flex items-start gap-2 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        role="alert"
      >
        <AlertCircle aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
        {error}
      </p>
    );
  }
  if (loading) {
    return (
      <p className="flex items-center gap-2 py-8 text-sm text-muted-foreground">
        <Loader2 aria-hidden="true" className="size-4 animate-spin" />
        Đang tải…
      </p>
    );
  }
  return <>{children}</>;
}

function ProfileTab({ detail }: { detail: AdminUserDetail }) {
  return (
    <div className="grid gap-5">
      {detail.bio && <p className="text-sm leading-relaxed text-muted-foreground">{detail.bio}</p>}

      {detail.stats !== null && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat icon={Trophy} label="Điểm XP" value={detail.stats.xp.toLocaleString("vi-VN")} />
          <Stat icon={CheckCircle2} label="Bài đã giải" value={String(detail.stats.solvedCount)} />
          <Stat
            icon={Flame}
            label="Chuỗi hiện tại"
            value={`${detail.stats.currentStreakDays} ngày`}
          />
          <Stat
            icon={Flame}
            label="Chuỗi dài nhất"
            value={`${detail.stats.longestStreakDays} ngày`}
          />
        </div>
      )}

      <dl className="grid gap-3 text-sm">
        <Row label="Vai trò" value={ROLE_LABELS[detail.role] ?? detail.role} />
        <Row label="Trạng thái" value={STATUS_LABELS[detail.status] ?? detail.status} />
        <Row label="Handle" value={detail.handle ?? "—"} />
        <Row
          label="Xác minh email"
          value={detail.emailVerifiedAt ? dateFormat.format(new Date(detail.emailVerifiedAt)) : "chưa xác minh"}
        />
        <Row label="Website" value={detail.websiteUrl ?? "—"} />
        <Row label="GitHub" value={detail.githubHandle ?? "—"} />
        <Row label="Múi giờ" value={detail.timezone} />
        {/* Ánh xạ sang Keycloak: thứ cần khi phải đối chiếu một tài khoản giữa hai hệ thống. */}
        <Row label="Keycloak ID" value={detail.externalId ?? "chưa gắn"} />
        <Row label="CodeMentor ID" value={detail.id} />
        <Row
          label="Hoạt động cuối"
          value={detail.lastActiveAt ? dateTimeFormat.format(new Date(detail.lastActiveAt)) : "chưa ghi nhận"}
        />
        <Row label="Ngày tạo" value={dateTimeFormat.format(new Date(detail.createdAt))} />
      </dl>

      {detail.preferences !== null && (
        <div>
          <h3 className="mb-2 text-sm font-semibold">Khảo sát định hướng</h3>
          <dl className="grid gap-3 text-sm">
            <Row label="Mục tiêu học" value={detail.preferences.learningGoal ?? "—"} />
            <Row label="Mục tiêu nghề" value={detail.preferences.careerGoal ?? "—"} />
            <Row
              label="Trình độ"
              value={
                detail.preferences.currentLevel
                  ? (LEVEL_LABELS[detail.preferences.currentLevel] ?? detail.preferences.currentLevel)
                  : "—"
              }
            />
            <Row
              label="Giờ học/tuần"
              value={detail.preferences.weeklyStudyHours ? `${detail.preferences.weeklyStudyHours} giờ` : "—"}
            />
            <Row
              label="Lĩnh vực quan tâm"
              value={detail.preferences.interestedFields.join(", ") || "—"}
            />
          </dl>
        </div>
      )}

      {detail.stats === null && detail.preferences === null && (
        <p className="text-sm text-muted-foreground">
          Tài khoản chưa có thống kê hay khảo sát — cả hai chỉ xuất hiện sau khi người dùng bắt đầu học.
        </p>
      )}
    </div>
  );
}

function ActivityTab({ entries }: { entries: ActivityEntry[] }) {
  if (entries.length === 0) return <Empty>Tài khoản chưa có hoạt động học tập nào.</Empty>;

  return (
    <ol className="grid gap-3">
      {entries.map((entry, index) => {
        const meta = ACTIVITY_LABELS[entry.kind];
        const Icon = meta.icon;
        return (
          <li className="flex flex-wrap gap-x-3 gap-y-1" key={`${entry.kind}-${entry.occurredAt}-${index}`}>
            <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-muted">
              <Icon aria-hidden="true" className="size-3.5 text-muted-foreground" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">{entry.title}</p>
              <p className="text-xs text-muted-foreground">
                {meta.label}
                {entry.detail && ` · ${entry.detail}`}
              </p>
            </div>
            <span className="shrink-0 text-xs text-muted-foreground max-sm:w-full max-sm:pl-10">
              {dateTimeFormat.format(new Date(entry.occurredAt))}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

function AuditTab({ entries }: { entries: AuditLogEntry[] }) {
  if (entries.length === 0) {
    return <Empty>Chưa có thao tác quản trị nào trên tài khoản này.</Empty>;
  }

  return (
    <ol className="grid gap-3">
      {entries.map((entry) => (
        <li className="flex flex-wrap items-start gap-x-3 gap-y-1" key={entry.id}>
          <StatusBadge tone={AUDIT_TONES[entry.action] ?? "neutral"}>{entry.summary}</StatusBadge>
          <span className="text-xs text-muted-foreground">bởi {entry.actorEmail}</span>
          <span className="ml-auto shrink-0 text-xs text-muted-foreground">
            {dateTimeFormat.format(new Date(entry.createdAt))}
          </span>
        </li>
      ))}
    </ol>
  );
}

function LoginsTab({ events }: { events: LoginEvent[] }) {
  if (events.length === 0) {
    return (
      <Empty>
        Chưa ghi nhận lần đăng nhập nào. Keycloak chỉ giữ sự kiện trong 30 ngày, nên một tài khoản
        lâu không dùng cũng hiện rỗng ở đây.
      </Empty>
    );
  }

  return (
    <ol className="grid gap-3">
      {events.map((event, index) => {
        const failed = event.type === "LOGIN_ERROR";
        const Icon = event.type === "LOGOUT" ? LogOut : LogIn;
        return (
          <li className="flex flex-wrap gap-x-3 gap-y-1" key={`${event.type}-${event.occurredAt}-${index}`}>
            <span
              className={`mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full ${
                failed ? "bg-destructive/10" : "bg-muted"
              }`}
            >
              <Icon
                aria-hidden="true"
                className={`size-3.5 ${failed ? "text-destructive" : "text-muted-foreground"}`}
              />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">
                {event.type === "LOGIN"
                  ? "Đăng nhập thành công"
                  : event.type === "LOGOUT"
                    ? "Đăng xuất"
                    : "Đăng nhập thất bại"}
              </p>
              <p className="text-xs text-muted-foreground">
                {event.ipAddress ?? "không rõ IP"}
                {event.clientId && ` · ${event.clientId}`}
                {event.error && ` · ${event.error}`}
              </p>
            </div>
            <span className="shrink-0 text-xs text-muted-foreground max-sm:w-full max-sm:pl-10">
              {dateTimeFormat.format(new Date(event.occurredAt))}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Trophy;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg border border-border p-3">
      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Icon aria-hidden="true" className="size-3.5" />
        {label}
      </p>
      <p className="mt-1 text-lg font-semibold">{value}</p>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    // Xếp dọc trên màn hẹp: cột nhãn cố định 144px không còn chỗ cho giá trị, và một uuid
    // bị ép vào 190px thì xuống dòng giữa chuỗi, đọc ra thì được nhưng chép lại thì sai.
    <div className="flex flex-col gap-0.5 sm:flex-row sm:gap-3">
      <dt className="text-muted-foreground sm:w-36 sm:shrink-0">{label}</dt>
      <dd className="min-w-0 flex-1 break-words">{value}</dd>
    </div>
  );
}

function Empty({ children }: { children: ReactNode }) {
  return <p className="py-8 text-sm text-muted-foreground">{children}</p>;
}

function describe(cause: unknown): string {
  if (cause instanceof ApiClientError) {
    const body = cause.body as { message?: string } | undefined;
    return body?.message ?? cause.message;
  }
  return cause instanceof Error ? cause.message : "Không tải được dữ liệu";
}
