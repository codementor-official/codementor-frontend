import type { createApiClient } from "@codementor/api-client";
import type {
  AdminOrderDetail,
  AdminPlan,
  CouponDetail,
  OverageOwner,
  WorkspacePlanUsage,
  AuditCategory,
  AuditEntry,
  BillingSettings,
  SubscriberStats,
  ApiResponse,
  BillingCycle,
  BillingOverview,
  BillingPage,
  DraftVersionInput,
  PlanCatalog,
  PlanVersion,
  StorageOverview,
  SubscriberDetail,
  SubscriberRow,
  WorkspaceCoupon,
  WorkspaceOrder,
} from "@codementor/types";

type Request = ReturnType<typeof createApiClient>;

async function call<T>(r: Request, path: string, method = "GET", body?: Record<string, unknown>) {
  const res = await r<ApiResponse<T>>(path, method === "GET" ? {} : { method, ...(body ? { body } : {}) });
  return res?.data as T;
}

const base = "/workspace-billing/admin";

function query(params: Record<string, string | number | undefined>) {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v !== undefined && v !== "") q.set(k, String(v));
  return q.toString();
}

export interface CouponInput {
  code: string;
  kind: "percent" | "fixed";
  value: number;
  startsAt: string;
  endsAt: string;
  maxRedemptions?: number;
  perUserLimit: number;
  planIds?: string[];
  billingCycles?: BillingCycle[];
  newCustomersOnly: boolean;
  description: string;
}

export const plansApi = {
  overview: (r: Request) => call<BillingOverview>(r, `${base}/overview`),
  storage: (r: Request) => call<StorageOverview>(r, "/workspaces/plan-usage/admin-overview"),
  catalog: (r: Request) => call<PlanCatalog>(r, "/workspace-billing/plans"),
  plans: (r: Request) => call<AdminPlan[]>(r, `${base}/plans`),
  versions: (r: Request, planId: string) => call<(PlanVersion & { subscriptions: number })[]>(r, `${base}/plans/${planId}/versions`),
  createPlan: (r: Request, code: string, draft: DraftVersionInput) =>
    call<{ id: string }>(r, `${base}/plans`, "POST", { code, draft: { ...draft } }),
  updatePlan: (r: Request, planId: string, patch: Partial<Pick<AdminPlan, "sortOrder" | "isRecommended" | "isPurchasable" | "status">>) =>
    call<AdminPlan>(r, `${base}/plans/${planId}`, "PATCH", patch),
  saveDraft: (r: Request, planId: string, draft: DraftVersionInput) => call<PlanVersion>(r, `${base}/plans/${planId}/draft`, "PUT", { ...draft }),
  discardDraft: (r: Request, planId: string) => call<{ discarded: true }>(r, `${base}/plans/${planId}/draft`, "DELETE"),
  publish: (r: Request, planId: string, expectedUpdatedAt: string, availableFrom?: string) =>
    call<PlanVersion>(r, `${base}/plans/${planId}/publish`, "POST", { expectedUpdatedAt, ...(availableFrom ? { availableFrom } : {}) }),
  subscribers: (r: Request, p: { page: number; q?: string; planId?: string; state?: string }) =>
    call<BillingPage<SubscriberRow>>(r, `${base}/subscribers?${query(p)}`),
  subscriberStats: (r: Request) => call<SubscriberStats>(r, `${base}/subscribers/stats`),
  ownerUsage: (r: Request, userId: string) => call<WorkspacePlanUsage>(r, `/workspaces/plan-usage/admin/${userId}`),
  overage: (r: Request) => call<OverageOwner[]>(r, `${base}/overage`),
  subscriber: (r: Request, userId: string) => call<SubscriberDetail>(r, `${base}/subscribers/${userId}`),
  suspend: (r: Request, userId: string, reason: string) => call(r, `${base}/subscribers/${userId}/suspend`, "POST", { reason }),
  restore: (r: Request, userId: string, reason: string) => call(r, `${base}/subscribers/${userId}/restore`, "POST", { reason }),
  addAdjustment: (r: Request, userId: string, body: { entitlement: string; amount: number; endsAt: string; reason: string }) =>
    call<{ id: string }>(r, `${base}/subscribers/${userId}/adjustments`, "POST", body),
  revokeAdjustment: (r: Request, id: string, reason: string) => call(r, `${base}/adjustments/${id}/revoke`, "POST", { reason }),
  orders: (r: Request, p: { page: number; status?: string; q?: string }) =>
    call<BillingPage<WorkspaceOrder & { buyer: { id: string; name: string; email: string } }>>(r, `${base}/orders?${query(p)}`),
  order: (r: Request, id: string) => call<AdminOrderDetail>(r, `${base}/orders/${id}`),
  reconcile: (r: Request, id: string) => call<WorkspaceOrder>(r, `${base}/orders/${id}/reconcile`, "POST"),
  refund: (r: Request, id: string, reason: string, gatewayReference?: string) =>
    call<{ refunded: true; endedSubscription: boolean }>(r, `${base}/orders/${id}/refund`, "POST", { reason, ...(gatewayReference ? { gatewayReference } : {}) }),
  coupons: (r: Request) => call<WorkspaceCoupon[]>(r, `${base}/coupons`),
  createCoupon: (r: Request, body: CouponInput) => call<{ id: string }>(r, `${base}/coupons`, "POST", { ...body }),
  coupon: (r: Request, id: string) => call<CouponDetail>(r, `${base}/coupons/${id}`),
  updateCoupon: (r: Request, id: string, body: Partial<Omit<CouponInput, "code" | "maxRedemptions">> & { maxRedemptions?: number | null }) =>
    call<{ updated: true }>(r, `${base}/coupons/${id}`, "PATCH", { ...body }),
  setCouponActive: (r: Request, id: string, active: boolean) => call(r, `${base}/coupons/${id}/${active ? "activate" : "deactivate"}`, "POST"),
  settings: (r: Request) => call<BillingSettings>(r, `${base}/settings`),
  updateSettings: (r: Request, body: Pick<BillingSettings, "graceDays" | "renewalReminderDays" | "overageNoticeDays" | "overageReadOnlyDays">) =>
    call<BillingSettings>(r, `${base}/settings`, "PUT", { ...body }),
  audit: (r: Request, p: { page: number; limit: number; category?: AuditCategory }) =>
    call<BillingPage<AuditEntry>>(r, `${base}/audit?${query(p)}`),
};
