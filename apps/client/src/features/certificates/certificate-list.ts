import type { IssuedCertificate } from "@/lib/api";

export type CertificateSort = "newest" | "oldest" | "title";

export interface CertificateFilter {
  q: string;
  subject: "" | "course" | "roadmap";
  year: string;
  sort: CertificateSort;
}

/** "Lập trình Đệ quy" and "lap trinh de quy" must match. */
const fold = (text: string) => text.normalize("NFD").replace(/\p{M}/gu, "").replace(/đ/gi, "d").toLowerCase();

const issuedYear = (iso: string) => new Date(iso).toLocaleDateString("en-CA", { timeZone: "Asia/Ho_Chi_Minh" }).slice(0, 4);

export function certificateYears(items: IssuedCertificate[]): string[] {
  return [...new Set(items.map((item) => issuedYear(item.issuedAt)))].sort().reverse();
}

export function filterCertificates(items: IssuedCertificate[], filter: CertificateFilter): IssuedCertificate[] {
  const needle = fold(filter.q.trim());
  const kept = items.filter(
    (item) =>
      (!filter.subject || item.subject === filter.subject) &&
      (!filter.year || issuedYear(item.issuedAt) === filter.year) &&
      (!needle || [item.data.subjectTitle, item.data.instructorName, item.code].some((text) => fold(text).includes(needle))),
  );
  const byDate = (a: IssuedCertificate, b: IssuedCertificate) => Date.parse(a.issuedAt) - Date.parse(b.issuedAt);
  return kept.sort(
    filter.sort === "title"
      ? (a, b) => a.data.subjectTitle.localeCompare(b.data.subjectTitle, "vi")
      : filter.sort === "oldest"
        ? byDate
        : (a, b) => byDate(b, a),
  );
}
