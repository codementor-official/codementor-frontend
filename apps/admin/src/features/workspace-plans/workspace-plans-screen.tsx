"use client";

import { Gem } from "lucide-react";
import { PageHeader, SegmentedTabs, useUrlState } from "@codementor/ui";
import { OverviewTab } from "./overview-tab";
import { PlansTab } from "./plans-tab";
import { SubscribersTab } from "./subscribers-tab";
import { AuditTab, CouponsTab, OrdersTab, SettingsTab } from "./operations-tabs";

const TABS = [
  { value: "overview", label: "Tổng quan" },
  { value: "plans", label: "Gói & phiên bản" },
  { value: "subscribers", label: "Người đăng ký" },
  { value: "orders", label: "Giao dịch" },
  { value: "coupons", label: "Mã giảm giá" },
  { value: "settings", label: "Cài đặt" },
  { value: "audit", label: "Nhật ký" },
] as const;
type Tab = (typeof TABS)[number]["value"];

export function WorkspacePlansScreen() {
  const [tab, setTab] = useUrlState<Tab>("tab", "overview");
  return (
    <div className="space-y-4">
      <PageHeader
        icon={Gem}
        title="Gói Workspace"
        description="Bảng giá, phiên bản gói, người đăng ký và giao dịch của gói nhóm học tập."
        center={<SegmentedTabs options={[...TABS]} value={tab} onChange={(v) => setTab(v as Tab)} />}
      />
      {tab === "overview" && <OverviewTab />}
      {tab === "plans" && <PlansTab />}
      {tab === "subscribers" && <SubscribersTab />}
      {tab === "orders" && <OrdersTab />}
      {tab === "coupons" && <CouponsTab />}
      {tab === "settings" && <SettingsTab />}
      {tab === "audit" && <AuditTab />}
    </div>
  );
}
