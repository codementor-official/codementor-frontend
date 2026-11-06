/**
 * Thiết kế chứng chỉ v1 (ADR 0005) — bản cho trình duyệt.
 *
 * CHÉP từ `codementor-backend/apps/learning-service/src/contexts/certificate/domain/certificate-design.ts`
 * (API là chốt chặn cuối) và khớp với `apps/ai-service/app/lecter/certificate.py`. Đổi luật thì
 * đổi cả ba. Phần dưới cùng (định dạng dữ liệu, dữ liệu mẫu) chỉ có ở đây.
 */
export const CERTIFICATE_LAYOUTS = ["classic", "modern", "minimal"] as const;
export const CERTIFICATE_ACCENTS = ["orange", "ink", "emerald", "blue", "violet"] as const;

/** Ô điền tự động. Ngoài danh sách này thì từ chối — chữ `{{x}}` in nguyên lên chứng chỉ là lỗi. */
export const CERTIFICATE_PLACEHOLDERS = [
  "learnerName",
  "subjectKind",
  "subjectTitle",
  "instructorName",
  "startedAt",
  "completedAt",
  "durationHours",
  "issuedAt",
  "certificateCode",
] as const;

export type CertificatePlaceholder = (typeof CERTIFICATE_PLACEHOLDERS)[number];
export type CertificateData = Record<CertificatePlaceholder, string>;

export interface CertificateField {
  label: string;
  value: string;
}

export interface CertificateDesign {
  version: 1;
  layout: (typeof CERTIFICATE_LAYOUTS)[number];
  accent: (typeof CERTIFICATE_ACCENTS)[number];
  heading: string;
  body: string;
  signerName: string;
  signerTitle?: string;
  logoUrl?: string;
  signatureUrl?: string;
  fields: CertificateField[];
}

export const MAX_FIELDS = 6;
const LIMITS = {
  heading: [2, 80],
  body: [10, 400],
  signerName: [0, 80],
  signerTitle: [0, 80],
  label: [1, 40],
  value: [1, 120],
  url: [0, 500],
} as const;

const PLACEHOLDER = /\{\{\s*([^{}]*?)\s*\}\}/g;

/** Mọi placeholder không có trong danh sách, kèm dấu ngoặc lẻ (`{{` không đóng). */
export function unknownPlaceholders(text: string): string[] {
  const unknown = [...text.matchAll(PLACEHOLDER)]
    .map((match) => match[1])
    .filter((name) => !(CERTIFICATE_PLACEHOLDERS as readonly string[]).includes(name));
  const stray = text.replace(PLACEHOLDER, "");
  if (stray.includes("{{") || stray.includes("}}")) unknown.push("{{…}} không đóng");
  return unknown;
}

export function renderPlaceholders(text: string, data: Partial<CertificateData>): string {
  return text.replace(PLACEHOLDER, (whole, name: string) =>
    name in data ? (data[name as CertificatePlaceholder] ?? "") : whole,
  );
}

function text(
  errors: string[],
  label: string,
  value: unknown,
  [min, max]: readonly [number, number],
  optional = false,
): string | undefined {
  if (value === undefined || value === null || value === "") {
    if (optional || min === 0) return undefined;
    errors.push(`${label}: bắt buộc`);
    return undefined;
  }
  if (typeof value !== "string") {
    errors.push(`${label}: phải là chuỗi`);
    return undefined;
  }
  const trimmed = value.trim();
  if (trimmed.length < min || trimmed.length > max) {
    errors.push(`${label}: dài ${min}–${max} ký tự`);
  }
  const unknown = unknownPlaceholders(trimmed);
  if (unknown.length > 0) errors.push(`${label}: ô điền không hợp lệ ${unknown.join(", ")}`);
  return trimmed;
}

function url(errors: string[], label: string, value: unknown): string | undefined {
  const raw = text(errors, label, value, LIMITS.url, true);
  if (raw === undefined) return undefined;
  if (!/^https:\/\/\S+$/.test(raw)) errors.push(`${label}: phải là đường dẫn https`);
  return raw;
}

/**
 * Kiểm và chuẩn hóa (trim, bỏ trường lạ). Trả `errors` rỗng nghĩa là `design` dùng được.
 * Không kiểm nguồn ảnh: việc đó cần biết kho đối tượng, use case làm.
 */
export function validateDesign(input: unknown): { design?: CertificateDesign; errors: string[] } {
  const errors: string[] = [];
  if (typeof input !== "object" || input === null || Array.isArray(input)) {
    return { errors: ["Thiết kế phải là một object"] };
  }
  const raw = input as Record<string, unknown>;
  if (raw.version !== 1) errors.push("version: chỉ hỗ trợ 1");
  if (!CERTIFICATE_LAYOUTS.includes(raw.layout as never)) {
    errors.push(`layout: một trong ${CERTIFICATE_LAYOUTS.join(", ")}`);
  }
  if (!CERTIFICATE_ACCENTS.includes(raw.accent as never)) {
    errors.push(`accent: một trong ${CERTIFICATE_ACCENTS.join(", ")}`);
  }
  const heading = text(errors, "Tiêu đề", raw.heading, LIMITS.heading);
  const body = text(errors, "Nội dung", raw.body, LIMITS.body);
  const signerName = text(errors, "Người ký", raw.signerName, LIMITS.signerName) ?? "";
  const signerTitle = text(errors, "Chức danh", raw.signerTitle, LIMITS.signerTitle, true);
  const logoUrl = url(errors, "Logo", raw.logoUrl);
  const signatureUrl = url(errors, "Chữ ký", raw.signatureUrl);

  // Không bắt buộc {{learnerName}}: bố cục nào cũng tự in tên người nhận cỡ lớn
  // (`CertificateView`), chèn thêm vào nội dung thì tên sẽ hiện hai lần.

  const fields: CertificateField[] = [];
  if (raw.fields !== undefined && !Array.isArray(raw.fields)) {
    errors.push("fields: phải là danh sách");
  } else {
    const list = (raw.fields as unknown[] | undefined) ?? [];
    if (list.length > MAX_FIELDS) errors.push(`fields: tối đa ${MAX_FIELDS} dòng`);
    list.slice(0, MAX_FIELDS).forEach((item, index) => {
      const row = (typeof item === "object" && item !== null ? item : {}) as Record<string, unknown>;
      const label = text(errors, `Dòng ${index + 1} — nhãn`, row.label, LIMITS.label);
      const value = text(errors, `Dòng ${index + 1} — giá trị`, row.value, LIMITS.value);
      if (label && value) fields.push({ label, value });
    });
  }

  if (errors.length > 0) return { errors };
  return {
    errors,
    design: {
      version: 1,
      layout: raw.layout as CertificateDesign["layout"],
      accent: raw.accent as CertificateDesign["accent"],
      heading: heading!,
      body: body!,
      signerName,
      ...(signerTitle ? { signerTitle } : {}),
      ...(logoUrl ? { logoUrl } : {}),
      ...(signatureUrl ? { signatureUrl } : {}),
      fields,
    },
  };
}


/** Dữ liệu thô lưu trong `certificates.data` — ngày dạng ISO, định dạng lúc vẽ. */
export interface CertificateRawData {
  learnerName: string;
  subjectKind: "course" | "roadmap";
  subjectTitle: string;
  instructorName: string;
  startedAt: string | null;
  completedAt: string | null;
  durationHours: number | null;
  issuedAt: string;
  certificateCode: string;
}

const date = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "Asia/Ho_Chi_Minh" }) : "—";

export function formatCertificateData(raw: CertificateRawData): CertificateData {
  return {
    learnerName: raw.learnerName,
    subjectKind: raw.subjectKind === "course" ? "khóa học" : "lộ trình",
    subjectTitle: raw.subjectTitle,
    instructorName: raw.instructorName,
    startedAt: date(raw.startedAt),
    completedAt: date(raw.completedAt),
    durationHours: raw.durationHours === null ? "—" : String(raw.durationHours),
    issuedAt: date(raw.issuedAt),
    certificateCode: raw.certificateCode,
  };
}

/** Dữ liệu giả cho màn soạn mẫu — đủ dài để thấy chữ có tràn không. */
export function sampleCertificateData(subject: "course" | "roadmap" = "course"): CertificateRawData {
  return {
    learnerName: "Nguyễn Văn An",
    subjectKind: subject,
    subjectTitle: subject === "course" ? "Thiết kế cơ sở dữ liệu quan hệ" : "Lộ trình Backend Developer",
    instructorName: "Trần Minh Khoa",
    startedAt: "2026-09-01T03:00:00Z",
    completedAt: "2026-10-15T03:00:00Z",
    durationHours: 16,
    issuedAt: "2026-10-16T03:00:00Z",
    certificateCode: "K7Q2M9XD3F",
  };
}

/** Mẫu mặc định — cùng nội dung với seed của migration 0048, dùng làm điểm xuất phát khi tạo mẫu mới. */
export const DEFAULT_CERTIFICATE_DESIGN: CertificateDesign = {
  version: 1,
  layout: "classic",
  accent: "orange",
  heading: "Chứng nhận hoàn thành",
  body: "Đã hoàn thành {{subjectKind}} “{{subjectTitle}}” trên nền tảng CodeMentor.",
  signerName: "{{instructorName}}",
  signerTitle: "Giảng viên",
  fields: [
    { label: "Ngày hoàn thành", value: "{{completedAt}}" },
    { label: "Thời lượng", value: "{{durationHours}} giờ" },
    { label: "Mã chứng chỉ", value: "{{certificateCode}}" },
  ],
};

/** Nhãn tiếng Việt cho chip chèn ô điền. */
export const PLACEHOLDER_LABELS: Record<CertificatePlaceholder, string> = {
  learnerName: "Tên học viên",
  subjectKind: "“khóa học”/“lộ trình”",
  subjectTitle: "Tên khóa/lộ trình",
  instructorName: "Tên giảng viên",
  startedAt: "Ngày bắt đầu",
  completedAt: "Ngày hoàn thành",
  durationHours: "Số giờ học",
  issuedAt: "Ngày cấp",
  certificateCode: "Mã chứng chỉ",
};
