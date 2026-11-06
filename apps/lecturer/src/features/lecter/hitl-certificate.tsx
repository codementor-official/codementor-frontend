"use client";

import { useHumanInTheLoop } from "@copilotkit/react-core/v2";
import { useEffect, useState } from "react";
import { z } from "zod";
import { CertificateView, sampleCertificateData, type CertificateDesign } from "@codementor/ui";
import { api } from "@/lib/api";
import { ProposalCard, SettledProposal, readOutcome } from "./proposal-card";

/**
 * Tool GHI của chứng chỉ (ADR 0005). Cùng luật với các `hitl-*.tsx` khác: agent chỉ đề xuất, hộp
 * xác nhận gọi API bằng phiên của giảng viên. Luật thiết kế kiểm ở ba nơi — server tool
 * `validate_certificate_design`, schema zod dưới đây (hình dạng), và API (chốt chặn cuối).
 *
 * Thẻ xác nhận vẽ luôn bản xem trước bằng `CertificateView` — giảng viên duyệt đúng thứ học viên
 * sẽ nhận, không phải một khối JSON.
 */
const designSchema = z.object({
  version: z.literal(1),
  layout: z.enum(["classic", "modern", "minimal"]),
  accent: z.enum(["orange", "ink", "emerald", "blue", "violet"]),
  heading: z.string().max(80),
  body: z.string().max(400),
  signerName: z.string().max(80),
  signerTitle: z.string().max(80).optional(),
  fields: z.array(z.object({ label: z.string().max(40), value: z.string().max(120) })).max(6),
});

const subjectLabel = (subject: "course" | "roadmap" | null | undefined) =>
  subject === "course" ? "chỉ khóa học" : subject === "roadmap" ? "chỉ lộ trình" : "khóa học và lộ trình";

export function LecterCertificateHumanInTheLoop() {
  useHumanInTheLoop(
    {
      name: "save_certificate_template",
      description:
        "Tạo (không có templateId) hoặc sửa (có templateId) một mẫu chứng chỉ của giảng viên. BẮT BUỘC " +
        "validate_certificate_design trước. Mẫu mặc định của nền tảng không sửa được. Người dùng phải xác nhận.",
      parameters: z.object({
        templateId: z
          .string()
          .uuid()
          .optional()
          .describe("Id mẫu CỦA GIẢNG VIÊN cần sửa. Bỏ trống để tạo mẫu mới. KHÔNG BAO GIỜ là id mẫu mặc định."),
        name: z.string().min(2).max(80).describe("Tên mẫu, 2–80 ký tự."),
        subject: z.enum(["course", "roadmap"]).nullable().describe("null = dùng cho cả khóa học và lộ trình."),
        design: designSchema,
      }),
      render: ({ status, args, result, respond }) => {
        if (status === "inProgress")
          return <p className="my-2 text-sm text-muted-foreground">Đang soạn mẫu chứng chỉ…</p>;
        return <SaveTemplateProposal status={status} args={args} result={result} respond={respond} />;
      },
    },
    [],
  );

  useHumanInTheLoop(
    {
      name: "attach_certificate_template",
      description:
        "Gắn một mẫu chứng chỉ vào khóa học hoặc lộ trình CỦA giảng viên. templateId null = quay về mẫu mặc định " +
        "của nền tảng. Chỉ ảnh hưởng chứng chỉ cấp sau này, không đổi chứng chỉ đã cấp. Người dùng phải xác nhận.",
      parameters: z.object({
        subject: z.enum(["course", "roadmap"]),
        subjectId: z.string().uuid().describe("Id khóa học hoặc lộ trình."),
        templateId: z.string().uuid().nullable().describe("null = mẫu mặc định."),
        templateName: z.string().max(80).optional().describe("Tên mẫu, chỉ để hiển thị trên thẻ xác nhận."),
      }),
      render: ({ status, args, result, respond }) => {
        if (status === "inProgress") return <p className="my-2 text-sm text-muted-foreground">Đang soạn đề xuất…</p>;
        const title = `Gắn mẫu chứng chỉ cho ${args.subject === "course" ? "khóa học" : "lộ trình"}`;
        const lines = [args.templateId ? `Mẫu: ${args.templateName ?? args.templateId}` : "Mẫu: mặc định của nền tảng"];
        const target = { kind: args.subject, id: args.subjectId };
        if (status === "complete")
          return <SettledProposal lines={lines} outcome={readOutcome(result)} target={target} title={title} />;
        return (
          <ProposalCard
            target={target}
            title={title}
            lines={lines}
            confirmLabel="Gắn mẫu"
            onConfirm={async () => {
              await api.certificateTemplates.attach(args.subject === "course" ? "courses" : "roadmaps", args.subjectId, args.templateId);
              await respond?.(JSON.stringify({ outcome: "applied", id: args.subjectId, note: "Đã gắn mẫu chứng chỉ." }));
              return "Đã gắn mẫu chứng chỉ";
            }}
            onFailure={(reason) =>
              respond?.(JSON.stringify({ outcome: "failed", reason, note: "KHÔNG gắn được. Kiểm id và quyền sở hữu rồi thử lại." }))
            }
            onReject={() => respond?.(JSON.stringify({ outcome: "rejected", note: "Người dùng bỏ qua việc gắn mẫu." }))}
          />
        );
      },
    },
    [],
  );

  return null;
}

type SaveArgs = {
  templateId?: string;
  name: string;
  subject: "course" | "roadmap" | null;
  design: z.infer<typeof designSchema>;
};

/**
 * Thẻ của `save_certificate_template`. Một component riêng để được dùng hook: nó tự đọc mẫu mà
 * `templateId` trỏ tới. Model hay đưa id của mẫu MẶC ĐỊNH khi được bảo "tạo mẫu mới" (đã thấy
 * trên thực tế, kể cả khi prompt cấm) — giảng viên không sửa được mẫu đó, nên ý định duy nhất
 * có nghĩa là tạo mẫu mới. Chặn ở đây, bằng dữ liệu thật, chứ không trông vào prompt.
 */
function SaveTemplateProposal({
  status,
  args,
  result,
  respond,
}: {
  status: string;
  args: SaveArgs;
  result?: string;
  respond?: (value: string) => Promise<void> | void;
}) {
  const [targetIsDefault, setTargetIsDefault] = useState<boolean | null>(args.templateId ? null : false);
  useEffect(() => {
    if (!args.templateId) return;
    let active = true;
    api.certificateTemplates.get(args.templateId).then(
      (template) => active && setTargetIsDefault(template.isDefault || !template.editable),
      () => active && setTargetIsDefault(true),
    );
    return () => {
      active = false;
    };
  }, [args.templateId]);

  const creating = !args.templateId || targetIsDefault === true;
  const editId = creating ? undefined : args.templateId;
  const title = `${creating ? "Tạo" : "Sửa"} mẫu chứng chỉ: ${args.name}`;
  const lines = [
    `Dùng cho: ${subjectLabel(args.subject)}`,
    `Bố cục: ${args.design?.layout} · màu ${args.design?.accent}`,
    ...(args.templateId && creating ? ["Mẫu được trỏ tới là mẫu mặc định (chỉ đọc) — sẽ tạo mẫu mới."] : []),
  ];
  const target = { kind: "certificate" as const, id: editId };
  if (status === "complete")
    return <SettledProposal lines={lines} outcome={readOutcome(result)} target={target} title={title} />;
  if (targetIsDefault === null) return <p className="my-2 text-sm text-muted-foreground">Đang kiểm mẫu…</p>;
  return (
    <ProposalCard
      target={target}
      title={title}
      lines={lines}
      confirmLabel={creating ? "Tạo mẫu" : "Lưu mẫu"}
      onConfirm={async () => {
        const body = { name: args.name, subject: args.subject ?? null, design: args.design as CertificateDesign };
        const saved = editId
          ? await api.certificateTemplates.update(editId, body)
          : await api.certificateTemplates.create(body);
        await respond?.(
          JSON.stringify({
            outcome: "applied",
            id: saved.id,
            title: saved.name,
            note:
              (creating && args.templateId ? "Mẫu mặc định chỉ đọc nên đã TẠO MẪU MỚI với id này. " : "") +
              "Dùng id này cho `attach_certificate_template` nếu giảng viên muốn gắn vào khóa học/lộ trình. Nhắc họ tự tải logo và chữ ký ở trang Chứng chỉ.",
          }),
        );
        return "Đã lưu mẫu chứng chỉ";
      }}
      onFailure={(reason) =>
        respond?.(JSON.stringify({ outcome: "failed", reason, note: "KHÔNG lưu được mẫu. Sửa theo lỗi rồi đề xuất lại." }))
      }
      onReject={() => respond?.(JSON.stringify({ outcome: "rejected", note: "Người dùng bỏ qua mẫu chứng chỉ này." }))}
    >
      {args.design && (
        <div className="mt-2">
          <CertificateView design={args.design as CertificateDesign} data={sampleCertificateData(args.subject ?? "course")} />
        </div>
      )}
    </ProposalCard>
  );
}
