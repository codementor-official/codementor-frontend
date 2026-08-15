export interface AdminSectionDefinition {
  description: string;
  eyebrow: string;
  highlights: Array<{ label: string; value: string }>;
  title: string;
}

export const adminSections: Record<string, AdminSectionDefinition> = {
  users: {
    description: "Manage learner accounts, access status, roles, and platform membership.",
    eyebrow: "Management",
    highlights: [{ label: "Total users", value: "12,486" }, { label: "Active today", value: "8,942" }, { label: "Needs review", value: "24" }],
    title: "Users",
  },
  lecturers: {
    description: "Review lecturer profiles, verification, and platform permissions.",
    eyebrow: "Management",
    highlights: [{ label: "Active lecturers", value: "328" }, { label: "Pending review", value: "9" }, { label: "Courses owned", value: "814" }],
    title: "Lecturers",
  },
  courses: {
    description: "Oversee course lifecycle, publishing status, and moderation signals.",
    eyebrow: "Management",
    highlights: [{ label: "Active courses", value: "1,247" }, { label: "Drafts", value: "83" }, { label: "Flagged", value: "12" }],
    title: "Courses",
  },
  "learning-paths": {
    description: "Organize platform learning paths and monitor publishing quality.",
    eyebrow: "Management",
    highlights: [{ label: "Published", value: "76" }, { label: "In review", value: "8" }, { label: "Enrollments", value: "4,812" }],
    title: "Learning Paths",
  },
  workspaces: {
    description: "Administer shared learning workspaces, classes, and membership.",
    eyebrow: "Management",
    highlights: [{ label: "Active spaces", value: "642" }, { label: "Members", value: "9,104" }, { label: "Archived", value: "118" }],
    title: "Workspaces",
  },
  exercises: {
    description: "Moderate coding exercises, test cases, and content reports.",
    eyebrow: "Content",
    highlights: [{ label: "Published", value: "3,218" }, { label: "Attempts today", value: "18,406" }, { label: "Reports", value: "17" }],
    title: "Exercises",
  },
  documents: {
    description: "Monitor uploaded learning documents and processing outcomes.",
    eyebrow: "Content",
    highlights: [{ label: "Processed", value: "8,731" }, { label: "Queued", value: "42" }, { label: "Failed", value: "6" }],
    title: "Documents",
  },
  "ai-operations": {
    description: "Observe AI usage, processing queues, and service-level controls.",
    eyebrow: "Platform",
    highlights: [{ label: "Requests today", value: "26,814" }, { label: "Avg latency", value: "184 ms" }, { label: "Success rate", value: "99.2%" }],
    title: "AI Operations",
  },
  "code-judge": {
    description: "Monitor judge capacity, execution reliability, and language runners.",
    eyebrow: "Platform",
    highlights: [{ label: "Executions", value: "42,781" }, { label: "Queue depth", value: "31" }, { label: "Success rate", value: "97.8%" }],
    title: "Code Judge",
  },
  "system-activity": {
    description: "Inspect operational events and cross-service platform activity.",
    eyebrow: "Platform",
    highlights: [{ label: "Events today", value: "284,103" }, { label: "Warnings", value: "18" }, { label: "Incidents", value: "0" }],
    title: "System Activity",
  },
  reports: {
    description: "Triage content, conduct, and platform reports requiring moderation.",
    eyebrow: "Governance",
    highlights: [{ label: "Open", value: "34" }, { label: "In review", value: "21" }, { label: "Resolved today", value: "16" }],
    title: "Reports",
  },
  "audit-logs": {
    description: "Review traceable administrative and security-sensitive changes.",
    eyebrow: "Governance",
    highlights: [{ label: "Entries today", value: "1,864" }, { label: "Admin actors", value: "18" }, { label: "Retention", value: "180 days" }],
    title: "Audit Logs",
  },
  settings: {
    description: "Configure platform defaults, integrations, and administrative policies.",
    eyebrow: "System",
    highlights: [{ label: "Integrations", value: "12" }, { label: "Feature flags", value: "28" }, { label: "Policy sets", value: "9" }],
    title: "Settings",
  },
};
