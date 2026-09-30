import { unwrap } from "@/lib/api";
import type {
  CommerceOrder,
  CommercePage,
  CoursePurchasePage,
  CommerceLedgerEntry,
  CommerceWithdrawal,
  CourseOffer,
  WalletSummary,
  PayoutRecipient,
  CoursePromotionProduct,
} from "@codementor/types";
export const earningsApi = {
  wallet: () => unwrap<WalletSummary>("/commerce/wallet"),
  orders: (page: number, sort = "newest") =>
    unwrap<CommercePage<CommerceOrder>>(`/commerce/wallet/orders?${new URLSearchParams({ page: String(page), sort })}`),
  courseOrders: (id: string, page: number, status = '', q = '') =>
    unwrap<CoursePurchasePage>(
      `/commerce/wallet/courses/${id}/orders?${new URLSearchParams({ page: String(page), ...(status ? { status } : {}), ...(q ? { q } : {}) })}`,
    ),
  ledger: (page: number, sort = "newest") =>
    unwrap<CommercePage<CommerceLedgerEntry>>(
      `/commerce/wallet/ledger?${new URLSearchParams({ page: String(page), sort })}`,
    ),
  withdrawals: (page: number, sort = "newest") =>
    unwrap<CommercePage<CommerceWithdrawal>>(
      `/commerce/wallet/withdrawals?${new URLSearchParams({ page: String(page), sort })}`,
    ),
  recipient: (data: PayoutRecipient) =>
    unwrap<PayoutRecipient>("/commerce/wallet/recipient", {
      method: "PUT",
      body: { ...data },
    }),
  withdraw: (amount: number, idempotencyKey: string, scenario: string) =>
    unwrap<CommerceWithdrawal>("/commerce/wallet/withdrawals", {
      method: "POST",
      body: { amount, idempotencyKey, scenario },
    }),
  offer: (id: string) => unwrap<CourseOffer>(`/commerce/courses/${id}`),
  price: (id: string, priceVnd: number) =>
    unwrap(`/commerce/courses/${id}/price`, {
      method: "PUT",
      body: { priceVnd },
    }),
  promotions: () => unwrap<CoursePromotionProduct[]>("/commerce/promotions"),
  batchPromotion: (data: { courseIds: string[]; discountPercent: number; label: string; startsAt: string; endsAt: string; isActive: boolean }) =>
    unwrap<{ submitted: number; requestIds: string[] }>("/commerce/promotions/batch", {
      method: "PUT",
      body: data,
    }),
  promotion: (id: string, data: { salePriceVnd: number; label: string; startsAt: string; endsAt: string; isActive: boolean }) =>
    unwrap(`/commerce/courses/${id}/promotion`, { method: "PUT", body: data }),
  removePromotion: (id: string) =>
    unwrap(`/commerce/courses/${id}/promotion/remove`, { method: "POST" }),
};
export const vnd = (value: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(
    value,
  );
