import type { CSSProperties } from "react";
import {
  formatCertificateData,
  renderPlaceholders,
  type CertificateDesign,
  type CertificateRawData,
} from "./design";

/**
 * Màu nhấn của chứng chỉ. Chứng chỉ là một văn bản để in và chia sẻ, không phải một màn hình của
 * app, nên nó có bảng màu riêng thay vì token theme (theme client chỉ có ink + cam, và đổi theo
 * dark mode — chứng chỉ thì không được đổi).
 */
const ACCENT: Record<CertificateDesign["accent"], string> = {
  orange: "#ea580c",
  ink: "#1f2937",
  emerald: "#047857",
  blue: "#1d4ed8",
  violet: "#6d28d9",
};

const SERIF = "Georgia, 'Times New Roman', serif";

/**
 * Bộ vẽ chứng chỉ DUY NHẤT: màn soạn của giảng viên/admin, phần xem trước của học viên và
 * trang xác thực công khai đều dùng nó, nên bản xem trước giống hệt bản thật.
 *
 * Khổ A4 ngang. Mọi kích thước theo `cqw` (phần trăm bề rộng khung chứa) nên thu nhỏ trong
 * thẻ hay phóng to khi in đều giữ đúng tỉ lệ, không cần đo bằng JS.
 *
 * `printable`: khi `window.print()`, chỉ chứng chỉ này được in, đúng một trang A4 ngang.
 */
export function CertificateView({
  design,
  data,
  printable = false,
  className = "",
}: {
  design: CertificateDesign;
  data: CertificateRawData;
  printable?: boolean;
  className?: string;
}) {
  const values = formatCertificateData(data);
  const fill = (text: string) => renderPlaceholders(text, values);
  const accent = ACCENT[design.accent];
  const frame: CSSProperties = {
    containerType: "inline-size",
    aspectRatio: "297 / 210",
    color: "#111827",
    background: "#ffffff",
  };

  const logo = design.logoUrl && (
    // Ảnh nằm ở kho đối tượng, host không biết lúc build.
    // eslint-disable-next-line @next/next/no-img-element
    <img src={design.logoUrl} alt="" style={{ height: "6cqw", width: "auto", objectFit: "contain" }} />
  );
  const fields = design.fields.length > 0 && (
    <dl style={{ display: "flex", flexWrap: "wrap", gap: "1.2cqw 3cqw", fontSize: "1.35cqw" }}>
      {design.fields.map((field) => (
        <div key={field.label}>
          <dt style={{ color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.08em", fontSize: "1.05cqw" }}>
            {fill(field.label)}
          </dt>
          <dd style={{ margin: 0, fontWeight: 600 }}>{fill(field.value)}</dd>
        </div>
      ))}
    </dl>
  );
  const signer = (
    <div style={{ textAlign: "center", minWidth: "20cqw" }}>
      {design.signatureUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={design.signatureUrl} alt="" style={{ height: "5cqw", width: "auto", objectFit: "contain", margin: "0 auto" }} />
      ) : (
        <div style={{ height: "5cqw" }} />
      )}
      <div style={{ borderTop: `0.15cqw solid ${accent}`, paddingTop: "0.6cqw", fontWeight: 700, fontSize: "1.5cqw" }}>
        {fill(design.signerName) || " "}
      </div>
      {design.signerTitle && (
        <div style={{ color: "#6b7280", fontSize: "1.2cqw" }}>{fill(design.signerTitle)}</div>
      )}
    </div>
  );
  const brand = (
    <div style={{ fontSize: "1.1cqw", color: "#6b7280", letterSpacing: "0.12em", textTransform: "uppercase" }}>
      CodeMentor · {values.certificateCode}
    </div>
  );

  let content;
  if (design.layout === "modern") {
    content = (
      <div style={{ display: "flex", height: "100%" }}>
        <div
          style={{
            width: "30%",
            background: accent,
            color: "#ffffff",
            padding: "5cqw 3.5cqw",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          <div style={{ background: "#ffffff", borderRadius: "1cqw", padding: "1cqw", alignSelf: "flex-start" }}>
            {logo || <span style={{ color: accent, fontWeight: 800, fontSize: "2cqw" }}>CodeMentor</span>}
          </div>
          <h2 style={{ fontSize: "3.6cqw", lineHeight: 1.1, fontWeight: 800, margin: 0 }}>{fill(design.heading)}</h2>
          <div style={{ fontSize: "1.1cqw", opacity: 0.85, letterSpacing: "0.12em" }}>{values.certificateCode}</div>
        </div>
        <div style={{ flex: 1, padding: "6cqw 5cqw", display: "flex", flexDirection: "column", gap: "3cqw" }}>
          <div style={{ fontSize: "1.3cqw", color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.12em" }}>
            Trao cho
          </div>
          <div style={{ fontSize: "4.4cqw", fontWeight: 800, lineHeight: 1.1, marginTop: "-2cqw" }}>{values.learnerName}</div>
          <p style={{ fontSize: "1.8cqw", lineHeight: 1.5, margin: 0 }}>{fill(design.body)}</p>
          {fields}
          <div style={{ marginTop: "auto", display: "flex", justifyContent: "flex-end" }}>{signer}</div>
        </div>
      </div>
    );
  } else if (design.layout === "minimal") {
    content = (
      <div style={{ height: "100%", padding: "6cqw 7cqw", display: "flex", flexDirection: "column", gap: "2.4cqw", borderTop: `1.2cqw solid ${accent}` }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          {logo || <span style={{ color: accent, fontWeight: 800, fontSize: "2cqw" }}>CodeMentor</span>}
          {brand}
        </div>
        <h2 style={{ fontSize: "2cqw", fontWeight: 600, color: accent, textTransform: "uppercase", letterSpacing: "0.14em", margin: "2cqw 0 0" }}>
          {fill(design.heading)}
        </h2>
        <div style={{ fontSize: "4.6cqw", fontWeight: 800, lineHeight: 1.1 }}>{values.learnerName}</div>
        <p style={{ fontSize: "1.8cqw", lineHeight: 1.5, margin: 0, maxWidth: "75%" }}>{fill(design.body)}</p>
        <div style={{ marginTop: "auto", display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: "4cqw" }}>
          {fields || <span />}
          {signer}
        </div>
      </div>
    );
  } else {
    content = (
      <div style={{ height: "100%", padding: "2.4cqw" }}>
        <div
          style={{
            height: "100%",
            border: `0.5cqw double ${accent}`,
            padding: "4cqw 6cqw",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
            gap: "2cqw",
          }}
        >
          {logo || <span style={{ color: accent, fontWeight: 800, fontSize: "2cqw" }}>CodeMentor</span>}
          {/* Thân căn giữa theo chiều dọc: dồn lên trên thì nửa dưới tờ giấy trống trơn. */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "2cqw" }}>
            <h2 style={{ fontFamily: SERIF, fontSize: "4cqw", fontWeight: 700, color: accent, margin: 0 }}>
              {fill(design.heading)}
            </h2>
            <div style={{ fontFamily: SERIF, fontSize: "4.8cqw", fontStyle: "italic", lineHeight: 1.1 }}>{values.learnerName}</div>
            <p style={{ fontSize: "1.8cqw", lineHeight: 1.5, margin: 0, maxWidth: "80%" }}>{fill(design.body)}</p>
            <div style={{ display: "flex", justifyContent: "center" }}>{fields}</div>
          </div>
          <div style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
            {brand}
            {signer}
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {printable && (
        <style>{`@media print {
  @page { size: A4 landscape; margin: 0; }
  body * { visibility: hidden !important; }
  [data-certificate-print], [data-certificate-print] * { visibility: visible !important; }
  [data-certificate-print] { position: fixed !important; inset: 0 !important; width: 100vw !important; box-shadow: none !important; border: 0 !important; }
}`}</style>
      )}
      <div
        data-certificate-print={printable ? "" : undefined}
        className={`w-full overflow-hidden rounded-md border border-border font-sans shadow-sm ${className}`}
        style={{ ...frame, printColorAdjust: "exact", WebkitPrintColorAdjust: "exact" }}
      >
        {content}
      </div>
    </>
  );
}
