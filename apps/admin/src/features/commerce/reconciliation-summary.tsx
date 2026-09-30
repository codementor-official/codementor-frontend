"use client";
import { useEffect, useState } from "react";
import { StatStrip } from "@codementor/ui";
import { apiErrorMessage } from "@codementor/api-client";
import { useAdminApi } from "@/features/auth/admin-api";
import { commerceAdminApi, vnd } from "./api";
export function ReconciliationSummary({ refreshing }: { refreshing: boolean }) {
  const request = useAdminApi();
  const [data, setData] = useState<Record<string, number> | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    if (refreshing) return;
    let active = true;
    void commerceAdminApi
      .reconciliation(request)
      .then((d) => {
        if (active) {
          setData(d);
          setError("");
        }
      })
      .catch((e) => {
        if (active) setError(apiErrorMessage(e));
      });
    return () => {
      active = false;
    };
  }, [request, refreshing]);
  return (
    <div className="space-y-2">
      {error && (
        <p role="alert" className="text-sm text-destructive">
          Không đọc được đối soát: {error}
        </p>
      )}
      {data && (
        <>
          <StatStrip
            stats={[
              { label: "Thanh toán cần xác minh", value: data.review },
              { label: "Giao dịch chưa đối soát", value: data.unreconciled },
              { label: "Chi trả cần kiểm tra", value: data.uncertainPayouts },
              { label: "Hoàn tiền đang xử lý", value: data.refunds },
            ]}
          />
          <p className="text-xs text-muted-foreground">
            Công nợ giảng viên: {vnd(data.liability)} · Doanh thu CodeMentor
            trước phí: {vnd(data.platform)} · {data.unknownFees} giao dịch chưa
            xác định phí.{" "}
            {data.imbalanced === 0
              ? "Sổ giao dịch cân đối."
              : `${data.imbalanced} bút toán lệch — cần kiểm tra.`}
          </p>
        </>
      )}
    </div>
  );
}
