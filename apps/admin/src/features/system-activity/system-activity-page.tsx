"use client";

import { useCallback } from "react";
import { Activity, CheckCircle2, Inbox, MailWarning, Radio, ServerCrash } from "lucide-react";
import { Card, CardContent, CardHeader, PageHeader, RefreshButton, StatusBadge } from "@codementor/ui";
import { useAdminApi } from "@/features/auth/admin-api";
import { KpiStrip, useSummary } from "@codementor/ui";
import { systemApi, type ServiceState, type SystemActivity } from "@/lib/api";

const STATE: Record<ServiceState, { label: string; tone: "success" | "warning" | "danger" }> = {
  up: { label: "Hoạt động", tone: "success" },
  degraded: { label: "Suy giảm", tone: "warning" },
  down: { label: "Không phản hồi", tone: "danger" },
};

const EMAIL_STATUS: Record<string, string> = {
  SENT: "Đã gửi",
  FAILED: "Lỗi",
  SKIPPED: "Bỏ qua (SES tắt / không cần gửi)",
  PROCESSING: "Đang gửi",
};

const time = new Intl.DateTimeFormat("vi-VN", { timeStyle: "medium" });
const dateTime = new Intl.DateTimeFormat("vi-VN", { dateStyle: "short", timeStyle: "short" });

/** "12 phút trước". Đủ cho câu hỏi admin cần trả lời: consumer này còn sống không. */
function ago(iso: string): string {
  const minutes = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (minutes < 1) return "vừa xong";
  if (minutes < 60) return `${minutes} phút trước`;
  const hours = Math.round(minutes / 60);
  return hours < 48 ? `${hours} giờ trước` : `${Math.round(hours / 24)} ngày trước`;
}

/**
 * Trang Hoạt động hệ thống: health của từng service, hàng đợi outbox, consumer Kafka và email,
 * đọc từ `GET /system/activity`. Làm mới bằng tay — chưa tự poll.
 */
export function SystemActivityPage() {
  const request = useAdminApi();
  const activity = useSummary(useCallback(() => systemApi.activity(request), [request]));
  const data = activity.data;
  const services = data?.services ?? [];

  return (
    <div>
      <PageHeader
        action={
          <div className="flex items-center gap-3">
            {data && (
              <span className="text-xs text-muted-foreground">
                Kiểm tra lúc {time.format(new Date(data.checkedAt))}
              </span>
            )}
            <RefreshButton onRefresh={activity.reload} />
          </div>
        }
        icon={Activity}
        title="Hoạt động hệ thống"
      />

      <KpiStrip
        loading={activity.loading}
        metrics={[
          {
            icon: CheckCircle2,
            label: `Service hoạt động / ${services.length || "—"}`,
            value: data ? services.filter((service) => service.state === "up").length : null,
          },
          {
            icon: ServerCrash,
            label: "Service lỗi / suy giảm",
            value: data ? services.filter((service) => service.state !== "up").length : null,
          },
          { icon: Inbox, label: "Sự kiện chờ đẩy (outbox)", value: data?.outbox.pending ?? null },
          {
            icon: Radio,
            label: "Consumer chạy trong 24 giờ",
            value: data ? data.consumers.filter((consumer) => consumer.last24h > 0).length : null,
          },
          {
            icon: MailWarning,
            label: "Email lỗi (7 ngày)",
            value: data ? (data.email.byStatus.find((row) => row.status === "FAILED")?.last7d ?? 0) : null,
          },
        ]}
      />

      {!activity.loading && !data && (
        <Card className="mt-3 px-4 py-8 text-center text-sm text-muted-foreground">
          Không tải được trạng thái hệ thống. Bấm Làm mới để thử lại.
        </Card>
      )}

      {data && (
        <div className="mt-3 grid min-w-0 gap-3 xl:grid-cols-2">
          <div className="xl:col-span-2">
            <ServicesCard services={data.services} />
          </div>
          <EventsCard data={data} />
          <EmailCard email={data.email} />
        </div>
      )}
    </div>
  );
}

function ServicesCard({ services }: { services: SystemActivity["services"] }) {
  return (
    <Card className="min-w-0">
      <CardHeader>
        <h2 className="text-sm font-semibold">Service</h2>
      </CardHeader>
      <CardContent className="grid gap-2 pb-4 sm:grid-cols-2 xl:grid-cols-5">
        {services.map((service) => (
          <div className="min-w-0 rounded-lg border px-3 py-2.5" key={service.name}>
            <div className="flex items-center justify-between gap-2">
              <span className="truncate font-mono text-sm">{service.name}</span>
              <StatusBadge tone={STATE[service.state].tone}>{STATE[service.state].label}</StatusBadge>
            </div>
            <p className="mt-1.5 text-xs text-muted-foreground">
              {service.error ?? `${service.latencyMs} ms`}
              {Object.entries(service.dependencies).map(([name, ok]) => (
                <span className={ok ? "" : "font-medium text-destructive"} key={name}>
                  {" · "}
                  {name}
                  {ok ? "" : " lỗi"}
                </span>
              ))}
            </p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function EventsCard({ data }: { data: SystemActivity }) {
  return (
    <Card className="min-w-0 overflow-x-auto">
      <CardHeader>
        <h2 className="text-sm font-semibold">Hàng đợi sự kiện (Kafka)</h2>
      </CardHeader>
      <CardContent className="pb-2 text-sm">
        {data.outbox.pending === 0 ? (
          <p className="text-muted-foreground">Outbox trống — mọi sự kiện đã được đẩy lên Kafka.</p>
        ) : (
          <p className="text-destructive">
            {data.outbox.pending} sự kiện chưa đẩy, cũ nhất từ {ago(data.outbox.oldestPendingAt!)}:{" "}
            {data.outbox.byTopic.map((row) => `${row.topic} (${row.pending})`).join(", ")}
          </p>
        )}
      </CardContent>
      <table className="w-full text-sm">
        <thead className="text-left text-xs text-muted-foreground">
          <tr className="border-b">
            <th className="px-4 py-2 font-medium">Consumer</th>
            <th className="px-4 py-2 text-right font-medium">Sự kiện 24 giờ</th>
            <th className="px-4 py-2 text-right font-medium">Lần cuối</th>
          </tr>
        </thead>
        <tbody>
          {data.consumers.length === 0 && (
            <tr>
              <td className="px-4 py-3 text-muted-foreground" colSpan={3}>
                Không consumer nào xử lý sự kiện trong 7 ngày.
              </td>
            </tr>
          )}
          {data.consumers.map((row) => (
            <tr className="border-b last:border-0" key={row.consumer}>
              <td className="px-4 py-2 font-mono text-xs">{row.consumer}</td>
              <td className="px-4 py-2 text-right tabular-nums">{row.last24h}</td>
              <td className="px-4 py-2 text-right whitespace-nowrap text-muted-foreground" title={dateTime.format(new Date(row.lastAt))}>
                {ago(row.lastAt)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}

function EmailCard({ email }: { email: SystemActivity["email"] }) {
  return (
    <Card className="min-w-0 overflow-x-auto">
      <CardHeader>
        <h2 className="text-sm font-semibold">Email nhắc học</h2>
      </CardHeader>
      <table className="w-full text-sm">
        <thead className="text-left text-xs text-muted-foreground">
          <tr className="border-b">
            <th className="px-4 py-2 font-medium">Trạng thái</th>
            <th className="px-4 py-2 text-right font-medium">24 giờ</th>
            <th className="px-4 py-2 text-right font-medium">7 ngày</th>
          </tr>
        </thead>
        <tbody>
          {email.byStatus.length === 0 && (
            <tr>
              <td className="px-4 py-3 text-muted-foreground" colSpan={3}>
                Không có email nào trong 7 ngày.
              </td>
            </tr>
          )}
          {email.byStatus.map((row) => (
            <tr className="border-b last:border-0" key={row.status}>
              <td className="px-4 py-2">{EMAIL_STATUS[row.status] ?? row.status}</td>
              <td className="px-4 py-2 text-right tabular-nums">{row.last24h}</td>
              <td className="px-4 py-2 text-right tabular-nums">{row.last7d}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {email.recentFailures.length > 0 && (
        <CardContent className="border-t pt-3 pb-4 text-sm">
          <p className="mb-2 text-xs font-medium text-muted-foreground">Lỗi gần nhất</p>
          <ul className="space-y-1.5">
            {email.recentFailures.map((row, index) => (
              <li key={`${row.at}-${index}`}>
                <span className="text-muted-foreground">{dateTime.format(new Date(row.at))}</span>{" "}
                <span className="font-mono text-xs">{row.template}</span> — {row.error ?? "không rõ lỗi"}
                {row.attempts > 1 && <span className="text-muted-foreground"> ({row.attempts} lần thử)</span>}
              </li>
            ))}
          </ul>
        </CardContent>
      )}
    </Card>
  );
}
