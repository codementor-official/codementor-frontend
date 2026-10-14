import {
  COMMERCE_INCOME_STATUS,
  COMMERCE_STATUS,
  type CommerceAudit,
  type CommerceLedgerEntry,
  type CommerceOrder,
  type CommerceWithdrawal,
} from "@codementor/types";
import { csvDateTime, type CsvRow } from "@codementor/utils";

export interface CsvTable {
  headers: string[];
  rows: CsvRow[];
}

const status = (value: string) => COMMERCE_STATUS[value] ?? value;
const maskAccount = (value: string | undefined) => (value ? `****${value.slice(-4)}` : "");

/**
 * Bảng đơn hàng. `admin` thêm phần CodeMentor và phí cổng; giảng viên chỉ thấy phần của mình.
 * Mỗi cột một giá trị (không gộp "Ngân hàng · ****1234"), tiền là số nguyên VND, thời điểm
 * theo giờ Việt Nam dạng bảng tính hiểu được.
 */
export function ordersCsv(orders: CommerceOrder[], audience: "lecturer" | "admin"): CsvTable {
  const headers = [
    "Mã đơn",
    "Khóa học",
    "Học viên",
    "Email học viên",
    "Thời điểm tạo",
    "Thời điểm thanh toán",
    "Giá niêm yết (VND)",
    "Giảm giá (VND)",
    "Khuyến mãi",
    "Số tiền thanh toán (VND)",
    "Doanh thu giảng viên (VND)",
    ...(audience === "admin" ? ["Phần CodeMentor (VND)", "Phí cổng thanh toán (VND)", "Tỷ lệ giảng viên (%)"] : []),
    "Trạng thái đơn",
    "Trạng thái doanh thu",
    "Khả dụng từ",
  ];
  const rows = orders.map((order) => [
    order.id,
    order.courseTitle,
    order.buyer?.name ?? "",
    order.buyer?.email ?? "",
    csvDateTime(order.createdAt),
    csvDateTime(order.settledAt),
    order.pricingSnapshot?.originalPriceVnd ?? order.amount,
    order.pricingSnapshot?.discountVnd ?? 0,
    order.pricingSnapshot?.promotion?.label ?? "",
    order.amount,
    order.instructorAmount,
    ...(audience === "admin" ? [order.platformAmount, order.feeAmount ?? "", order.instructorBps / 100] : []),
    status(order.status),
    COMMERCE_INCOME_STATUS[order.incomeState] ?? order.incomeState,
    csvDateTime(order.availableAt),
  ]);
  return { headers, rows };
}

export function withdrawalsCsv(withdrawals: CommerceWithdrawal[]): CsvTable {
  return {
    headers: [
      "Mã yêu cầu",
      "Thời điểm",
      "Số tiền (VND)",
      "Phương thức",
      "Ngân hàng / ví",
      "Chủ tài khoản",
      "Số tài khoản",
      "Trạng thái",
      "Lý do",
    ],
    rows: withdrawals.map((item) => [
      item.id,
      csvDateTime(item.createdAt),
      item.amount,
      item.recipient.method.toUpperCase(),
      item.recipient.institutionCode,
      item.recipient.accountName,
      // Không xuất số tài khoản đầy đủ ra tệp: tệp được gửi đi, chuyển tiếp, lưu lâu.
      maskAccount(item.recipient.accountNumber),
      status(item.status),
      item.reason ?? "",
    ]),
  };
}

export function ledgerCsv(entries: CommerceLedgerEntry[]): CsvTable {
  return {
    headers: ["Thời điểm", "Sự kiện", "Loại số dư", "Biến động (VND)", "Mã đơn", "Mã yêu cầu rút"],
    rows: entries.map((entry) => [
      csvDateTime(entry.createdAt),
      entry.event.split(":")[0],
      status(entry.account),
      entry.amount,
      entry.orderId ?? "",
      entry.withdrawalId ?? "",
    ]),
  };
}

export function auditCsv(entries: CommerceAudit[]): CsvTable {
  return {
    headers: ["Thời điểm", "Thao tác", "Đối tượng", "Chi tiết"],
    rows: entries.map((entry) => [
      csvDateTime(entry.createdAt),
      entry.action,
      entry.entityId ?? "",
      JSON.stringify(entry.details),
    ]),
  };
}
