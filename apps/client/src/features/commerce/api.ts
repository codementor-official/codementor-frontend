import { unwrap } from "@/lib/api";
import type {
  CommerceConfig,
  CourseOffer,
  CommercePage,
  CommerceOrder,
  PurchaseDetail,
  PaymentMethod,
} from "@codementor/types";
export const commerceApi = {
  config: () => unwrap<CommerceConfig>("/commerce/config"),
  offer: (id: string) => unwrap<CourseOffer>(`/commerce/courses/${id}`),
  orders: (page: number, status = '', q = '', sort = 'newest') =>
    unwrap<CommercePage<CommerceOrder>>(
      `/commerce/orders?${new URLSearchParams({ page: String(page), sort, ...(status ? { status } : {}), ...(q ? { q } : {}) })}`,
    ),
  create: (courseId: string, provider: PaymentMethod) =>
    unwrap<PurchaseDetail>("/commerce/orders", {
      method: "POST",
      body: { courseId, provider },
    }),
  detail: (id: string) => unwrap<PurchaseDetail>(`/commerce/orders/${id}`),
  reconcile: (id: string) =>
    unwrap<PurchaseDetail>(`/commerce/orders/${id}/reconcile`, {
      method: "POST",
    }),
  mock: (id: string, result: string) =>
    unwrap<PurchaseDetail>(`/commerce/orders/${id}/mock`, {
      method: "POST",
      body: { result },
    }),
};
export const vnd = (n: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(
    n,
  );
