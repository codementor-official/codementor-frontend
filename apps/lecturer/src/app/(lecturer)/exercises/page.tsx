"use client";

import { ReviewFlag, ReviewNotice, RemovalPendingNotice } from "@/components/page/review-notice";
import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Archive,
  BookOpen,
  Braces,
  FileText,
  FlaskConical,
  GitFork,
  Languages,
  Pencil,
  Plus,
  RotateCcw,
  Send,
  Trash2,
  Undo2,
  TriangleAlert,
} from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";
import {
  Button,
  ConfirmButton,
  DetailMeta,
  DetailRow,
  DetailSection,
  DrawerDetail,
  ManagePage,
  Modal,
  ReasonButton,
  Select,
  StatusBadge,
  buttonClassName,
  useToast,
  useUndoableDelete,
} from "@codementor/ui";
import { ApiClientError } from "@codementor/api-client";
import ReactMarkdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";
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

  const toast = useToast();
  const [tab, setTab] = useState<Tab>("mine");
  const [rows, setRows] = useState<ExerciseListItem[]>([]);
  const [search, setSearch] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const { pendingIds, scheduleDelete } = useUndoableDelete();

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
    try {
      await action();
      await load();
    } catch (cause) {
      // Xem chú thích cùng chỗ ở màn khóa học: kết quả thao tác là toast, lỗi tải là dải
      // lỗi dưới tiêu đề.
      toast.error(
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
            <ReviewFlag status={row.original.status} />
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
              onRemove={() =>
                scheduleDelete({
                  id: row.id,
                  message: `Đã xoá bài code "${row.title}".`,
                  commit: () => api.exercises.remove(row.id),
                  onCommit: () => void load(),
                  onError: (cause) =>
                    toast.error(
                      cause instanceof ApiClientError
                        ? describeApiError(cause)
                        : cause instanceof Error
                          ? cause.message
                          : "Xoá thất bại",
                    ),
                })
              }
              onRequestRemoval={(reason) => act(row.id, () => api.exercises.requestRemoval(row.id, reason))}
              onRestore={() => act(row.id, () => api.exercises.restore(row.id))}
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
        onRefresh={load}
        onSearchChange={setSearch}
        rows={rows.filter((row) => !pendingIds.has(row.id))}
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
    <DrawerDetail
      key={row.id}
      load={async () => {
        const [exercise, refs] = await Promise.all([
          api.exercises.get(row.id),
          api.exercises.references(row.id).catch(() => ({ courses: [] })),
        ]);
        return { exercise, referencingCourses: refs.courses };
      }}
    >
      {({ exercise, referencingCourses }) => {
        const languages = exercise.content?.languages ?? [];
        const publicCases = (exercise.content?.testCases ?? []).filter(
          (testCase) => testCase.visibility === "public",
        );
        const hiddenCount = (exercise.content?.testCases ?? []).length - publicCases.length;

        return (
          <>
            <ReviewNotice reason={exercise.rejectionReason} status={exercise.status} />
            <RemovalPendingNotice
              reason={exercise.rejectionReason}
              removalRequested={exercise.removalRequested}
              status={exercise.status}
            />
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

            {referencingCourses.length > 0 && (
              <DetailSection icon={BookOpen} title={`Đang dùng trong khoá học (${referencingCourses.length})`}>
                <ul className="grid gap-2">
                  {referencingCourses.map((c) => (
                    <li className="flex items-center justify-between rounded-md border p-3" key={c.id}>
                      <span className="text-sm font-medium">{c.title}</span>
                      <span className="text-xs text-muted-foreground">/{c.slug}</span>
                    </li>
                  ))}
                </ul>
              </DetailSection>
            )}
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
  onRequestRemoval,
  onRestore,
  onFork,
  onRemove,
}: {
  row: ExerciseListItem;
  isMine: boolean;
  busy: boolean;
  onSubmit: () => void;
  onWithdraw: () => void;
  onRequestRemoval: (reason: string) => void;
  onRestore: () => void;
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
          ) : row.status === "archived" ? (
            <Button disabled={busy} onClick={onRestore} type="button" variant="outline">
              <RotateCcw aria-hidden="true" className="size-4" /> Khôi phục
            </Button>
          ) : (
            <>
              <Button disabled={busy} onClick={onSubmit} type="button" variant="outline">
                <Send aria-hidden="true" className="size-4" />
                {row.status === "published" ? "Gửi duyệt lại" : "Gửi duyệt"}
              </Button>
              {row.status === "published" && (
                <ReasonButton
                  confirmLabel="Gửi yêu cầu"
                  description="Bài code vẫn công khai cho tới khi quản trị viên duyệt yêu cầu này. Quản trị viên sẽ đọc được đúng lý do bạn nêu."
                  disabled={busy}
                  onConfirm={onRequestRemoval}
                  placeholder="Vì sao bạn muốn gỡ bài code này xuống?"
                  title="Xin gỡ bài code đang công khai?"
                >
                  <Archive aria-hidden="true" className="size-4" /> Xin gỡ xuống
                </ReasonButton>
              )}
            </>
          )}
          {row.status !== "published" && (
            <DeleteExerciseButton busy={busy} onRemove={onRemove} row={row} />
          )}
          <Link className={buttonClassName()} href={`/exercises/${row.id}/studio`}>
            <Pencil aria-hidden="true" className="size-4" /> Mở studio
          </Link>
        </>
      )}
      {!isMine && (
        <Link className={buttonClassName("outline")} href={`/exercises/${row.id}/solve`}>
          <FlaskConical aria-hidden="true" className="size-4" /> Xem & giải thử
        </Link>
      )}
    </>
  );
}

function DeleteExerciseButton({
  row,
  busy,
  onRemove,
}: {
  row: ExerciseListItem;
  busy: boolean;
  onRemove: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [checking, setChecking] = useState(false);
  const [references, setReferences] = useState<{ id: string; title: string; slug: string }[] | null>(null);

  const handleOpen = async () => {
    setChecking(true);
    try {
      const refs = await api.exercises.references(row.id);
      setReferences(refs.courses);
      setOpen(true);
    } catch {
      // Fallback cho phép xoá nếu lỗi mạng
      setReferences([]);
      setOpen(true);
    } finally {
      setChecking(false);
    }
  };

  return (
    <>
      <Button disabled={busy || checking} onClick={handleOpen} type="button" variant="danger">
        <Trash2 aria-hidden="true" className="size-4" /> {checking ? "Đang xử lý..." : "Xóa"}
      </Button>

      {references && (
        <Modal
          footer={
            <div className="flex justify-end gap-2">
              {references.length > 0 ? (
                <Button onClick={() => setOpen(false)} type="button" variant="outline">
                  Đóng
                </Button>
              ) : (
                <>
                  <Button onClick={() => setOpen(false)} type="button" variant="outline">
                    Huỷ
                  </Button>
                  <Button
                    onClick={() => {
                      setOpen(false);
                      onRemove();
                    }}
                    type="button"
                    variant="danger"
                  >
                    Xoá bài code
                  </Button>
                </>
              )}
            </div>
          }
          onClose={() => setOpen(false)}
          open={open}
          title={references.length > 0 ? "Không thể xóa bài code" : "Xóa bài code này?"}
          width="sm"
        >
          {references.length > 0 ? (
            <div className="space-y-4">
              <p className="flex items-start gap-2.5 text-sm text-destructive">
                <TriangleAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
                <span>Bài code này đang được gắn trong các khóa học dưới đây. Bạn phải gỡ nó khỏi chương trình học trước khi xoá.</span>
              </p>
              <ul className="grid gap-2">
                {references.map((c) => (
                  <li className="flex flex-col gap-0.5 rounded-md border p-3" key={c.id}>
                    <span className="text-sm font-medium">{c.title}</span>
                    <span className="text-xs text-muted-foreground">/{c.slug}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="flex items-start gap-2.5 text-sm text-muted-foreground">
              <TriangleAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-destructive" />
              <span>Bài “{row.title}” sẽ bị xoá cùng đề bài, test case và lời giải mẫu. Có vài giây để hoàn tác sau khi xác nhận.</span>
            </p>
          )}
        </Modal>
      )}
    </>
  );
}

/** Thông điệp của backend nói rõ thiếu gì; giữ nguyên thay vì thay bằng câu chung chung. */
function describeApiError(error: ApiClientError): string {
  const body = error.body as { message?: string } | undefined;
  return body?.message ?? error.message;
}
