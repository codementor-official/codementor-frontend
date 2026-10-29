import { ApiClientError } from "@codementor/api-client";
import type {
  BillingCycle,
  BillingPage,
  PlanCatalog,
  Quote,
  SubscriptionOverview,
  WorkspaceOrder,
  WorkspaceOrderDetail,
  WorkspacePlanUsage,
  WorkspaceQuotaCode,
} from "@codementor/types";
import { unwrap } from "@/lib/api";

export type PaymentProvider = "mock" | "vnpay" | "momo";

export const billingApi = {
  plans: () => unwrap<PlanCatalog>("/workspace-billing/plans", { cache: "no-store" }),
  subscription: () => unwrap<SubscriptionOverview>("/workspace-billing/subscription", { cache: "no-store" }),
  usage: () => unwrap<WorkspacePlanUsage>("/workspaces/plan-usage", { cache: "no-store" }),
  quote: (planId: string, billingCycle: BillingCycle, couponCode?: string) =>
    unwrap<Quote>("/workspace-billing/quote", {
      method: "POST",
      body: { planId, billingCycle, ...(couponCode ? { couponCode } : {}) },
    }),
  checkout: (input: {
    planId: string;
    billingCycle: BillingCycle;
    couponCode?: string;
    provider: PaymentProvider;
    expectedAmountVnd: number;
  }) => unwrap<WorkspaceOrderDetail>("/workspace-billing/checkout", { method: "POST", body: { ...input } }),
  cancelRenewal: () => unwrap<{ cancelAtPeriodEnd: true; benefitsEndAt: string }>("/workspace-billing/subscription/cancel", { method: "POST" }),
  resumeRenewal: () => unwrap<{ cancelAtPeriodEnd: false }>("/workspace-billing/subscription/resume", { method: "POST" }),
  scheduleChange: (planId: string, billingCycle: BillingCycle) =>
    unwrap<{ effectiveAt: string }>("/workspace-billing/subscription/schedule-change", {
      method: "POST",
      body: { planId, billingCycle },
    }),
  orders: (page: number) => unwrap<BillingPage<WorkspaceOrder>>(`/workspace-billing/orders?page=${page}`, { cache: "no-store" }),
  order: (id: string) => unwrap<WorkspaceOrderDetail>(`/workspace-billing/orders/${id}`, { cache: "no-store" }),
  reconcile: (id: string) => unwrap<WorkspaceOrderDetail>(`/workspace-billing/orders/${id}/reconcile`, { method: "POST" }),
  mock: (id: string, result: "success" | "failure" | "cancelled") =>
    unwrap<WorkspaceOrderDetail>(`/workspace-billing/orders/${id}/mock`, { method: "POST", body: { result } }),
  /** Payment methods enabled on the server (shared with course purchases). */
  paymentMethods: () => unwrap<{ methods: PaymentProvider[]; mode: "mock" | "sandbox" }>("/commerce/config"),
};

export interface QuotaRefusal {
  code: WorkspaceQuotaCode;
  message: string;
  details: { limit?: number; used?: number; requested?: number; available?: number; plan?: string };
}

const QUOTA_CODES: WorkspaceQuotaCode[] = [
  "WORKSPACE_GROUP_LIMIT_REACHED",
  "WORKSPACE_MEMBER_LIMIT_REACHED",
  "WORKSPACE_STORAGE_LIMIT_REACHED",
  "WORKSPACE_FILE_SIZE_EXCEEDED",
  "WORKSPACE_AI_LIMIT_REACHED",
  "WORKSPACE_ENTITLEMENT_UNAVAILABLE",
];

/** The quota refusal inside an API error, if that is what it is. */
export function quotaRefusal(error: unknown): QuotaRefusal | null {
  if (!(error instanceof ApiClientError) || !error.body || typeof error.body !== "object") return null;
  const body = error.body as { code?: string; message?: string; details?: QuotaRefusal["details"] };
  if (!body.code || !QUOTA_CODES.includes(body.code as WorkspaceQuotaCode)) return null;
  return { code: body.code as WorkspaceQuotaCode, message: body.message ?? "", details: body.details ?? {} };
}

/** A machine-readable code from a billing error (`details.code` for business rules). */
export function billingErrorCode(error: unknown): string | null {
  if (!(error instanceof ApiClientError) || !error.body || typeof error.body !== "object") return null;
  const body = error.body as { code?: string; details?: { code?: string } };
  return body.details?.code ?? body.code ?? null;
}
