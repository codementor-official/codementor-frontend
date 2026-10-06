export interface RevenueReport {
  scope: "admin" | "lecturer";
  from: string;
  to: string;
  timezone: string;
  totals: { gross: number; revenue: number; refunded: number; paidOrders: number };
  daily: { date: string; gross: number; revenue: number; refunded: number; orders: number }[];
  courses: { id: string; title: string; gross: number; revenue: number; orders: number }[];
  statuses: Record<string, number>;
}
export interface RevenueInstructor {
  id: string;
  name: string;
  email: string;
  orders: number;
  gross: number;
  revenue: number;
  platformRevenue: number;
  pending: number;
  available: number;
  reserved: number;
  paid: number;
}
