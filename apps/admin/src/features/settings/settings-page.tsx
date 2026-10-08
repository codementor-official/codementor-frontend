"use client";

import { useCallback, type ReactNode } from "react";
import { Settings } from "lucide-react";
import { Card, CardContent, CardHeader, InfoHint, PageHeader, RefreshButton } from "@codementor/ui";
import { AiConfigCard } from "@/features/ai-operations/ai-operations-page";
import { useAdminApi } from "@/features/auth/admin-api";
import { JudgeConfigCard } from "@/features/code-judge/code-judge-page";
import { useSummary } from "@codementor/ui";
import { aiApi, judgeApi, systemApi, type PlatformSettings } from "@/lib/api";

const ENV_HINT =
  "Chỉ đọc. Đổi bằng biến môi trường trong .env của backend rồi restart các service liên quan.";

/**
 * Trang Cài đặt: cấu hình ĐANG CHẠY của nền tảng, gom từ ba nguồn — core-service (nền tảng),
 * ai-service và judge-service. Chỉ đọc: không có nơi lưu cấu hình nào ngoài biến môi trường.
 * Ba nguồn nạp riêng, một service tắt thì hai thẻ kia vẫn hiện.
 */
export function SettingsPage() {
  const request = useAdminApi();
  const platform = useSummary(useCallback(() => systemApi.settings(request), [request]));
  const ai = useSummary(useCallback(() => aiApi.config(request), [request]));
  const judge = useSummary(useCallback(() => judgeApi.config(request), [request]));

  return (
    <div>
      <PageHeader
        action={
          <RefreshButton onRefresh={() => Promise.all([platform.reload(), ai.reload(), judge.reload()])} />
        }
        icon={Settings}
        title="Cài đặt"
      />
      <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-3 lg:grid-cols-2">
        {platform.data ? (
          <PlatformCards settings={platform.data} />
        ) : (
          <Unavailable loading={platform.loading} source="core-service" />
        )}
        {ai.data ? <AiConfigCard config={ai.data} /> : <Unavailable loading={ai.loading} source="ai-service" />}
        <JudgeConfigCard config={judge.data} loading={judge.loading} />
      </div>
    </div>
  );
}

function Unavailable({ loading, source }: { loading: boolean; source: string }) {
  return (
    <Card className="px-4 py-6 text-sm text-muted-foreground">
      {loading ? "Đang tải…" : `Không đọc được cấu hình từ ${source}.`}
    </Card>
  );
}

const yes = (value: boolean) => (value ? "Đã cấu hình" : "Chưa cấu hình");

function PlatformCards({ settings }: { settings: PlatformSettings }) {
  return (
    <>
      <SettingsCard title="Lưu trữ (S3)">
        <Row label="Region" value={settings.storage.region} mono />
        <Row label="Bucket" value={settings.storage.bucket} mono />
        <Row label="Khoá truy cập" value={yes(settings.storage.credentialsConfigured)} />
        <Row
          label="Tải lên tối đa"
          value={`Video ${settings.storage.maxUploadMb.video} MB · Tài liệu ${settings.storage.maxUploadMb.document} MB · Ảnh ${settings.storage.maxUploadMb.image} MB`}
        />
      </SettingsCard>
      <SettingsCard title="Email (SES)">
        <Row label="Gửi email" value={settings.email.enabled ? "Đang bật" : "Đang tắt"} />
        <Row label="Người gửi" value={settings.email.fromEmail ? `${settings.email.fromName ?? ""} <${settings.email.fromEmail}>` : null} />
        <Row label="Chu kỳ quét nhắc" value={`${settings.email.reminderPollSeconds} giây`} />
        <Row label="Nhắc khi bỏ học" value={`sau ${settings.email.learningInactivityDays} ngày`} />
      </SettingsCard>
    </>
  );
}

function SettingsCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Card className="min-w-0">
      <CardHeader>
        <h2 className="flex items-center gap-2 text-sm font-semibold">
          {title}
          <InfoHint text={ENV_HINT} />
        </h2>
      </CardHeader>
      <CardContent className="pb-4 text-sm">
        <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-1.5">{children}</dl>
      </CardContent>
    </Card>
  );
}

function Row({ label, value, mono = false }: { label: string; value: string | null; mono?: boolean }) {
  return (
    <>
      <dt className="text-muted-foreground">{label}</dt>
      <dd className={`break-words whitespace-pre-line ${mono ? "font-mono text-xs leading-5" : ""}`}>
        {value ?? <span className="text-muted-foreground">—</span>}
      </dd>
    </>
  );
}
