/** Contracts of `/workspace-billing` (learning-service) and `/workspaces/plan-usage` (workspace-service). */
export type BillingCycle = "month" | "year";
export type FeatureKey = "priority_support" | "advanced_assignments" | "detailed_analytics";

export type SubscriptionState =
  | "FREE"
  | "ACTIVE"
  | "CANCEL_SCHEDULED"
  | "GRACE_PERIOD"
  | "EXPIRED"
  | "CANCELLED"
  | "SUSPENDED";

export interface Entitlements {
  maxOwnedGroups: number;
  /** `null` = unlimited under the fair-use policy. */
  maxMembersPerGroup: number | null;
  maxStorageBytes: number;
  maxUploadBytes: number;
  monthlyAiRequests: number;
  features: FeatureKey[];
}

export interface PlanVersion {
  id: string;
  planId: string;
  version: number;
  status: "draft" | "published";
  name: string;
  tagline: string;
  description: string;
  highlights: string[];
  monthlyPriceVnd: number;
  annualPriceVnd: number | null;
  entitlements: Entitlements;
  availableFrom: string | null;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PlanSummary {
  id: string;
  code: string;
  sortOrder: number;
  isDefault: boolean;
  isRecommended: boolean;
  isPurchasable: boolean;
  status: "active" | "hidden" | "archived";
}

export interface PlanOnSale extends PlanSummary {
  version: PlanVersion;
}

export interface FeatureDefinition {
  key: FeatureKey;
  label: string;
  /** `planned` features are shown as coming soon and grant nothing yet. */
  status: "available" | "planned";
  description: string;
}

export interface PlanCatalog {
  plans: PlanOnSale[];
  features: FeatureDefinition[];
}

export type WorkspaceOrderStatus = "pending" | "paid" | "failed" | "cancelled" | "expired" | "review" | "refunded";

export interface WorkspaceOrder {
  id: string;
  kind: "new" | "renewal" | "upgrade";
  planId: string;
  planName: string;
  billingCycle: BillingCycle;
  listPriceVnd: number;
  discountVnd: number;
  creditVnd: number;
  amountVnd: number;
  currency: "VND";
  coupon: { code: string } | null;
  entitlements: Entitlements;
  status: WorkspaceOrderStatus;
  mode: "mock" | "sandbox";
  subscriptionId: string | null;
  paidAt: string | null;
  expiresAt: string;
  createdAt: string;
}

export interface WorkspaceOrderDetail extends WorkspaceOrder {
  payment: { provider: "mock" | "vnpay" | "momo"; status: string; checkoutUrl: string | null };
}

export interface SubscriptionOverview {
  state: SubscriptionState;
  entitlementSource: "free" | "paid" | "grace";
  plan: { id: string; code: string; name: string; versionId: string };
  entitlements: Entitlements;
  subscription: null | {
    id: string;
    planId: string;
    planName: string;
    billingCycle: BillingCycle;
    priceVnd: number;
    protectedEntitlements: Entitlements;
    termsVersion: string;
    startedAt: string;
    currentPeriod: { startsAt: string; endsAt: string } | null;
    paidThrough: string | null;
    graceEndsAt: string | null;
    cancelAtPeriodEnd: boolean;
    renewable: boolean;
    hasQueuedTerm: boolean;
    scheduledChange: null | { planId: string; planName: string | null; billingCycle: BillingCycle | null };
    suspendedReason: string | null;
  };
  pendingOrder: WorkspaceOrder | null;
  policy: { graceDays: number; renewalReminderDays: number; overageNoticeDays: number; overageReadOnlyDays: number; autoRenew: false };
}

export type PlanChange = "new" | "renewal" | "upgrade" | "downgrade" | "cycle_change";

export interface QuoteSnapshot {
  kind: "new" | "renewal" | "upgrade";
  plan: { id: string; code: string; name: string; versionId: string; version: number };
  billingCycle: BillingCycle;
  entitlements: Entitlements;
  listPriceVnd: number;
  discountVnd: number;
  creditVnd: number;
  amountVnd: number;
  coupon: { id: string; code: string; kind: "percent" | "fixed"; value: number } | null;
  /** `paidVnd` is the unused value credited (same as `creditVnd`), not what was paid for the term. */
  credit: { subscriptionId: string; termStart: string; termEnd: string; paidVnd: number } | null;
  startsAt: string | null;
  termsVersion: string;
  quotedAt: string;
}

export interface Quote {
  change: PlanChange;
  current: null | {
    subscriptionId: string;
    planName: string;
    entitlements: Entitlements;
    paidThrough: string | null;
    state: SubscriptionState;
  };
  target: { planId: string; name: string; entitlements: Entitlements };
  subscriptionId: string | null;
  /** `null` for changes that are scheduled rather than paid now. */
  snapshot: QuoteSnapshot | null;
  effectiveAt: string;
  endsAt?: string;
}

export type UsageLevel = "ok" | "info" | "warning" | "reached";

export interface WorkspacePlanUsage {
  plan: { name: string; source: "free" | "paid" | "grace" };
  entitlements: Omit<Entitlements, "features"> & { source: string; planName: string };
  usage: { ownedGroups: number; storedBytes: number; reservedBytes: number; totalBytes: number; aiRequestsThisMonth: number };
  levels: { groups: UsageLevel; storage: UsageLevel; ai: UsageLevel };
  overLimit: { groups: boolean; storage: boolean; memberGroupIds: string[] };
  groups: {
    id: string;
    slug: string;
    name: string;
    status: "active" | "archived";
    memberCount: number;
    storedBytes: number;
    memberLevel: UsageLevel;
    overLimitReasons: OverageReason[];
  }[];
  /** Set once the sweep has seen the owner above their plan; dates of each stage. */
  overage: OverageTimeline | null;
}

export type OverageReason = "groups" | "members" | "storage";
export type OverageStage = "notice" | "read_only" | "hidden";

export interface OverageTimeline {
  stage: OverageStage;
  overSince: string;
  readOnlyAt: string;
  hiddenAt: string;
}

/** The group owner's plan as it applies to one group (part of the group detail). */
export interface GroupPlan {
  name: string;
  features: FeatureKey[];
  restriction: (OverageTimeline & { reasons: OverageReason[] }) | null;
}

/** Quota refusals from workspace-service; `details` carries limit and usage. */
export type WorkspaceQuotaCode =
  | "WORKSPACE_GROUP_LIMIT_REACHED"
  | "WORKSPACE_MEMBER_LIMIT_REACHED"
  | "WORKSPACE_STORAGE_LIMIT_REACHED"
  | "WORKSPACE_FILE_SIZE_EXCEEDED"
  | "WORKSPACE_AI_LIMIT_REACHED"
  | "WORKSPACE_ENTITLEMENT_UNAVAILABLE"
  | "WORKSPACE_GROUP_READ_ONLY"
  | "WORKSPACE_GROUP_HIDDEN"
  | "WORKSPACE_FEATURE_LOCKED";

export interface AdminPlan extends PlanSummary {
  openSubscriptions: number;
  onSale: PlanVersion | null;
  scheduled: PlanVersion | null;
  draft: PlanVersion | null;
}

export interface DraftVersionInput {
  name: string;
  tagline: string;
  description: string;
  highlights: string[];
  monthlyPriceVnd: number;
  annualPriceVnd: number | null;
  maxOwnedGroups: number;
  maxMembersPerGroup: number | null;
  maxStorageBytes: number;
  maxUploadBytes: number;
  monthlyAiRequests: number;
  features: FeatureKey[];
}

export interface BillingOverview {
  accounts: number;
  paidSubscribers: number;
  freeAccounts: number;
  gracePeriod: number;
  expiringIn7Days: number;
  conversionRate: number;
  renewalRate: number | null;
  contractedMonthlyValueVnd: number;
  revenue30dVnd: number;
  revenueTotalVnd: number;
  failedPayments30d: number;
  ordersInReview: number;
  revenueByPlan: { planId: string; name: string; activeSubscriptions: number; revenueVnd: number }[];
  recentEvents: { action: string; entityId: string | null; at: string; details: unknown }[];
}

export interface SubscriberRow {
  id: string;
  user: { id: string; name: string; email: string; avatarUrl: string | null };
  planId: string;
  planName: string;
  billingCycle: BillingCycle;
  priceVnd: number;
  state: SubscriptionState;
  paidThrough: string | null;
  cancelAtPeriodEnd: boolean;
  createdAt: string;
  ownedGroups: number;
  overLimitSince: string | null;
  lifetimeValueVnd: number;
}

export interface SubscriberStats {
  byState: { state: SubscriptionState; count: number }[];
  byPlan: { planId: string; name: string; count: number; monthlyValueVnd: number }[];
  byCycle: { cycle: BillingCycle; count: number }[];
  monthly: { month: string; newSubscriptions: number; renewals: number; revenueVnd: number }[];
  /** Week 0 = the next 7 days. */
  expiringByWeek: { week: number; count: number; valueVnd: number }[];
  overLimitOwners: { notice: number; readOnly: number; hidden: number };
}

export interface BillingSettings {
  graceDays: number;
  renewalReminderDays: number;
  overageNoticeDays: number;
  overageReadOnlyDays: number;
  termsVersion: string;
  updatedAt: string;
  updatedBy: string | null;
}

export type AuditCategory = "plan" | "subscription" | "order" | "payment" | "coupon" | "adjustment" | "settings";

export interface AuditEntry {
  id: string;
  action: string;
  entity_id: string | null;
  details: unknown;
  created_at: string;
  actor: string | null;
  subject: string | null;
  /** The customer the entry concerns, when there is one: opens their detail. */
  target_user_id: string | null;
}

export interface AdminOrderDetail extends WorkspaceOrder {
  buyer: { id: string; name: string; email: string };
  quote: QuoteSnapshot;
  coupon: { code: string; id?: string; description?: string | null } | null;
  replacedSubscriptionId: string | null;
  payments: {
    provider: "mock" | "vnpay" | "momo";
    status: string;
    reference: string | null;
    providerDate: string | null;
    createdAt: string;
    startedAt: string | null;
    reconciledAt: string | null;
  }[];
  ledger: { journalId: string; eventKey: string; at: string; account: string; amountVnd: number }[];
  history: { action: string; at: string; details: unknown; actor: string | null }[];
}

export interface CouponDetail {
  coupon: WorkspaceCoupon;
  redemptions: {
    status: "reserved" | "redeemed" | "released";
    at: string;
    user: { id: string; name: string; email: string };
    order: { id: string; status: WorkspaceOrderStatus; plan: string; discountVnd: number; amountVnd: number };
  }[];
}

export interface OverageOwner {
  user: { id: string; name: string; email: string };
  ownedGroups: number;
  overSince: string;
  readOnlyAt: string;
  hiddenAt: string;
  stage: OverageStage;
}

export interface BillingPage<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}

export interface SubscriberDetail {
  user: { id: string; name: string; email: string; avatarUrl: string | null };
  state: SubscriptionState;
  effective: { source: "free" | "paid" | "grace"; planName: string; entitlements: Entitlements } | null;
  subscriptions: {
    id: string;
    planName: string;
    planVersionId: string;
    billingCycle: BillingCycle;
    priceVnd: number;
    entitlements: Entitlements;
    termsVersion: string;
    cancelAtPeriodEnd: boolean;
    endedAt: string | null;
    endReason: string | null;
    suspendedAt: string | null;
    suspendedReason: string | null;
    createdAt: string;
    terms: { startsAt: string; endsAt: string; orderId: string }[];
  }[];
  orders: WorkspaceOrder[];
  adjustments: {
    id: string;
    entitlement: string;
    amount: string | number;
    starts_at: string;
    ends_at: string;
    reason: string;
    revoked_at: string | null;
    created_by_name: string;
  }[];
}

export interface WorkspaceCoupon {
  id: string;
  code: string;
  description: string;
  created_at: string;
  updated_at: string;
  created_by_name: string | null;
  discount_given_vnd?: number;
  kind: "percent" | "fixed";
  value: number;
  starts_at: string;
  ends_at: string;
  max_redemptions: number | null;
  per_user_limit: number;
  plan_ids: string[] | null;
  billing_cycles: BillingCycle[] | null;
  new_customers_only: boolean;
  is_active: boolean;
  redeemed: number;
  reserved: number;
}

export interface StorageOverview {
  storedBytes: number;
  reservedBytes: number;
  groups: number;
  owners: number;
  distribution: { bucket: string; owners: number }[];
  nearLimit: {
    ownerId: string;
    name: string;
    email: string;
    plan: string;
    usedBytes: number;
    maxStorageBytes: number;
    ownedGroups: number;
    maxOwnedGroups: number;
  }[];
}
