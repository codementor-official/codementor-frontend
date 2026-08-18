"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Braces, FileText, FlaskConical, GitFork, Languages, Pencil, Plus, Send, Trash2, Undo2 } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";
import { Button, ManagePage, Select, StatusBadge } from "@codementor/ui";
import { ApiClientError } from "@codementor/api-client";
import ReactMarkdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import {
  DetailMeta,
  DetailRow,
  DetailSection,
  DrawerDetail,
} from "@/components/page/drawer-detail";
import { ConfirmButton } from "@/components/page/confirm-button";
import { PageBody } from "@/components/page/page-body";
import { api } from "@/lib/api";
import { useAuth } from "@/providers/auth-provider";
import {
  DIFFICULTIES,
  DIFFICULTY_LABELS,
  STATUSES,
  STATUS_LABELS,
  STATUS_TONES,
  showValue,
  type ExerciseListItem,
  type ExerciseStatus,
} from "@codementor/solve";

type Tab = "mine" | "bank";

const dateFormat = new Intl.DateTimeFormat("vi-VN", { dateStyle: "short", timeStyle: "short" });

export default function ExercisesPage() {
  const router = useRouter();
  const { user } = useAuth();

  const [tab, setTab] = useState<Tab>("mine");
  const [rows, setRows] = useState<ExerciseListItem[]>([]);
  const [search, setSearch] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = { q: search || undefined, difficulty: difficulty || undefined };
      const page =
        tab === "mine"
          ? await api.exercises.mine({ ...params, status: status || undefined })
          : await api.exercises.bank(params);
      setRows(page.items);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Không tải được danh sách");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [tab, search, difficulty, status]);

  useEffect(() => {
    // Gõ tới đâu gọi API tới đó thì một từ khoá 10 ký tự là 10 lượt gọi.
    const timer = setTimeout(() => void load(), 250);
    return () => clearTimeout(timer);
  }, [load]);

  const act = async (id: string, action: () => Promise<unknown>) => {
    setBusyId(id);
    setError(null);
    try {
      await action();
      await load();
    } catch (cause) {
      setError(
        cause instanceof ApiClientError
          ? describeApiError(cause)
          : cause instanceof Error
            ? cause.message
            : "Thao tác thất bại",
      );
    } finally {
      setBusyId(null);
    }
  };

  const columns = useMemo<ColumnDef<ExerciseListItem, unknown>[]>(
    () => [
      {
        accessorKey: "title",
        header: "Bài tập",
        cell: ({ row }) => (
          <div className="min-w-0">
            <p className="truncate font-medium">{row.original.title}</p>
            <p className="truncate text-xs text-muted-foreground">
              {row.original.slug}
              {row.original.forkedFromId && " · bản fork"}
            </p>
          </div>
        ),
      },
      ...(tab === "bank"
        ? [
            {
              accessorKey: "authorName",
              header: "Tác giả",
              cell: ({ row }) => (
                <span className="text-sm text-muted-foreground">
                  {row.original.authorId === user?.id
                    ? "Của bạn"
                    : (row.original.authorName ?? "—")}
                </span>
              ),
            } satisfies ColumnDef<ExerciseListItem, unknown>,
          ]
        : []),
      {
        accessorKey: "difficulty",
        header: "Độ khó",
        cell: ({ row }) => DIFFICULTY_LABELS[row.original.difficulty],
      },
      ...(tab === "mine"
        ? [
            {
              accessorKey: "status",
              header: "Trạng thái",
              cell: ({ row }) => (
                <StatusBadge tone={STATUS_TONES[row.original.status]}>
                  {STATUS_LABELS[row.original.status]}
                </StatusBadge>
              ),
            } satisfies ColumnDef<ExerciseListItem, unknown>,
          ]
        : []),
      {
        accessorKey: "updatedAt",
        header: "Cập nhật",
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {dateFormat.format(new Date(row.original.updatedAt))}
          </span>
        ),
      },
    ],
    [tab, user?.id],
  );

  const create = async () => {
    const exercise = await api.exercises.create({
      title: "Bài tập chưa đặt tên",
      kind: "code",
      difficulty: "easy",
    });
    router.push(`/exercises/${exercise.id}/studio`);
  };

  return (
    <PageBody>
      <ManagePage
        action={
          <Button onClick={() => void create()} type="button">
            <Plus aria-hidden="true" className="size-4" />
            Tạo bài code
          </Button>
        }
        activeFilterCount={[difficulty, status].filter(Boolean).length}
        icon={Braces}
        columns={columns}
        drawer={{
          title: (row) => row.title,
          description: (row) =>
            `${DIFFICULTY_LABELS[row.difficulty]} · ${STATUS_LABELS[row.status]}`,
          body: (row) => <ExerciseDrawerBody row={row} />,
          footer: (row) => (
            <ExerciseDrawerActions
              busy={busyId === row.id}
              isMine={row.authorId === user?.id}
              onFork={() => act(row.id, () => api.exercises.fork(row.id))}
              onRemove={() => act(row.id, () => api.exercises.remove(row.id))}
              onSubmit={() => act(row.id, () => api.exercises.submit(row.id))}
              onWithdraw={() => act(row.id, () => api.exercises.withdraw(row.id))}
              row={row}
            />
          ),
        }}
        emptyMessage={
          tab === "mine" ? "Bạn chưa soạn bài nào." : "Chưa có bài nào được công khai."
        }
        error={error}
        filters={
          <>
            <Select
              label="Độ khó"
              onChange={setDifficulty}
              options={[
                { value: "", label: "Mọi độ khó" },
                ...DIFFICULTIES.map((value) => ({ value, label: DIFFICULTY_LABELS[value] })),
              ]}
              value={difficulty}
            />
            {tab === "mine" && (
              <Select
                label="Trạng thái"
                onChange={setStatus}
                options={[
                  { value: "", label: "Mọi trạng thái" },
                  ...STATUSES.map((value) => ({
                    value,
                    label: STATUS_LABELS[value as ExerciseStatus],
                  })),
                ]}
                value={status}
              />
            )}
          </>
        }
        getRowId={(row) => row.id}
        loading={loading}
        onClearFilters={() => {
          setDifficulty("");
          setStatus("");
        }}
        onSearchChange={setSearch}
        rows={rows}
        search={search}
        searchPlaceholder="Tìm theo tiêu đề hoặc slug…"
        tabs={{
          options: [
            { value: "mine", label: "Bài của tôi" },
            { value: "bank", label: "Kho bài chung" },
          ],
          value: tab,
          onChange: (value) => {
            setTab(value as Tab);
            setStatus("");
          },
        }}
        title="Bài code"
      />
    </PageBody>
  );
}

function ExerciseDrawerBody({ row }: { row: ExerciseListItem }) {
  return (
    <DrawerDetail key={row.id} load={() => api.exercises.get(row.id)}>
      {(exercise) => {
        const languages = exercise.content?.languages ?? [];
        const publicCases = (exercise.content?.testCases ?? []).filter(
          (testCase) => testCase.visibility === "public",
        );
        const hiddenCount = (exercise.content?.testCases ?? []).length - publicCases.length;

        return (
          <>
            <DetailMeta>
              <DetailRow label="Slug" value={exercise.slug} />
              <DetailRow label="Độ khó" value={DIFFICULTY_LABELS[exercise.difficulty]} />
              <DetailRow label="Trạng thái" value={STATUS_LABELS[exercise.status]} />
              <DetailRow label="Tác giả" value={row.authorName ?? "—"} />
              <DetailRow
                label="Giới hạn"
                value={`${exercise.timeLimitMs} ms · ${Math.round(exercise.memoryLimitKb / 1024)} MB`}
              />
              <DetailRow
                label="Cập nhật"
                value={dateFormat.format(new Date(exercise.updatedAt))}
              />
              {exercise.forkedFromId && (
                <DetailRow label="Nguồn gốc" value="Fork từ một bài khác" />
              )}
            </DetailMeta>

            <DetailSection icon={FileText} title="Đề bài">
              {exercise.content?.statement ? (
                <div className="prose prose-sm max-w-none text-sm">
                  <ReactMarkdown rehypePlugins={[rehypeHighlight]}>
                    {exercise.content.statement}
                  </ReactMarkdown>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Bài này chưa có đề.</p>
              )}
            </DetailSection>

            <DetailSection icon={Languages} title="Ngôn ngữ hỗ trợ">
              {languages.length === 0 ? (
                <p className="text-sm text-muted-foreground">Chưa khai báo ngôn ngữ nào.</p>
              ) : (
                <ul className="flex flex-wrap gap-1.5">
                  {languages.map((language) => (
                    <li
                      className="rounded-md border px-2 py-1 text-xs font-medium"
                      key={language.id}
                    >
                      {language.label}
                      {/* Missing a reference solution is what blocks submission, so it is
                          worth seeing here rather than only on the submit error. */}
                      {!language.referenceSolution && (
                        <span className="ml-1.5 text-warning">chưa có lời giải</span>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </DetailSection>

            <DetailSection icon={FlaskConical} title={`Test case công khai (${publicCases.length})`}>
              {publicCases.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Chưa có case công khai nào — học viên sẽ không thấy ví dụ.
                </p>
              ) : (
                <ul className="grid gap-2">
                  {publicCases.map((testCase) => (
                    <li className="rounded-md border p-3 font-mono text-xs" key={testCase.order}>
                      {/* Chế độ hàm lưu `args` là mảng và `expected` là giá trị JSON, nên cả
                          hai phải qua showValue — in trực tiếp sẽ ra "[object Object]". */}
                      <p className="font-sans text-muted-foreground">Đầu vào</p>
                      <pre className="mt-1 whitespace-pre-wrap">
                        {showValue(testCase.args ?? testCase.input) || "(rỗng)"}
                      </pre>
                      <p className="mt-2 font-sans text-muted-foreground">Đầu ra</p>
                      <pre className="mt-1 whitespace-pre-wrap">
                        {showValue(testCase.expected) || "(rỗng)"}
                      </pre>
                    </li>
                  ))}
                </ul>
              )}
              {hiddenCount > 0 && (
                <p className="mt-2 text-xs text-muted-foreground">
                  Thêm {hiddenCount} case ẩn không hiện ở đây.
                </p>
              )}
            </DetailSection>
          </>
        );
      }}
    </DrawerDetail>
  );
}


function ExerciseDrawerActions({
  row,
  isMine,
  busy,
  onSubmit,
  onWithdraw,
  onFork,
  onRemove,
}: {
  row: ExerciseListItem;
  isMine: boolean;
  busy: boolean;
  onSubmit: () => void;
  onWithdraw: () => void;
  onFork: () => void;
  onRemove: () => void;
}) {
  const forkable = !isMine && row.status === "published" && row.visibility === "public";

  return (
    <>
      {forkable && (
        <Button disabled={busy} onClick={onFork} type="button" variant="outline">
          <GitFork aria-hidden="true" className="size-4" /> Fork & chỉnh sửa
        </Button>
      )}
      {isMine && (
        <>
          {row.status === "pending_review" ? (
            <Button disabled={busy} onClick={onWithdraw} type="button" variant="outline">
              <Undo2 aria-hidden="true" className="size-4" /> Hủy gửi duyệt
            </Button>
          ) : (
            <Button disabled={busy} onClick={onSubmit} type="button" variant="outline">
              <Send aria-hidden="true" className="size-4" /> Gửi duyệt
            </Button>
          )}
          {row.status !== "published" && (
            <ConfirmButton
              confirmLabel="Xoá bài code"
              description={`Bài “${row.title}” sẽ bị xoá cùng đề bài, test case và lời giải mẫu. Khóa học nào đang gắn bài này sẽ mất ô bài code đó. Không hoàn tác được.`}
              disabled={busy}
              onConfirm={onRemove}
              title="Xoá bài code này?"
            >
              <Trash2 aria-hidden="true" className="size-4" /> Xoá
            </ConfirmButton>
          )}
          <Link
            className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-primary bg-primary px-3 text-sm font-medium text-primary-foreground"
            href={`/exercises/${row.id}/studio`}
          >
            <Pencil aria-hidden="true" className="size-4" /> Mở studio
          </Link>
        </>
      )}
      {!isMine && (
        <Link
          className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border bg-background px-3 text-sm font-medium"
          href={`/exercises/${row.id}/solve`}
        >
          <FlaskConical aria-hidden="true" className="size-4" /> Xem & giải thử
        </Link>
      )}
    </>
  );
}

/** Thông điệp của backend nói rõ thiếu gì; giữ nguyên thay vì thay bằng câu chung chung. */
function describeApiError(error: ApiClientError): string {
  const body = error.body as { message?: string } | undefined;
  return body?.message ?? error.message;
}
