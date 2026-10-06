"use client";
import { useState } from "react";
import { StatusBadge, TypeBadge } from "@/components/shared/Badges";
import { FormField } from "@/components/shared/FormField";
import { useMe } from "@/components/shared/Providers";
import { ErrorState, LoadingState, errorText } from "@/components/shared/States";
import { api, toApiError } from "@/lib/api";
import { CATEGORY_LABEL, LISTING_STATUS_LABEL, formatDate, label } from "@/lib/labels";
import { cardClass, inputClass, primaryButtonClass, secondaryButtonClass } from "@/lib/ui";
import { useAsync } from "@/hooks/useAsync";

export function ListingDetail({ id }: { id: string }) {
  const { user, can } = useMe();
  const l = useAsync(() => api.getListing(id), [id]); // ต้อง login: 401 → api client พาไป login แล้วกลับมาหน้านี้
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [reason, setReason] = useState("");
  const [reporting, setReporting] = useState(false);
  const [note, setNote] = useState("");
  const [err, setErr] = useState("");

  if (l.loading && !l.data) return <LoadingState />;
  if (l.error || !l.data) return <ErrorState error={l.error ?? toApiError(null)} onRetry={l.reload} />;
  const x = l.data;
  const isOwner = !!user && user.id === x.ownerCoreUserId;
  const canManage = isOwner && can("listing:manage_own");
  const canRequest = !isOwner && can("borrow:request");
  const canReport = !isOwner && can("report:create");
  // สถานะอื่น (PENDING/BORROWED/GIVEN_AWAY/ARCHIVED) ระบบเปลี่ยนให้เอง เจ้าของสลับไม่ได้
  const toggleTo = x.status === "AVAILABLE" ? "UNAVAILABLE" : x.status === "UNAVAILABLE" ? "AVAILABLE" : null;
  const isGiveaway = x.listingType === "GIVEAWAY";

  async function run(fn: () => Promise<unknown>, ok: string, done?: () => void) {
    setBusy(true); setErr(""); setNote("");
    try { await fn(); setNote(ok); done?.(); }
    catch (e) { setErr(errorText(toApiError(e))); } // CONFLICT/FORBIDDEN/VALIDATION → แสดงข้อความจาก backend
    finally { setBusy(false); l.reload(); } // refetch เสมอ เพราะสถานะอาจเปลี่ยนไปแล้ว
  }
  const rows: [string, string][] = [
    ["หมวดหมู่", label(CATEGORY_LABEL, x.category)], ["สถานะ", label(LISTING_STATUS_LABEL, x.status)],
    ["เจ้าของ", isOwner ? "คุณ" : "เจ้าของ"],
    ["ลงเมื่อ", formatDate(x.createdAt)], ["เคลื่อนไหวล่าสุด", formatDate(x.lastActivityAt)],
  ];
  return (
    <article className={`${cardClass} space-y-6 p-6`}>
      <div className="flex flex-wrap gap-2"><TypeBadge type={x.listingType} /><StatusBadge status={x.status} /></div>
      <h1 className="font-display text-headline-md md:text-headline-lg">{x.title}</h1>
      {x.description && <p className="max-w-prose whitespace-pre-line text-body-md">{x.description}</p>}
      <dl className="grid gap-4 md:grid-cols-2">{rows.map(([k, v]) => <div key={k}><dt className="text-label-md text-on-surface-variant">{k}</dt><dd className="text-body-md">{v}</dd></div>)}</dl>
      {err && <p role="alert" className="rounded-lg bg-error-container px-4 py-3 text-on-error-container">{err}</p>}
      {note && <p role="status" className="rounded-lg bg-primary-container/10 px-4 py-3 text-primary-container">{note}</p>}

      {isOwner ? (
        <div className="flex flex-wrap items-center justify-end gap-3">
          {canManage && toggleTo ? (
            <button type="button" className={secondaryButtonClass} disabled={busy} aria-busy={busy}
              onClick={() => run(() => api.setListingStatus(id, toggleTo), toggleTo === "UNAVAILABLE" ? "ปิดชั่วคราวแล้ว" : "เปิดให้ขออีกครั้งแล้ว")}>
              {toggleTo === "UNAVAILABLE" ? "ปิดชั่วคราว" : "เปิดใหม่"}
            </button>
          ) : <p className="text-body-md text-on-surface-variant">สถานะนี้ระบบเปลี่ยนให้ตามคำขอ จึงตั้งค่าเองไม่ได้ (จัดการคำขอได้ที่เมนู “คำขอ”)</p>}
        </div>
      ) : canRequest && x.status === "AVAILABLE" ? (
        <div className="max-w-prose space-y-4">
          <FormField label="ข้อความถึงเจ้าของ"><textarea rows={3} maxLength={300} className={inputClass} value={msg} onChange={(e) => setMsg(e.target.value)} /></FormField>
          <div className="flex justify-end">
            <button type="button" className={primaryButtonClass} disabled={busy} aria-busy={busy}
              onClick={() => run(() => api.createBorrowRequest(id, msg), "ส่งคำขอแล้ว เจ้าของจะเห็นคำขอของคุณ", () => setMsg(""))}>
              {isGiveaway ? "ขอรับ" : "ขอยืม"}
            </button>
          </div>
          {isGiveaway && <p className="text-label-sm text-on-surface-variant">ของชิ้นนี้เป็นการ &quot;ให้ต่อ&quot; เมื่อเจ้าของอนุมัติจะถือว่าส่งมอบแล้วและปิดรายการถาวร ไม่มีการคืน</p>}
        </div>
      ) : !isOwner && x.status !== "AVAILABLE" ? (
        <p className="text-body-md text-on-surface-variant">
          {x.status === "GIVEN_AWAY"
            ? "ของชิ้นนี้ถูกส่งมอบให้ผู้อื่นไปแล้ว"
            : `ตอนนี้ยังขอไม่ได้ (สถานะ: ${label(LISTING_STATUS_LABEL, x.status)})`}
        </p>
      ) : null}

      {canReport && (
        <div className="max-w-prose space-y-3 border-t border-outline-variant/40 pt-4">
          {!reporting ? <button type="button" className={secondaryButtonClass} onClick={() => setReporting(true)}>รายงานประกาศนี้</button> : (
            <>
              <FormField label="เหตุผลที่รายงาน" required><textarea rows={3} maxLength={500} className={inputClass} value={reason} onChange={(e) => setReason(e.target.value)} /></FormField>
              <div className="flex justify-end gap-3">
                <button type="button" className={secondaryButtonClass} onClick={() => setReporting(false)}>ยกเลิก</button>
                <button type="button" className={primaryButtonClass} disabled={busy || !reason.trim()} aria-busy={busy}
                  onClick={() => run(() => api.createReport({ targetType: "LISTING", targetId: id, reason: reason.trim() }), "ส่งรายงานแล้ว ขอบคุณที่แจ้ง", () => { setReason(""); setReporting(false); })}>ส่งรายงาน</button>
              </div>
            </>
          )}
        </div>
      )}
    </article>
  );
}
