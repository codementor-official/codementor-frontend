"use client";

import { useState } from "react";
import {
  Bell,
  BrainCircuit,
  ChevronDown,
  KeyRound,
  LockKeyhole,
  MonitorSmartphone,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PersonalizationSettingsTrigger } from "@/components/personalization/personalization-settings-modal";
import { useLearningPreferenceStore } from "@/lib/store/learning-preference-store";
import {
  STUDY_DAYS,
  type LearningPreference,
  type StudyDay,
} from "@/types/learning-preference";

const FIELDS = [
  ["frontend", "Frontend"],
  ["backend", "Backend"],
  ["fullstack", "Fullstack"],
  ["mobile", "Mobile"],
  ["data-ai", "Data & AI"],
  ["foundation", "Nền tảng lập trình"],
];
const LEVELS = [
  ["none", "Chưa biết lập trình"],
  ["basic", "Cơ bản"],
  ["intermediate", "Trung cấp"],
  ["experienced", "Đã có kinh nghiệm"],
];
const TECHNOLOGIES = [
  "JavaScript",
  "TypeScript",
  "React",
  "Node.js",
  "Java",
  "Spring Boot",
  "Python",
  "C/C++",
  "C#/.NET",
  "Flutter",
  "SQL",
  "Git",
];
const LEARNING_GOALS = [
  ["Học để đi làm", "Học để đi làm"],
  ["Ôn tập trên lớp", "Ôn tập trên lớp / thi cử"],
  ["Chuẩn bị phỏng vấn", "Chuẩn bị phỏng vấn"],
  ["Luyện thi đấu thuật toán", "Luyện thi đấu thuật toán"],
  ["Học vì đam mê", "Học vì đam mê cá nhân"],
];
const CAREER_GOALS = [
  ["Web Developer", "Web Developer"],
  ["Backend Developer", "Backend / API Developer"],
  ["Mobile Developer", "Mobile Developer"],
  ["Data/AI Engineer", "Data / AI Engineer"],
  ["Chưa xác định rõ", "Chưa xác định rõ"],
];
const WEEKLY_HOURS = [
  [2, "Dưới 3 giờ/tuần"],
  [5, "3 – 6 giờ/tuần"],
  [8, "6 – 10 giờ/tuần"],
  [12, "Trên 10 giờ/tuần"],
] as const;
const LEARNING_STYLES = [
  ["video", "Video bài giảng"],
  ["article", "Đọc tài liệu"],
  ["hands-on", "Thực hành trực tiếp"],
  ["group", "Học theo nhóm"],
  ["self-paced", "Tự học theo tiến độ riêng"],
];
const CONTENT_PRIORITIES = [
  ["theory", "Lý thuyết vững chắc"],
  ["practice", "Thực hành nhiều bài tập"],
  ["project", "Xây dựng dự án thực tế"],
];

function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={onChange}
      className={`relative h-6 w-11 rounded-full transition ${checked ? "bg-primary" : "bg-border"}`}
    >
      <span
        className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-[left] ${checked ? "left-5.5" : "left-0.5"}`}
      />
    </button>
  );
}

function ChoicePill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${active ? "border-navy bg-navy text-white" : "border-border bg-surface text-text-muted hover:bg-bg"}`}
    >
      {children}
    </button>
  );
}

function SettingGroup({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border-t border-border-soft pt-5 first:border-t-0 first:pt-0">
      <h3 className="text-sm font-semibold text-navy">{title}</h3>
      {hint && (
        <p className="mt-1 text-xs leading-relaxed text-text-faint">{hint}</p>
      )}
      <div className="mt-3">{children}</div>
    </section>
  );
}

export function SettingsManagementPage() {
  const preference = useLearningPreferenceStore((state) => state.preference);
  const updatePreference = useLearningPreferenceStore(
    (state) => state.updatePreference,
  );
  const savePreferenceSettings = useLearningPreferenceStore(
    (state) => state.savePreferenceSettings,
  );
  const [name, setName] = useState("Nguyễn Trần Gia Sĩ");
  const [email, setEmail] = useState("giasi.nguyen@student.iuh.edu.vn");
  const [emailNotice, setEmailNotice] = useState(true);
  const [publicProfile, setPublicProfile] = useState(false);
  const [saved, setSaved] = useState("");
  const [isLearningProfileOpen, setIsLearningProfileOpen] = useState(true);

  const save = (message: string) => {
    setSaved(message);
    window.setTimeout(() => setSaved(""), 2800);
  };
  const toggleMulti = (
    field:
      "interestedFields" | "interestedTechnologies" | "preferredLearningStyle",
    value: string,
  ) => {
    const current = preference[field];
    updatePreference({
      [field]: current.includes(value)
        ? current.filter((item) => item !== value)
        : [...current, value],
    } as Partial<LearningPreference>);
  };
  const updateSchedule = (
    day: StudyDay,
    patch: Partial<LearningPreference["weeklyStudySchedule"][StudyDay]>,
  ) =>
    updatePreference({
      weeklyStudySchedule: {
        ...preference.weeklyStudySchedule,
        [day]: { ...preference.weeklyStudySchedule[day], ...patch },
      },
    });
  const saveLearningProfile = () => {
    savePreferenceSettings(preference);
    save("Đã lưu hồ sơ học tập và cập nhật gợi ý trong toàn hệ thống.");
  };

  return (
    <div className="mx-auto max-w-6xl">
      <header className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-navy">Cài đặt</h1>
        <p className="mt-1 text-sm text-text-muted">
          Quản lý hồ sơ, trải nghiệm học tập, thông báo, quyền riêng tư và bảo
          mật tài khoản.
        </p>
      </header>
      {saved && (
        <div className="mb-4 rounded-lg border border-primary/20 bg-primary-tint px-4 py-3 text-sm font-medium text-navy">
          {saved}
        </div>
      )}
      <div className="grid gap-5 lg:grid-cols-[220px_minmax(0,1fr)]">
        <nav className="h-fit rounded-xl border border-border bg-surface p-2 lg:sticky lg:top-4">
          <div className="space-y-1">
            {[
              [UserRound, "Hồ sơ & học tập", "#ho-so"],
              [Bell, "Thông báo", "#thong-bao"],
              [LockKeyhole, "Quyền riêng tư", "#rieng-tu"],
              [ShieldCheck, "Bảo mật", "#bao-mat"],
              [MonitorSmartphone, "Thiết bị & tích hợp", "#thiet-bi"],
            ].map(([Icon, label, href]) => {
              const I = Icon as typeof UserRound;
              return (
                <a
                  key={String(label)}
                  href={String(href)}
                  className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-text-muted hover:bg-bg hover:text-navy"
                >
                  <I className="h-4 w-4" />
                  {String(label)}
                </a>
              );
            })}
          </div>
        </nav>
        <div className="space-y-5">
          <Card id="ho-so" className="p-5 sm:p-6">
            <div className="mb-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
              <div>
                <h2 className="text-base font-bold text-navy">Hồ sơ học tập</h2>
                <p className="mt-1 max-w-xl text-xs leading-relaxed text-text-faint">
                  Dùng để cá nhân hóa lộ trình, bài luyện tập và phản hồi của
                  Trợ lý AI. Nội dung dưới đây sử dụng cùng dữ liệu với popup
                  đăng ký.
                </p>
              </div>
              <PersonalizationSettingsTrigger label="Mở dạng từng bước" />
            </div>
            <div className="mb-5 flex justify-end">
              <Button variant="ghost" size="sm" onClick={() => setIsLearningProfileOpen((value) => !value)} aria-expanded={isLearningProfileOpen} aria-controls="learning-profile-content">
                {isLearningProfileOpen ? "Thu gọn hồ sơ học tập" : "Mở rộng hồ sơ học tập"}
                <ChevronDown className={`h-3.5 w-3.5 transition-transform ${isLearningProfileOpen ? "rotate-180" : ""}`} />
              </Button>
            </div>
            <div id="learning-profile-content" className={isLearningProfileOpen ? "space-y-5" : "hidden"}>
              <SettingGroup
                title="Lĩnh vực quan tâm"
                hint="Chọn một hoặc nhiều lĩnh vực để ưu tiên lộ trình phù hợp nhất."
              >
                <div className="flex flex-wrap gap-2">
                  {FIELDS.map(([value, label]) => (
                    <ChoicePill
                      key={value}
                      active={preference.interestedFields.includes(value)}
                      onClick={() => toggleMulti("interestedFields", value)}
                    >
                      {label}
                    </ChoicePill>
                  ))}
                </div>
              </SettingGroup>
              <SettingGroup
                title="Trình độ hiện tại"
                hint="Hệ thống dùng mức này để điều chỉnh độ khó bài học và bài luyện tập."
              >
                <div className="flex flex-wrap gap-2">
                  {LEVELS.map(([value, label]) => (
                    <ChoicePill
                      key={value}
                      active={preference.currentLevel === value}
                      onClick={() =>
                        updatePreference({
                          currentLevel:
                            value as LearningPreference["currentLevel"],
                        })
                      }
                    >
                      {label}
                    </ChoicePill>
                  ))}
                </div>
              </SettingGroup>
              <SettingGroup title="Ngôn ngữ / công nghệ quan tâm">
                <div className="flex flex-wrap gap-2">
                  {TECHNOLOGIES.map((value) => (
                    <ChoicePill
                      key={value}
                      active={preference.interestedTechnologies.includes(value)}
                      onClick={() =>
                        toggleMulti("interestedTechnologies", value)
                      }
                    >
                      {value}
                    </ChoicePill>
                  ))}
                </div>
              </SettingGroup>
              <div className="grid gap-5 xl:grid-cols-2">
                <SettingGroup title="Mục tiêu học tập">
                  <div className="flex flex-wrap gap-2">
                    {LEARNING_GOALS.map(([value, label]) => (
                      <ChoicePill
                        key={value}
                        active={preference.learningGoal === value}
                        onClick={() =>
                          updatePreference({ learningGoal: value })
                        }
                      >
                        {label}
                      </ChoicePill>
                    ))}
                  </div>
                </SettingGroup>
                <SettingGroup title="Mục tiêu nghề nghiệp">
                  <div className="flex flex-wrap gap-2">
                    {CAREER_GOALS.map(([value, label]) => (
                      <ChoicePill
                        key={value}
                        active={preference.careerGoal === value}
                        onClick={() => updatePreference({ careerGoal: value })}
                      >
                        {label}
                      </ChoicePill>
                    ))}
                  </div>
                </SettingGroup>
              </div>
              <SettingGroup title="Thời gian có thể học mỗi tuần">
                <div className="flex flex-wrap gap-2">
                  {WEEKLY_HOURS.map(([value, label]) => (
                    <ChoicePill
                      key={value}
                      active={preference.weeklyStudyHours === value}
                      onClick={() =>
                        updatePreference({ weeklyStudyHours: value })
                      }
                    >
                      {label}
                    </ChoicePill>
                  ))}
                </div>
              </SettingGroup>
              <div className="grid gap-5 xl:grid-cols-2">
                <SettingGroup title="Hình thức học mong muốn">
                  <div className="flex flex-wrap gap-2">
                    {LEARNING_STYLES.map(([value, label]) => (
                      <ChoicePill
                        key={value}
                        active={preference.preferredLearningStyle.includes(
                          value,
                        )}
                        onClick={() =>
                          toggleMulti("preferredLearningStyle", value)
                        }
                      >
                        {label}
                      </ChoicePill>
                    ))}
                  </div>
                </SettingGroup>
                <SettingGroup title="Ưu tiên nội dung">
                  <div className="flex flex-wrap gap-2">
                    {CONTENT_PRIORITIES.map(([value, label]) => (
                      <ChoicePill
                        key={value}
                        active={preference.contentPriority === value}
                        onClick={() =>
                          updatePreference({
                            contentPriority:
                              value as LearningPreference["contentPriority"],
                          })
                        }
                      >
                        {label}
                      </ChoicePill>
                    ))}
                  </div>
                </SettingGroup>
              </div>
              <SettingGroup
                title="Khung giờ học trong tuần"
                hint="Bật các ngày bạn muốn học; lịch này dùng cho mục tiêu tuần và lời nhắc."
              >
                <div className="space-y-2">
                  {STUDY_DAYS.map((day) => {
                    const session = preference.weeklyStudySchedule[day.key];
                    return (
                      <div
                        key={day.key}
                        className={`flex flex-wrap items-center gap-3 rounded-lg border p-3 ${session.enabled ? "border-primary/30 bg-primary-tint" : "border-border"}`}
                      >
                        <label className="flex min-w-28 items-center gap-2 text-sm font-semibold text-navy">
                          <input
                            type="checkbox"
                            checked={session.enabled}
                            onChange={() =>
                              updateSchedule(day.key, {
                                enabled: !session.enabled,
                              })
                            }
                            className="h-4 w-4 accent-primary"
                          />
                          {day.label}
                        </label>
                        <input
                          aria-label={`Giờ học ${day.label}`}
                          type="time"
                          disabled={!session.enabled}
                          value={session.startTime}
                          onChange={(event) =>
                            updateSchedule(day.key, {
                              startTime: event.target.value,
                            })
                          }
                          className="h-8 rounded-md border border-border bg-surface px-2 text-xs text-navy disabled:bg-bg"
                        />
                        <select
                          aria-label={`Thời lượng học ${day.label}`}
                          disabled={!session.enabled}
                          value={session.durationMinutes}
                          onChange={(event) =>
                            updateSchedule(day.key, {
                              durationMinutes: Number(event.target.value),
                            })
                          }
                          className="h-8 rounded-md border border-border bg-surface px-2 text-xs text-navy disabled:bg-bg"
                        >
                          {[30, 45, 60, 90, 120].map((minutes) => (
                            <option key={minutes} value={minutes}>
                              {minutes} phút
                            </option>
                          ))}
                        </select>
                      </div>
                    );
                  })}
                </div>
              </SettingGroup>
              <SettingGroup title="Nhắc học & gợi ý thông minh">
                <div className="divide-y divide-border-soft rounded-lg border border-border px-4">
                  <div className="flex items-center gap-4 py-3">
                    <div className="min-w-0 flex-1">
                      <b className="text-sm text-navy">
                        Nhắc theo lịch đã chọn
                      </b>
                      <p className="mt-1 text-xs text-text-faint">
                        Gửi trước phiên học lúc {preference.reminderTime}.
                      </p>
                    </div>
                    <Toggle
                      checked={preference.remindersEnabled}
                      onChange={() =>
                        updatePreference({
                          remindersEnabled: !preference.remindersEnabled,
                        })
                      }
                      label="Nhắc học theo lịch"
                    />
                  </div>
                  {preference.remindersEnabled && (
                    <div className="flex items-center justify-between gap-3 py-3 text-sm">
                      <span className="font-medium text-navy">
                        Giờ nhắc học
                      </span>
                      <input
                        aria-label="Giờ nhắc học"
                        type="time"
                        value={preference.reminderTime}
                        onChange={(event) =>
                          updatePreference({ reminderTime: event.target.value })
                        }
                        className="h-8 rounded-md border border-border bg-surface px-2 text-xs text-navy"
                      />
                    </div>
                  )}
                  <div className="flex items-center gap-4 py-3">
                    <div className="min-w-0 flex-1">
                      <b className="text-sm text-navy">Gợi ý thích nghi</b>
                      <p className="mt-1 text-xs text-text-faint">
                        Điều chỉnh bài đề xuất dựa trên tiến độ và các bài bạn
                        đã làm.
                      </p>
                    </div>
                    <Toggle
                      checked={preference.adaptiveRecommendations}
                      onChange={() =>
                        updatePreference({
                          adaptiveRecommendations:
                            !preference.adaptiveRecommendations,
                        })
                      }
                      label="Gợi ý thích nghi"
                    />
                  </div>
                </div>
              </SettingGroup>
              <Button size="sm" onClick={saveLearningProfile}>
                <BrainCircuit className="h-3.5 w-3.5" /> Lưu hồ sơ học tập
              </Button>
            </div>
          </Card>
          <div className="grid gap-5 xl:grid-cols-2">
            <Card className="p-5">
              <h2 className="mb-4 text-base font-bold text-navy">
                Thông tin cá nhân
              </h2>
              <div className="space-y-4">
                <label className="block text-xs font-medium text-text-muted">
                  Họ và tên
                  <Input
                    className="mt-1.5"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                  />
                </label>
                <label className="block text-xs font-medium text-text-muted">
                  Email
                  <Input
                    className="mt-1.5"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                  />
                </label>
                <Button
                  size="sm"
                  onClick={() => save("Đã cập nhật thông tin cá nhân.")}
                >
                  Lưu thay đổi
                </Button>
              </div>
            </Card>
            <Card id="thong-bao" className="p-5">
              <h2 className="mb-4 text-base font-bold text-navy">Thông báo</h2>
              <div className="flex items-center gap-4">
                <div className="min-w-0 flex-1">
                  <b className="text-sm text-navy">Bản tin email</b>
                  <p className="mt-1 text-xs text-text-faint">
                    Tổng hợp bài mới, thành tích và hoạt động hằng tuần.
                  </p>
                </div>
                <Toggle
                  checked={emailNotice}
                  onChange={() => setEmailNotice((value) => !value)}
                  label="Bản tin email"
                />
              </div>
            </Card>
          </div>
          <div className="grid gap-5 xl:grid-cols-2">
            <Card id="rieng-tu" className="p-5">
              <h2 className="mb-4 text-base font-bold text-navy">
                Quyền riêng tư
              </h2>
              <div className="flex items-center gap-4">
                <div className="min-w-0 flex-1">
                  <b className="text-sm text-navy">Hồ sơ công khai</b>
                  <p className="mt-1 text-xs text-text-faint">
                    Cho phép người khác xem thành tích, chuỗi ngày và hoạt động
                    của bạn.
                  </p>
                </div>
                <Toggle
                  checked={publicProfile}
                  onChange={() => setPublicProfile((value) => !value)}
                  label="Hồ sơ công khai"
                />
              </div>
            </Card>
            <Card id="bao-mat" className="p-5">
              <h2 className="mb-3 flex items-center gap-2 text-base font-bold text-navy">
                <KeyRound className="h-4 w-4 text-primary" /> Bảo mật
              </h2>
              <p className="text-xs leading-relaxed text-text-faint">
                Mật khẩu được cập nhật gần nhất 45 ngày trước. Nên dùng mật khẩu
                riêng, đủ mạnh cho CodeMentor.
              </p>
              <Button size="sm" variant="outline" className="mt-4">
                Đổi mật khẩu
              </Button>
            </Card>
          </div>
          <Card id="thiet-bi" className="p-5">
            <h2 className="text-base font-bold text-navy">
              Thiết bị & tích hợp
            </h2>
            <p className="mt-1 text-xs text-text-faint">
              Quản lý các phiên đăng nhập và công cụ bạn cho phép kết nối.
            </p>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-lg bg-bg p-4">
              <div>
                <b className="text-sm text-navy">Chrome · Windows</b>
                <p className="mt-1 text-xs text-text-faint">
                  Hoạt động hiện tại · Thành phố Hồ Chí Minh
                </p>
              </div>
              <span className="rounded-full bg-primary-tint px-2.5 py-1 text-xs font-bold text-primary">
                Phiên này
              </span>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
