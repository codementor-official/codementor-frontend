export interface CommercePage<T> {
  items: T[];
  page: number;
  limit: number;
  total: number;
}
export interface CourseOffer {
  priceVnd: number;
  listPriceVnd: number;
  salePriceVnd: number | null;
  savingsVnd: number;
  discountPercent: number;
  promotion: CoursePromotion | null;
  pricingType: "free" | "paid";
  owned: boolean;
  currency: "VND";
}
export interface CoursePromotion {
  label: string;
  startsAt: string | null;
  endsAt: string | null;
  isActive: boolean;
}
export interface CoursePromotionRequest {
  id: string;
  action: "upsert" | "remove";
  salePriceVnd: number | null;
  label: string | null;
  startsAt: string | null;
  endsAt: string | null;
  isActive: boolean | null;
  status: "pending" | "approved" | "rejected" | "cancelled";
  reviewReason: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}
export interface CoursePromotionProduct {
  courseId: string;
  title: string;
  coverImageUrl: string | null;
  status: string;
  authorName: string | null;
  priceVnd: number;
  listPriceVnd: number;
  salePriceVnd: number | null;
  savingsVnd: number;
  discountPercent: number;
  promotion: CoursePromotion | null;
  promotionRequest: CoursePromotionRequest | null;
}
export type PaymentMethod = "mock" | "vnpay" | "momo";
export interface CommerceConfig {
  methods: PaymentMethod[];
  mode: "mock" | "sandbox";
  label: string;
}
export interface CommerceOrder {
  id: string;
  buyer: { name: string; email: string } | null;
  courseId: string;
  courseTitle: string;
  courseCoverImageUrl: string | null;
  amount: number;
  currency: string;
  instructorAmount: number;
  platformAmount: number;
  instructorBps: number;
  status: string;
  incomeState: string;
  mode: string;
  createdAt: string;
  expiresAt: string;
  availableAt: string | null;
  settledAt: string | null;
  feeAmount: number | null;
  feeSource: string;
}
export interface CoursePurchasePage extends CommercePage<CommerceOrder> {
  summary: { paidCount: number; grossAmount: number; instructorAmount: number };
}
export interface PurchaseDetail extends CommerceOrder {
  payment: {
    id: string;
    provider: PaymentMethod;
    status: string;
    checkoutUrl: string | null;
  };
  refund: { id: string; status: string; reason: string } | null;
}
export interface CommercePolicy {
  instructorBps: number;
  holdDays: number;
  minimumWithdrawal: number;
  approvalRequired: boolean;
}
export type PayoutMethod = "bank" | "momo" | "vnpay";
export interface PayoutRecipient {
  method: PayoutMethod;
  institutionCode: string;
  accountName: string;
  accountNumber: string;
  label: string;
  testReference: string;
}
export interface WalletSummary {
  balances: Record<string, number>;
  recipient: PayoutRecipient | null;
  policy: CommercePolicy;
  mode: string;
}
export interface CommerceWithdrawal {
  id: string;
  amount: number;
  status: string;
  scenario: string;
  recipient: PayoutRecipient;
  createdAt: string;
  reason: string | null;
}
export interface CommerceLedgerEntry {
  id: string;
  account: string;
  amount: number;
  event: string;
  createdAt: string;
  orderId: string | null;
  withdrawalId: string | null;
}
export interface CommerceAudit {
  id: string;
  action: string;
  entityId: string | null;
  details: Record<string, unknown>;
  createdAt: string;
}
export const COMMERCE_STATUS: Record<string, string> = {
  pending: "Đang chờ",
  paid: "Đã thanh toán",
  failed: "Thất bại",
  cancelled: "Đã hủy",
  expired: "Hết hạn",
  review: "Cần kiểm tra",
  refunded: "Đã hoàn tiền",
  none: "Chưa phát sinh",
  available: "Có thể rút",
  refund_held: "Giữ để hoàn tiền",
  requested: "Chờ duyệt",
  approved: "Đã duyệt",
  processing: "Đang xử lý",
  unknown: "Chưa rõ kết quả",
  succeeded: "Thành công",
  rejected: "Đã từ chối",
  reserved: "Đang giữ để rút",
  debt: "Cần thu hồi",
  clearing: "Tài khoản đối ứng",
  platform: "Phần CodeMentor",
  fees: "Phí cổng thanh toán",
};
