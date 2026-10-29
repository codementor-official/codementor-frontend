"use client";

import { useCallback, useEffect, useState } from "react";
import { Crown } from "lucide-react";
import { apiErrorMessage } from "@codementor/api-client";
import { Select, useToast } from "@codementor/ui";
import { formatVnDate } from "@codementor/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { api, type OwnershipOffer } from "@/lib/api";
import { useQuotaDialog } from "@/features/workspace-billing/quota-dialog";

/**
 * Owner side: offering the group to a member. Nothing changes hands until they accept, and the
 * offer can be cancelled while it waits.
 */
export function OwnershipTransferCard({
  slug,
  members,
}: {
  slug: string;
  members: { id: string; user: { displayName: string } }[];
}) {
  const toast = useToast();
  const quota = useQuotaDialog();
  const [offer, setOffer] = useState<OwnershipOffer | null>(null);
  const [to, setTo] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const load = useCallback(() => api.workspaces.pendingTransfer(slug).then(setOffer).catch(() => setOffer(null)), [slug]);
  useEffect(() => {
    void load();
  }, [load]);

  const recipient = (id: string) => members.find((m) => m.id === id)?.user.displayName ?? "thành viên";

  async function send() {
    setBusy(true);
    try {
      await api.workspaces.transferOwnership(slug, to);
      toast.success(`Đã gửi lời đề nghị cho ${recipient(to)}. Quyền chỉ đổi khi họ đồng ý.`);
      setConfirming(false);
      setTo("");
      await load();
    } catch (cause) {
      setConfirming(false);
      // The recipient's limits, not the owner's: the server lists every reason in one sentence.
      if (!quota.handle(cause, false)) toast.error(apiErrorMessage(cause));
    } finally {
      setBusy(false);
    }
  }

  async function cancel() {
    if (!offer) return;
    try {
      await api.workspaces.cancelTransfer(slug, offer.id);
      toast.success("Đã huỷ lời đề nghị chuyển quyền");
      await load();
    } catch (cause) {
      toast.error(apiErrorMessage(cause));
    }
  }

  return (
    <Card className="p-5">
      {quota.dialog}
      <h2 className="mb-2 text-sm font-bold text-navy">Chuyển quyền sở hữu</h2>
      {offer ? (
        <>
          <p className="text-sm text-text">
            Đang chờ <strong>{recipient(offer.toMembershipId)}</strong> đồng ý nhận quyền Chủ nhóm, hết hạn{" "}
            {formatVnDate(offer.expiresAt, true)}.
          </p>
          <Button size="sm" variant="outline" className="mt-3" onClick={() => void cancel()}>
            Huỷ lời đề nghị
          </Button>
        </>
      ) : (
        <>
          <p className="mb-3 text-xs leading-relaxed text-text-faint">
            Người nhận phải đồng ý trong 7 ngày và cần còn hạn mức theo gói của họ (số nhóm, thành viên, dung lượng). Sau khi
            chuyển, bạn trở thành Phó nhóm.
          </p>
          <Select
            label="Chủ nhóm mới"
            className="w-full"
            value={to}
            onChange={setTo}
            options={[{ value: "", label: "Chọn thành viên" }, ...members.map((m) => ({ value: m.id, label: m.user.displayName }))]}
          />
          <Button size="sm" variant="outline" className="mt-3" disabled={!to || busy} onClick={() => setConfirming(true)}>
            <Crown className="h-3.5 w-3.5" />
            Gửi lời đề nghị
          </Button>
        </>
      )}
      <ConfirmDialog
        open={confirming}
        onClose={() => setConfirming(false)}
        onConfirm={() => void send()}
        tone="default"
        title="Đề nghị chuyển quyền Chủ nhóm?"
        confirmLabel="Gửi lời đề nghị"
        message={
          <>
            {recipient(to)} sẽ nhận thông báo và có 7 ngày để đồng ý. Khi họ đồng ý, nhóm cùng toàn bộ tài liệu, thành viên và bài
            tập tính vào gói của họ, còn bạn trở thành Phó nhóm.
          </>
        }
      />
    </Card>
  );
}

/** Recipient side: shown at the top of the group while an offer waits for them. */
export function OwnershipOfferBanner({ slug, onAccepted }: { slug: string; onAccepted: () => void }) {
  const toast = useToast();
  const quota = useQuotaDialog();
  const [offer, setOffer] = useState<OwnershipOffer | null>(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    api.workspaces.pendingTransfer(slug).then(setOffer).catch(() => setOffer(null));
  }, [slug]);
  if (!offer || offer.status !== "pending" || !offer.forMe) return quota.dialog;

  async function decide(accept: boolean) {
    if (!offer) return;
    setBusy(true);
    try {
      if (accept) {
        await api.workspaces.acceptTransfer(slug, offer.id);
        toast.success("Bạn đã là Chủ nhóm");
        onAccepted();
      } else {
        await api.workspaces.declineTransfer(slug, offer.id);
        toast.success("Đã từ chối lời đề nghị");
      }
      setOffer(null);
    } catch (cause) {
      if (!quota.handle(cause, true)) toast.error(apiErrorMessage(cause));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div role="status" className="mb-4 flex flex-wrap items-center gap-3 rounded-lg border border-primary/30 bg-primary-tint p-4 text-sm text-text">
      {quota.dialog}
      <Crown className="h-4 w-4 shrink-0 text-primary" aria-hidden />
      <p className="min-w-0 flex-1">
        Chủ nhóm muốn chuyển quyền Chủ nhóm cho bạn. Nếu đồng ý, nhóm sẽ tính vào hạn mức gói của bạn. Hết hạn{" "}
        {formatVnDate(offer.expiresAt, true)}.
      </p>
      <Button size="sm" variant="outline" disabled={busy} onClick={() => void decide(false)}>
        Từ chối
      </Button>
      <Button size="sm" disabled={busy} onClick={() => void decide(true)}>
        Nhận quyền Chủ nhóm
      </Button>
    </div>
  );
}
