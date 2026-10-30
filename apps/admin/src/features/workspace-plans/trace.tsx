"use client";

import { createContext, useContext } from "react";
import type { AuditEntry } from "@codementor/types";

export type PlansTab = "overview" | "plans" | "subscribers" | "orders" | "coupons" | "settings" | "audit";

/**
 * One way to reach any detail from anywhere on the screen: a figure, a chart, an audit entry or
 * another drawer. Details live in the query string (`?user=`, `?order=`, `?coupon=`), so a link
 * pasted to a colleague opens the same drawer.
 */
export interface Trace {
  openUser: (userId: string) => void;
  openOrder: (orderId: string) => void;
  openCoupon: (couponId: string) => void;
  /** Switches tab and replaces that tab's filters (`sState`, `oStatus`…); pages reset to 1. */
  goTab: (tab: PlansTab, filters?: Record<string, string>) => void;
}

const TraceContext = createContext<Trace | null>(null);
export const TraceProvider = TraceContext.Provider;

export function useTrace(): Trace {
  const trace = useContext(TraceContext);
  if (!trace) throw new Error("useTrace must be used inside the Workspace plans screen");
  return trace;
}

/** Writes several query parameters at once, the way `useUrlState` writes one. */
export function setQuery(changes: Record<string, string | null>) {
  const params = new URLSearchParams(window.location.search);
  for (const [key, value] of Object.entries(changes)) {
    if (value) params.set(key, value);
    else params.delete(key);
  }
  const query = params.toString();
  window.history.replaceState(null, "", `${window.location.pathname}${query ? `?${query}` : ""}${window.location.hash}`);
}

/** Text that opens a detail; keeps the same look in tables, lists and drawers. */
export function TraceLink({ onClick, children, className = "" }: { onClick: () => void; children: React.ReactNode; className?: string }) {
  return (
    <button type="button" onClick={onClick} className={`text-left font-medium text-primary underline-offset-2 hover:underline ${className}`}>
      {children}
    </button>
  );
}

/** What an audit entry is about, linked to its detail: an order, a coupon, the plans or a customer. */
export function AuditSubject({ entry: e }: { entry: AuditEntry }) {
  const trace = useTrace();
  if (e.subject === null) return <span className="text-muted-foreground">—</span>;
  if ((e.action.startsWith("workspace_order.") || e.action.startsWith("workspace_payment.")) && e.entity_id)
    return <TraceLink onClick={() => trace.openOrder(e.entity_id!)}>{e.subject} · xem đơn</TraceLink>;
  if (e.action.startsWith("workspace_coupon.") && e.entity_id) return <TraceLink onClick={() => trace.openCoupon(e.entity_id!)}>{e.subject}</TraceLink>;
  if (e.action.startsWith("workspace_plan.")) return <TraceLink onClick={() => trace.goTab("plans")}>{e.subject}</TraceLink>;
  if (e.target_user_id) return <TraceLink onClick={() => trace.openUser(e.target_user_id!)}>{e.subject}</TraceLink>;
  return <span>{e.subject}</span>;
}
