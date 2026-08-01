import {
  Award,
  BookOpen,
  Briefcase,
  Clock,
  Code2,
  Database,
  FileText,
  GraduationCap,
  Hammer,
  HelpCircle,
  Layers3,
  LayoutGrid,
  Server,
  Smartphone,
  Sprout,
  Trophy,
  UserCheck,
  Users,
  Video,
  type LucideIcon,
} from "lucide-react";
import type { LearningPreference } from "@/types/learning-preference";

export interface OnboardingOption {
  value: string;
  label: string;
  description?: string;
  icon: LucideIcon;
}

export type OnboardingSelectionType = "single" | "multi";

export interface OnboardingFieldConfig {
  field: keyof LearningPreference;
  groupLabel: string;
  selectionType: OnboardingSelectionType;
  minSelect: number;
  options: OnboardingOption[];
}

export interface OnboardingStepConfig {
  step: number;
  title: string;
  subtitle: string;
  fields: OnboardingFieldConfig[];
}

export const onboardingSteps: OnboardingStepConfig[] = [
  {
    step: 1,
    title: "Bạn quan tâm đến lĩnh vực nào?",
    subtitle: "Chọn một hoặc nhiều lĩnh vực — dùng để ưu tiên lộ trình phù hợp nhất cho bạn.",
    fields: [
      {
        field: "interestedFields",
        groupLabel: "Lĩnh vực quan tâm",
        selectionType: "multi",
        minSelect: 1,
        options: [
          { value: "frontend", label: "Frontend", icon: LayoutGrid },
          { value: "backend", label: "Backend", icon: Server },
          { value: "fullstack", label: "Fullstack", icon: Layers3 },
          { value: "mobile", label: "Mobile", icon: Smartphone },
          { value: "data-ai", label: "Data & AI", icon: Database },
          { value: "foundation", label: "Nền tảng lập trình", icon: GraduationCap },
        ],
      },
    ],
  },
  {
    step: 2,
    title: "Trình độ hiện tại của bạn?",
    subtitle: "Để hệ thống điều chỉnh độ khó phù hợp — không quá dễ cũng không quá khó.",
    fields: [
      {
        field: "currentLevel",
        groupLabel: "Trình độ hiện tại",
        selectionType: "single",
        minSelect: 1,
        options: [
          { value: "none", label: "Chưa biết lập trình", description: "Xuất phát từ con số 0", icon: Sprout },
          { value: "basic", label: "Cơ bản", description: "Biết cú pháp và các khái niệm nền tảng", icon: BookOpen },
          { value: "intermediate", label: "Trung cấp", description: "Đã làm một số dự án nhỏ", icon: Layers3 },
          { value: "experienced", label: "Đã có kinh nghiệm", description: "Muốn nâng cao hoặc chuyển hướng", icon: Trophy },
        ],
      },
    ],
  },
  {
    step: 3,
    title: "Công nghệ nào bạn quan tâm?",
    subtitle: "Chọn các ngôn ngữ hoặc công nghệ bạn muốn học hoặc luyện tập thêm.",
    fields: [
      {
        field: "interestedTechnologies",
        groupLabel: "Ngôn ngữ / công nghệ quan tâm",
        selectionType: "multi",
        minSelect: 1,
        options: [
          { value: "JavaScript", label: "JavaScript", icon: Code2 },
          { value: "TypeScript", label: "TypeScript", icon: Code2 },
          { value: "React", label: "React / Next.js", icon: Code2 },
          { value: "Node.js", label: "Node.js", icon: Server },
          { value: "Java", label: "Java", icon: Code2 },
          { value: "Spring Boot", label: "Spring Boot", icon: Server },
          { value: "Python", label: "Python", icon: Code2 },
          { value: "C/C++", label: "C / C++", icon: Code2 },
          { value: "C#/.NET", label: "C# / .NET", icon: Code2 },
          { value: "Flutter", label: "Flutter", icon: Smartphone },
          { value: "SQL", label: "SQL / Database", icon: Database },
          { value: "Git", label: "Git & GitHub", icon: FileText },
        ],
      },
    ],
  },
  {
    step: 4,
    title: "Mục tiêu của bạn là gì?",
    subtitle: "Định hướng lộ trình và bài luyện tập theo đích bạn muốn đạt tới.",
    fields: [
      {
        field: "learningGoal",
        groupLabel: "Mục tiêu học tập",
        selectionType: "single",
        minSelect: 1,
        options: [
          { value: "Học để đi làm", label: "Học để đi làm", icon: Briefcase },
          { value: "Ôn tập trên lớp", label: "Ôn tập trên lớp / thi cử", icon: GraduationCap },
          { value: "Chuẩn bị phỏng vấn", label: "Chuẩn bị phỏng vấn", icon: UserCheck },
          { value: "Luyện thi đấu thuật toán", label: "Luyện thi đấu thuật toán", icon: Trophy },
          { value: "Học vì đam mê", label: "Học vì đam mê cá nhân", icon: Award },
        ],
      },
      {
        field: "careerGoal",
        groupLabel: "Mục tiêu nghề nghiệp",
        selectionType: "single",
        minSelect: 1,
        options: [
          { value: "Web Developer", label: "Web Developer", icon: LayoutGrid },
          { value: "Backend Developer", label: "Backend / API Developer", icon: Server },
          { value: "Mobile Developer", label: "Mobile Developer", icon: Smartphone },
          { value: "Data/AI Engineer", label: "Data / AI Engineer", icon: Database },
          { value: "Chưa xác định rõ", label: "Chưa xác định rõ", icon: HelpCircle },
        ],
      },
    ],
  },
  {
    step: 5,
    title: "Thời gian và cách bạn muốn học?",
    subtitle: "Giúp hệ thống ước lượng tiến độ và gợi ý hình thức học phù hợp.",
    fields: [
      {
        field: "weeklyStudyHours",
        groupLabel: "Thời gian có thể học mỗi tuần",
        selectionType: "single",
        minSelect: 1,
        options: [
          { value: "2", label: "Dưới 3 giờ/tuần", icon: Clock },
          { value: "5", label: "3 – 6 giờ/tuần", icon: Clock },
          { value: "8", label: "6 – 10 giờ/tuần", icon: Clock },
          { value: "12", label: "Trên 10 giờ/tuần", icon: Clock },
        ],
      },
      {
        field: "preferredLearningStyle",
        groupLabel: "Hình thức học mong muốn",
        selectionType: "multi",
        minSelect: 1,
        options: [
          { value: "video", label: "Video bài giảng", icon: Video },
          { value: "article", label: "Đọc tài liệu", icon: FileText },
          { value: "hands-on", label: "Thực hành trực tiếp", icon: Code2 },
          { value: "group", label: "Học theo nhóm", icon: Users },
          { value: "self-paced", label: "Tự học theo tiến độ riêng", icon: Clock },
        ],
      },
      {
        field: "contentPriority",
        groupLabel: "Ưu tiên giữa lý thuyết, thực hành và dự án",
        selectionType: "single",
        minSelect: 1,
        options: [
          { value: "theory", label: "Lý thuyết vững chắc", icon: BookOpen },
          { value: "practice", label: "Thực hành nhiều bài tập", icon: Code2 },
          { value: "project", label: "Xây dựng dự án thực tế", icon: Hammer },
        ],
      },
    ],
  },
];
