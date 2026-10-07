import type { createApiClient } from "@codementor/api-client";
import type {
  ApiResponse,
  CommerceOrder,
  CommercePage,
  CommerceWithdrawal,
  CommerceLedgerEntry,
  CommerceAudit,
  CommercePolicy,
  CommerceJobRun,
  PurchaseDetail,
  CoursePromotionProduct,
  RevenueReport,
  RevenueDateRange,
  RevenueInstructor,
} from "@codementor/types";
type Request = ReturnType<typeof createApiClient>;
async function get<T>(
  request: Request,
  path: string,
  body?: Record<string, unknown>,
  method = "POST",
) {
  const r = await request<ApiResponse<T>>(
    `/commerce/admin/${path}`,
    body ? { method, body } : {},
  );
  return r?.data;
}
export const commerceAdminApi = {
  analytics: (
    r: Request,
    days: number,
    instructorId = "",
    range?: RevenueDateRange | null,
  ) =>
    get<RevenueReport>(
      r,
      `analytics?${new URLSearchParams({ ...(range ? { from: range.from, to: range.to } : { days: String(days) }), ...(instructorId ? { instructorId } : {}) })}`,
    ),
  revenueInstructors: (
    r: Request,
    days: number,
    range?: RevenueDateRange | null,
  ) =>
    get<RevenueInstructor[]>(
      r,
      `analytics/instructors?${new URLSearchParams(range ? { from: range.from, to: range.to } : { days: String(days) })}`,
    ),
  reconciliation: (r: Request) =>
    get<Record<string, number | null>>(r, "reconciliation"),
  orders: (r: Request, page: number, status = "", q = "", sort = "newest") =>
    get<CommercePage<CommerceOrder>>(
      r,
      `orders?${new URLSearchParams({ page: String(page), sort, ...(status ? { status } : {}), ...(q ? { q } : {}) })}`,
    ),
  detail: (r: Request, id: string) => get<PurchaseDetail>(r, `orders/${id}`),
  withdrawals: (r: Request, page: number, sort = "newest") =>
    get<CommercePage<CommerceWithdrawal>>(
      r,
      `withdrawals?${new URLSearchParams({ page: String(page), sort })}`,
    ),
  ledger: (r: Request, page: number, sort = "newest") =>
    get<CommercePage<CommerceLedgerEntry>>(
      r,
      `ledger?${new URLSearchParams({ page: String(page), sort })}`,
    ),
  audit: (r: Request, page: number, sort = "newest") =>
    get<CommercePage<CommerceAudit>>(
      r,
      `audit?${new URLSearchParams({ page: String(page), sort })}`,
    ),
  policy: (r: Request) => get<CommercePolicy>(r, "policy"),
  // A named command prevents an accidental GET fallback. Never retry financial POSTs automatically.
  runJobs: async (r: Request) => {
    const response = await r<ApiResponse<CommerceJobRun>>(
      "/commerce/admin/jobs/run",
      {
        method: "POST",
        body: {},
      },
    );
    if (!response?.data?.runId || !Array.isArray(response.data.stages)) {
      throw new Error(
        "Máy chủ chưa trả báo cáo đối soát. Hãy làm mới dữ liệu và kiểm tra phiên bản backend; không chạy lại liên tục.",
      );
    }
    return response.data;
  },
  setPolicy: (r: Request, p: CommercePolicy) =>
    get<CommercePolicy>(r, "policy", { ...p }, "PUT"),
  command: (r: Request, path: string, body: Record<string, unknown> = {}) =>
    get<unknown>(r, path, body),
  promotions: (r: Request) => get<CoursePromotionProduct[]>(r, "promotions"),
  promotion: (
    r: Request,
    id: string,
    data: {
      salePriceVnd: number;
      label: string;
      startsAt: string;
      endsAt: string;
      isActive: boolean;
    },
  ) => get<unknown>(r, `courses/${id}/promotion`, data, "PUT"),
  batchPromotion: (
    r: Request,
    data: {
      courseIds: string[];
      discountPercent: number;
      label: string;
      startsAt: string;
      endsAt: string;
      isActive: boolean;
    },
  ) => get<{ updated: number }>(r, "promotions/batch", data, "PUT"),
  removePromotion: (r: Request, id: string) =>
    get<unknown>(r, `courses/${id}/promotion/remove`, {}),
  decidePromotion: (r: Request, id: string, approve: boolean, reason: string) =>
    get<unknown>(r, `promotion-requests/${id}/decide`, { approve, reason }),
};
export const vnd = (n: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(
    n,
  );
