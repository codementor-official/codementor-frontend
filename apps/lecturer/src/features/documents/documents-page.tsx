"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Download, FileText, RefreshCw, Trash2, Upload } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";
import { ApiClientError } from "@codementor/api-client";
import {
  Button,
  ConfirmButton,
  DetailMeta,
  DetailRow,
  DetailSection,
  ManagePage,
  Select,
  StatusBadge,
} from "@codementor/ui";
import { PageBody } from "@/components/page/page-body";
import { api } from "@/lib/api";
import { DocumentUploadModal } from "./upload-modal";
import { uploadDocument } from "./upload";
import {
  DOCUMENT_STATE_LABELS,
  DOCUMENT_STATE_TONES,
  formatSize,
  type AiDocument,
  type DocumentState,
} from "./types";

const dateFormat = new Intl.DateTimeFormat("vi-VN", { dateStyle: "short", timeStyle: "short" });

/** Trạng thái còn đang chạy — bảng tự nạp lại cho tới khi hết. */
const IN_FLIGHT: DocumentState[] = ["queued", "processing", "not_indexed"];
const POLL_MS = 3000;

const STATES: DocumentState[] = ["queued", "processing", "ready", "failed"];

function describe(cause: unknown): string {
  const body =
    cause instanceof ApiClientError ? (cause.body as { message?: string | string[] }) : undefined;
  const detail = Array.isArray(body?.message) ? body.message.join("; ") : body?.message;
  return detail ?? (cause instanceof Error ? cause.message : "Không thực hiện được thao tác này.");
}

/**
 * Trang Tài liệu của giảng viên.
 *
 * Đây là NGUYÊN LIỆU, không phải nội dung phát hành: không có nháp/gửi duyệt/công khai, chỉ có
 * tệp, trạng thái xử lý và hạn dùng. Vì vậy nó không có studio riêng — mọi thao tác nằm gọn
 * trong drawer.
 */
export function DocumentsPage() {
  const [rows, setRows] = useState<AiDocument[]>([]);
  const [search, setSearch] = useState("");
  const [state, setState] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [limits, setLimits] = useState({ maxFileBytes: 20 * 1024 * 1024, maxFilesPerMessage: 4 });

  const load = useCallback(async () => {
    setError(null);
    try {
      setRows(await api.aiDocuments.list());
    } catch (cause) {
      setError(describe(cause));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
    // Trần và định dạng do backend quyết; đọc một lần thay vì chép cứng con số vào hai nơi.
    api.aiDocuments
      .limits()
      .then((found) => setLimits(found))
      .catch(() => undefined);
  }, [load]);

  // Xử lý một tài liệu mất vài giây tới một phút. Không có kênh đẩy nào từ ai-service, nên
  // bảng tự hỏi lại — và CHỈ khi còn tệp đang chạy, để trang mở lâu không gõ cửa mãi.
  const pending = rows.some((row) => IN_FLIGHT.includes(row.state));
  useEffect(() => {
    if (!pending) return;
    const timer = setInterval(() => void load(), POLL_MS);
    return () => clearInterval(timer);
  }, [pending, load]);

  const act = async (action: () => Promise<unknown>) => {
    setBusy(true);
    setError(null);
    try {
      await action();
      await load();
    } catch (cause) {
      setError(describe(cause));
    } finally {
      setBusy(false);
    }
  };

  const upload = async (files: File[]) => {
    setUploading(true);
    setError(null);
    // Tuần tự và ghi lại kết cục TỪNG tệp: hỏng giữa lô là chuyện thường, và báo "thất bại"
    // cho cả lô sẽ giấu mất những tệp đã lên đúng.
    const failed: string[] = [];
    for (const file of files) {
      try {
        await uploadDocument(file);
      } catch (cause) {
        failed.push(`${file.name}: ${describe(cause)}`);
      }
    }
    if (failed.length > 0) setError(failed.join(" · "));
    setUploading(false);
    await load();
  };

  const open = async (id: string) => {
    try {
      const { url } = await api.aiDocuments.downloadUrl(id);
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (cause) {
      setError(describe(cause));
    }
  };

  const columns = useMemo<ColumnDef<AiDocument, unknown>[]>(
    () => [
      {
        accessorKey: "title",
        header: "Tài liệu",
        cell: ({ row }) => (
          <div className="min-w-0">
            <p className="truncate font-medium">{row.original.title}</p>
            <p className="truncate text-xs text-muted-foreground">
              {row.original.docType.toUpperCase()} · {formatSize(row.original.sizeBytes)}
            </p>
          </div>
        ),
      },
      {
        accessorKey: "state",
        header: "Xử lý",
        cell: ({ row }) => (
          <StatusBadge tone={DOCUMENT_STATE_TONES[row.original.state] ?? "neutral"}>
            {DOCUMENT_STATE_LABELS[row.original.state] ?? row.original.state}
          </StatusBadge>
        ),
      },
      {
        accessorKey: "chunkCount",
        header: "Số đoạn",
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">{row.original.chunkCount || "—"}</span>
        ),
      },
      {
        accessorKey: "createdAt",
        header: "Ngày tải",
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {dateFormat.format(new Date(row.original.createdAt))}
          </span>
        ),
      },
    ],
    [],
  );

  return (
    <PageBody>
      <ManagePage
        action={
          <Button onClick={() => setUploading(true)} type="button">
            <Upload aria-hidden="true" className="size-4" />
            Tải tài liệu lên
          </Button>
        }
        activeFilterCount={state ? 1 : 0}
        columns={columns}
        description="Tài liệu bạn tải lên để Lecter soạn nội dung dựa trên đó. Đây không phải kho lưu trữ: tệp tự xóa sau 30 ngày, hãy giữ bản gốc ở nơi khác."
        drawer={{
          title: (row) => row.title,
          description: (row) => DOCUMENT_STATE_LABELS[row.state] ?? row.state,
          body: (row) => (
            <>
              <DetailSection title="Thông tin">
                <DetailMeta>
                  <DetailRow label="Định dạng" value={row.docType.toUpperCase()} />
                  <DetailRow label="Kích thước" value={formatSize(row.sizeBytes)} />
                  <DetailRow label="Số đoạn đã tách" value={String(row.chunkCount || 0)} />
                  <DetailRow
                    label="Ngày tải"
                    value={dateFormat.format(new Date(row.createdAt))}
                  />
                  <DetailRow
                    label="Tự xóa"
                    value={
                      row.expiresAt ? dateFormat.format(new Date(row.expiresAt)) : "không rõ"
                    }
                  />
                </DetailMeta>
              </DetailSection>
              {row.error && (
                <DetailSection title="Lỗi xử lý">
                  <p className="text-sm text-destructive">{row.error}</p>
                </DetailSection>
              )}
              {row.state === "ready" && (
                <DetailSection title="Dùng trong Lecter">
                  <p className="text-sm text-muted-foreground">
                    Mở Lecter, bấm dấu cộng rồi chọn Tài liệu để đính kèm tệp này vào tin nhắn.
                  </p>
                </DetailSection>
              )}
            </>
          ),
          footer: (row) => (
            <>
              <Button
                disabled={busy}
                onClick={() => void open(row.id)}
                type="button"
                variant="outline"
              >
                <Download aria-hidden="true" className="size-4" />
                Mở tệp gốc
              </Button>
              {(row.state === "failed" || row.state === "unsupported") && (
                <Button
                  disabled={busy}
                  onClick={() => void act(() => api.aiDocuments.reindex(row.id))}
                  type="button"
                  variant="outline"
                >
                  <RefreshCw aria-hidden="true" className="size-4" />
                  Xử lý lại
                </Button>
              )}
              <ConfirmButton
                confirmLabel="Xóa hẳn"
                description="Tệp gốc và bản đã xử lý đều bị xóa, không khôi phục được. Hội thoại cũ vẫn giữ nội dung Lecter đã soạn."
                disabled={busy}
                onConfirm={() => act(() => api.aiDocuments.remove(row.id))}
                title={`Xóa "${row.title}"?`}
                variant="danger"
              >
                <Trash2 aria-hidden="true" className="size-4" />
                Xóa
              </ConfirmButton>
            </>
          ),
        }}
        emptyMessage="Bạn chưa tải tài liệu nào lên."
        error={error}
        filters={
          <Select
            label="Trạng thái xử lý"
            onChange={setState}
            options={[
              { value: "", label: "Tất cả" },
              ...STATES.map((value) => ({ value, label: DOCUMENT_STATE_LABELS[value] })),
            ]}
            value={state}
          />
        }
        getRowId={(row) => row.id}
        icon={FileText}
        loading={loading}
        onClearFilters={() => setState("")}
        onRefresh={load}
        onSearchChange={setSearch}
        rows={state ? rows.filter((row) => row.state === state) : rows}
        search={search}
        searchPlaceholder="Tìm theo tên tệp…"
        title="Tài liệu"
      />

      <DocumentUploadModal
        busy={busy}
        maxBytes={limits.maxFileBytes}
        maxFiles={limits.maxFilesPerMessage}
        onClose={() => setUploading(false)}
        onUpload={(files) => void upload(files)}
        open={uploading}
      />
    </PageBody>
  );
}
