import type { createApiClient } from "@codementor/api-client";
import type {
  AdminPlan,
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
  WorkspaceOrderDetail,
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

export interface AuditEntry {
  id: string;
  action: string;
  entity_id: string | null;
  details: unknown;
  created_at: string;
  actor: string | null;
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
  subscriber: (r: Request, userId: string) => call<SubscriberDetail>(r, `${base}/subscribers/${userId}`),
  suspend: (r: Request, userId: string, reason: string) => call(r, `${base}/subscribers/${userId}/suspend`, "POST", { reason }),
  restore: (r: Request, userId: string, reason: string) => call(r, `${base}/subscribers/${userId}/restore`, "POST", { reason }),
  addAdjustment: (r: Request, userId: string, body: { entitlement: string; amount: number; endsAt: string; reason: string }) =>
    call<{ id: string }>(r, `${base}/subscribers/${userId}/adjustments`, "POST", body),
  revokeAdjustment: (r: Request, id: string, reason: string) => call(r, `${base}/adjustments/${id}/revoke`, "POST", { reason }),
  orders: (r: Request, p: { page: number; status?: string; q?: string }) =>
    call<BillingPage<WorkspaceOrder & { buyer: { id: string; name: string; email: string } }>>(r, `${base}/orders?${query(p)}`),
  order: (r: Request, id: string) => call<WorkspaceOrderDetail>(r, `${base}/orders/${id}`),
  reconcile: (r: Request, id: string) => call<WorkspaceOrderDetail>(r, `${base}/orders/${id}/reconcile`, "POST"),
  coupons: (r: Request) => call<WorkspaceCoupon[]>(r, `${base}/coupons`),
  createCoupon: (r: Request, body: CouponInput) => call<{ id: string }>(r, `${base}/coupons`, "POST", { ...body }),
  deactivateCoupon: (r: Request, id: string) => call(r, `${base}/coupons/${id}/deactivate`, "POST"),
  settings: (r: Request) => call<{ graceDays: number; renewalReminderDays: number; termsVersion: string; updatedAt: string }>(r, `${base}/settings`),
  updateSettings: (r: Request, body: { graceDays: number; renewalReminderDays: number }) => call(r, `${base}/settings`, "PUT", body),
  audit: (r: Request, page: number) => call<{ items: AuditEntry[]; page: number; limit: number }>(r, `${base}/audit?page=${page}`),
};
