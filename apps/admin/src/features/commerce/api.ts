import type { createApiClient } from "@codementor/api-client";
import type {
  ApiResponse,
  CommerceOrder,
  CommercePage,
  CommerceWithdrawal,
  CommerceLedgerEntry,
  CommerceAudit,
  CommercePolicy,
  PurchaseDetail,
  CoursePromotionProduct,
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
  reconciliation: (r: Request) =>
    get<Record<string, number>>(r, "reconciliation"),
  orders: (r: Request, page: number, status = '', q = '', sort = 'newest') =>
    get<CommercePage<CommerceOrder>>(r, `orders?${new URLSearchParams({ page: String(page), sort, ...(status ? { status } : {}), ...(q ? { q } : {}) })}`),
  detail: (r: Request, id: string) => get<PurchaseDetail>(r, `orders/${id}`),
  withdrawals: (r: Request, page: number, sort = 'newest') =>
    get<CommercePage<CommerceWithdrawal>>(r, `withdrawals?${new URLSearchParams({ page: String(page), sort })}`),
  ledger: (r: Request, page: number, sort = 'newest') =>
    get<CommercePage<CommerceLedgerEntry>>(r, `ledger?${new URLSearchParams({ page: String(page), sort })}`),
  audit: (r: Request, page: number, sort = 'newest') =>
    get<CommercePage<CommerceAudit>>(r, `audit?${new URLSearchParams({ page: String(page), sort })}`),
  policy: (r: Request) => get<CommercePolicy>(r, "policy"),
  setPolicy: (r: Request, p: CommercePolicy) =>
    get<CommercePolicy>(r, "policy", { ...p }, "PUT"),
  command: (r: Request, path: string, body: Record<string, unknown> = {}) =>
    get<unknown>(r, path, body),
  promotions: (r: Request) => get<CoursePromotionProduct[]>(r, "promotions"),
  promotion: (r: Request, id: string, data: { salePriceVnd: number; label: string; startsAt: string; endsAt: string; isActive: boolean }) =>
    get<unknown>(r, `courses/${id}/promotion`, data, "PUT"),
  batchPromotion: (r: Request, data: { courseIds: string[]; discountPercent: number; label: string; startsAt: string; endsAt: string; isActive: boolean }) =>
    get<{ updated: number }>(r, "promotions/batch", data, "PUT"),
  removePromotion: (r: Request, id: string) =>
    get<unknown>(r, `courses/${id}/promotion/remove`, {}),
  decidePromotion: (r: Request, id: string, approve: boolean, reason: string) =>
    get<unknown>(r, `promotion-requests/${id}/decide`, { approve, reason }),
};
export const vnd = (n: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(
    n,
  );
