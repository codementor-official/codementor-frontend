import type { ActivityItem, DashboardMetric } from "@/features/dashboard/types/dashboard";

export const dashboardMetrics: DashboardMetric[] = [
  {
    change: "+12.4%",
    icon: "users",
    label: "Tổng người dùng",
    previous: "11,108 tháng trước",
    trend: "up",
    value: "12,486",
  },
  {
    change: "+8.2%",
    icon: "lecturers",
    label: "Giảng viên hoạt động",
    previous: "303 tháng trước",
    trend: "up",
    value: "328",
  },
  {
    change: "+15.1%",
    icon: "courses",
    label: "Khoá học đang mở",
    previous: "1,083 tháng trước",
    trend: "up",
    value: "1,247",
  },
  {
    change: "+21.7%",
    icon: "submissions",
    label: "Lượt nộp bài",
    previous: "151,513 tháng trước",
    trend: "up",
    value: "184,392",
  },
];

export const userGrowthData = [
  { active: 7320, month: "Jan", newUsers: 5100, previous: 6180 },
  { active: 7580, month: "Feb", newUsers: 5480, previous: 6410 },
  { active: 8040, month: "Mar", newUsers: 6230, previous: 6590 },
  { active: 8460, month: "Apr", newUsers: 6940, previous: 7010 },
  { active: 8730, month: "May", newUsers: 7480, previous: 7240 },
  { active: 9180, month: "Jun", newUsers: 8210, previous: 7680 },
  { active: 9570, month: "Jul", newUsers: 7860, previous: 8140 },
  { active: 9880, month: "Aug", newUsers: 9020, previous: 8390 },
  { active: 10420, month: "Sep", newUsers: 9510, previous: 8870 },
  { active: 10980, month: "Oct", newUsers: 10040, previous: 9150 },
  { active: 11740, month: "Nov", newUsers: 10830, previous: 9690 },
  { active: 12486, month: "Dec", newUsers: 11560, previous: 10320 },
];

export const usersByRoleData = [
  { fill: "var(--chart-1)", name: "Students", value: 11264 },
  { fill: "var(--chart-2)", name: "Lecturers", value: 984 },
  { fill: "var(--chart-4)", name: "Admins", value: 238 },
];

export const dailyActiveUsersData = [
  { day: "01", users: 7240 },
  { day: "04", users: 7520 },
  { day: "07", users: 7380 },
  { day: "10", users: 7890 },
  { day: "13", users: 8120 },
  { day: "16", users: 7970 },
  { day: "19", users: 8460 },
  { day: "22", users: 8270 },
  { day: "25", users: 8730 },
  { day: "28", users: 8942 },
];

export const judgeExecutionsData = [
  { lastMonth: 6700, name: "W1", thisMonth: 8200 },
  { lastMonth: 8120, name: "W2", thisMonth: 10740 },
  { lastMonth: 9060, name: "W3", thisMonth: 11480 },
  { lastMonth: 10250, name: "W4", thisMonth: 12361 },
];

export const platformActivityData = [
  { fill: "var(--chart-1)", name: "Lượt nộp bài", value: 42 },
  { fill: "var(--chart-2)", name: "Course Activities", value: 26 },
  { fill: "var(--chart-4)", name: "Exercise Attempts", value: 20 },
  { fill: "var(--chart-5)", name: "Document Processing", value: 12 },
];

export const recentActivity: ActivityItem[] = [
  {
    activity: "New lecturer registered",
    actor: "Sarah Chen",
    resource: "Lecturer account",
    status: "Completed",
    time: "4 min ago",
  },
  {
    activity: "Course published",
    actor: "David Park",
    resource: "Advanced TypeScript",
    status: "Published",
    time: "18 min ago",
  },
  {
    activity: "Exercise reported",
    actor: "Mai Nguyen",
    resource: "Binary Tree Paths",
    status: "Review",
    time: "36 min ago",
  },
  {
    activity: "User role updated",
    actor: "Alex Morgan",
    resource: "User #CM-8492",
    status: "Updated",
    time: "1 hr ago",
  },
  {
    activity: "Learning path published",
    actor: "Priya Shah",
    resource: "Backend Foundations",
    status: "Published",
    time: "2 hrs ago",
  },
];

export const systemHealth = [
  { latency: "42 ms", name: "API Gateway", status: "Operational" },
  { latency: "68 ms", name: "Authentication", status: "Operational" },
  { latency: "184 ms", name: "AI Services", status: "Operational" },
  { latency: "96 ms", name: "Code Judge", status: "Operational" },
  { latency: "12 ms", name: "Kafka", status: "Operational" },
];
