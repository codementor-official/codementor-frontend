import { ProgramShowcase } from "@/components/program-showcase";
import { LandingSection } from "./section";

export function LandingPrograms() {
  return (
    <LandingSection
      id="programs"
      eyebrow="Hệ thống"
      title="Mọi thứ cần để học lập trình, ở cùng một chỗ"
      description="Học theo khóa, đi theo lộ trình, luyện code có chấm điểm, học cùng lớp và hỏi trợ lý khi bế tắc."
    >
      <ProgramShowcase />
    </LandingSection>
  );
}
