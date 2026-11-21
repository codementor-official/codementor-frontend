import assert from "node:assert/strict";
import type { IssuedCertificate } from "@/lib/api";
import { certificateYears, filterCertificates, type CertificateFilter } from "./certificate-list";

const cert = (code: string, subject: "course" | "roadmap", title: string, issuedAt: string, instructorName = "Trần An") =>
  ({ code, subject, issuedAt, data: { subjectTitle: title, instructorName } }) as IssuedCertificate;
const items = [
  cert("AAAAAAAAAA", "course", "Đệ quy cơ bản", "2026-01-10T00:00:00Z"),
  cert("BBBBBBBBBB", "roadmap", "Backend Developer", "2025-06-01T00:00:00Z", "Lê Bình"),
  // 31/12 17:30 UTC is already 2026 in Vietnam.
  cert("CCCCCCCCCC", "course", "An toàn web", "2025-12-31T17:30:00Z"),
];
const base: CertificateFilter = { q: "", subject: "", year: "", sort: "newest" };
const codes = (filter: Partial<CertificateFilter>) => filterCertificates(items, { ...base, ...filter }).map((c) => c.code[0]).join("");

assert.equal(codes({}), "ACB", "newest first");
assert.equal(codes({ sort: "oldest" }), "BCA");
assert.equal(codes({ sort: "title" }), "CBA", "Vietnamese title order");
assert.equal(codes({ q: "de quy" }), "A", "search ignores diacritics");
assert.equal(codes({ q: "le binh" }), "B", "search covers the instructor");
assert.equal(codes({ q: "cccccc" }), "C", "search covers the code");
assert.equal(codes({ subject: "roadmap" }), "B");
assert.equal(codes({ year: "2026" }), "AC", "year in Vietnam time");
assert.deepEqual(certificateYears(items), ["2026", "2025"]);
assert.equal(items[0].code, "AAAAAAAAAA", "the source list is not reordered");
console.log("certificate-list: ok");
