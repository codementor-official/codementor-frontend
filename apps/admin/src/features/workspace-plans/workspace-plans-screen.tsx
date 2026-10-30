"use client";

import { useMemo } from "react";
import { Gem } from "lucide-react";
import { PageHeader, SegmentedTabs, useUrlState } from "@codementor/ui";
import { OverviewTab } from "./overview-tab";
import { PlansTab } from "./plans-tab";
import { SubscribersTab } from "./subscribers-tab";
import { AuditTab, CouponsTab, OrdersTab, SettingsTab } from "./operations-tabs";
import { SubscriberDrawer } from "./subscriber-drawer";
import { OrderDrawer } from "./order-drawer";
import { CouponDrawer } from "./coupon-drawer";
import { TraceProvider, setQuery, type PlansTab as Tab, type Trace } from "./trace";

const TABS: { value: Tab; label: string }[] = [
  { value: "overview", label: "Tổng quan" },
  { value: "plans", label: "Gói & phiên bản" },
  { value: "subscribers", label: "Người đăng ký" },
  { value: "orders", label: "Giao dịch" },
  { value: "coupons", label: "Mã giảm giá" },
  { value: "settings", label: "Cài đặt" },
  { value: "audit", label: "Nhật ký" },
];

/** Filters and pages each tab keeps in the URL; reset when another tab is opened with filters. */
const TAB_PARAMS = ["sPage", "sQ", "sPlan", "sState", "oPage", "oStatus", "oQ", "aPage", "aCat"];

export function WorkspacePlansScreen() {
  const [tab, setTab] = useUrlState<Tab>("tab", "overview");
  const [user] = useUrlState("user", "");
  const [order] = useUrlState("order", "");
  const [coupon] = useUrlState("coupon", "");

  const trace = useMemo<Trace>(
    () => ({
      // One detail at a time: opening another replaces it, Back-free and predictable.
      openUser: (id) => setQuery({ user: id, order: null, coupon: null }),
      openOrder: (id) => setQuery({ order: id, user: null, coupon: null }),
      openCoupon: (id) => setQuery({ coupon: id, user: null, order: null }),
      goTab: (next, filters = {}) =>
        setQuery({
          ...Object.fromEntries(TAB_PARAMS.map((k) => [k, null])),
          ...filters,
          tab: next === "overview" ? null : next,
          user: null,
          order: null,
          coupon: null,
        }),
    }),
    [],
  );

  return (
    <TraceProvider value={trace}>
      <div className="space-y-4">
        <PageHeader
          icon={Gem}
          title="Gói Workspace"
          description="Bảng giá, phiên bản gói, người đăng ký và giao dịch của gói nhóm học tập. Bấm vào số liệu, tên người dùng, đơn hay mã để xem chi tiết."
          center={<SegmentedTabs options={TABS} value={tab} onChange={(v) => setTab(v as Tab)} />}
        />
        {tab === "overview" && <OverviewTab />}
        {tab === "plans" && <PlansTab />}
        {tab === "subscribers" && <SubscribersTab />}
        {tab === "orders" && <OrdersTab />}
        {tab === "coupons" && <CouponsTab />}
        {tab === "settings" && <SettingsTab />}
        {tab === "audit" && <AuditTab />}
      </div>
      {user && <SubscriberDrawer key={user} userId={user} onClose={() => setQuery({ user: null })} />}
      {order && <OrderDrawer key={order} orderId={order} onClose={() => setQuery({ order: null })} />}
      {coupon && <CouponDrawer key={coupon} couponId={coupon} onClose={() => setQuery({ coupon: null })} />}
    </TraceProvider>
  );
}
