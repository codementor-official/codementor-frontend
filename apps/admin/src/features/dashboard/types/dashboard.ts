export interface DashboardMetric {
  change: string;
  icon: "users" | "lecturers" | "courses" | "submissions";
  label: string;
  previous: string;
  trend: "up" | "down";
  value: string;
}

export interface ActivityItem {
  activity: string;
  actor: string;
  resource: string;
  status: "Completed" | "Published" | "Review" | "Updated";
  time: string;
}
