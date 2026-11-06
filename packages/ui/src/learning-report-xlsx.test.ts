/**
 * Self-check for the learning report and issued-certificates workbooks. Run with `pnpm test learning-report-xlsx`.
 */
import assert from "node:assert/strict";
import ExcelJS from "exceljs";
import type { LearningReportData } from "./learning-report";
import { buildLearningReportWorkbook } from "./learning-report-xlsx";
import { buildIssuedCertificatesWorkbook } from "./certificate/certificates-xlsx";

const counts = { enrolled: 4, notStarted: 1, inProgress: 2, stalled: 1, completed: 1, dropped: 1, newEnrollments: 2, recentCompletions: 1, avgProgress: 45.5, medianDaysToComplete: 2.6 };
const data: LearningReportData = {
  days: 30,
  stalledDays: 14,
  summary: {
    courseEnrollments: 6, notStarted: 1, inProgress: 3, stalled: 1, completed: 2, dropped: 1, completionRate: 33.3,
    newEnrollments: 2, recentCompletions: 1, certificates: 3, recentCertificates: 1, roadmapEnrollments: 4, roadmapsCompleted: 1, outOfOrderStarts: 1,
  },
  courses: [
    { ...counts, id: "c1", title: "Python cơ bản", status: "published", outOfOrder: 1, certificates: 1 },
    { ...counts, enrolled: 2, completed: 1, id: "c2", title: "Go", status: "archived", outOfOrder: 0, certificates: 1, medianDaysToComplete: null },
  ],
  roadmaps: [
    {
      ...counts, id: "r1", title: "Backend", status: "published", outOfOrder: 1, certificates: 1,
      funnel: [
        { position: 1, title: "Python cơ bản", isOptional: false, started: 4, completed: 2, outOfOrder: 0 },
        { position: 2, title: "Go", isOptional: true, started: 1, completed: 0, outOfOrder: 1 },
      ],
    },
  ],
};

(async () => {
  const load = async (built: ExcelJS.Workbook) => {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(await built.xlsx.writeBuffer());
    return workbook;
  };

  const report = await load(buildLearningReportWorkbook(ExcelJS, data, new Date("2026-11-06T05:00:00Z")));
  assert.deepEqual(report.worksheets.map((s) => s.name), ["Tổng quan", "Theo khóa học", "Theo lộ trình", "Phễu lộ trình", "Cách tính"]);
  const overview = report.getWorksheet("Tổng quan")!;
  assert.equal((overview.getCell("B4").value as Date).toISOString().slice(11, 16), "12:00"); // Vietnam clock
  assert.ok(Math.abs(Number(overview.getCell("B11").value) - 0.333) < 1e-9); // rate as a fraction

  const courses = report.getWorksheet("Theo khóa học")!;
  assert.deepEqual([courses.getCell("A5").value, courses.getCell("B6").value], ["Python cơ bản", "Đã gỡ"]);
  assert.equal(courses.getCell("H5").value, 0.25); // completed / enrolled
  assert.equal(courses.getCell("J5").value, 0.455); // average progress as a fraction
  assert.equal(courses.getCell("K6").value, null); // no completions → no median
  assert.equal((courses.getCell("C7").value as { result: number }).result, 6); // TỔNG ghi danh

  const funnel = report.getWorksheet("Phễu lộ trình")!;
  assert.deepEqual([funnel.getCell("B6").value, funnel.getCell("D6").value, funnel.getCell("H5").value], [2, "Có", 0.5]);

  const certificates = await load(
    buildIssuedCertificatesWorkbook(
      ExcelJS,
      {
        query: "node",
        total: 3,
        rows: [
          { code: "DQ3Q3HPX3K", recipientName: "Nguyễn An", email: "a@x.vn", subject: "course", data: { subjectTitle: "Node.js" }, issuedAt: "2026-11-06T02:00:00Z", revokedAt: null, revokeReason: null },
          { code: "2UAQFDYGLY", recipientName: "An", email: null, subject: "roadmap", data: { subjectTitle: "Backend" }, issuedAt: "2026-11-05T02:00:00Z", revokedAt: "2026-11-06T03:00:00Z", revokeReason: "In sai tên" },
        ],
      },
      new Date("2026-11-06T05:00:00Z"),
    ),
  );
  const facts = certificates.getWorksheet("Tổng quan")!;
  assert.deepEqual([facts.getCell("B7").value, facts.getCell("B8").value], [1, 1]); // valid, revoked
  assert.match(String(facts.getCell("A12").value), /2\/3/); // truncation is stated
  const list = certificates.getWorksheet("Chứng chỉ")!;
  assert.deepEqual([list.getCell("D6").value, list.getCell("G6").value, list.getCell("I6").value], ["Lộ trình", "Đã thu hồi", "In sai tên"]);
  assert.equal((list.getCell("F5").value as Date).toISOString().slice(11, 16), "09:00");
  console.log("learning-report-xlsx: ok");
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
