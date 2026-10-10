"use client";
import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { RequestStatusBadge, TypeBadge } from "@/components/shared/Badges";
import { FormField } from "@/components/shared/FormField";
import { useMe, useNotifications } from "@/components/shared/Providers";
import { EmptyState, ErrorState, LoadingState, errorText } from "@/components/shared/States";
import { NotificationList } from "@/components/features/NotificationList";
import { api, endOfDayIso, toApiError } from "@/lib/api";
import { formatDate } from "@/lib/labels";
import { cardClass, inputClass, primaryButtonClass, secondaryButtonClass } from "@/lib/ui";
import { useAsync } from "@/hooks/useAsync";
import type { BorrowRequest } from "@/types";

type Side = "requester" | "owner";
/** การแจ้งเตือนเป็นแค่ทางลัดไปหาคำขออยู่แล้ว จึงรวมเป็นแท็บในหน้าเดียวกัน */
type Tab = Side | "notifications";
const today = () => new Date().toISOString().slice(0, 10);

/** การ์ดคำขอ 1 รายการ. actions=false ใช้แบบอ่านอย่างเดียว (หน้า admin) */
export function RequestCard({ r, side, actions = true, onChanged }: { r: BorrowRequest; side: Side; actions?: boolean; onChanged?: () => void }) {
  const { can } = useMe();
  const [resp, setResp] = useState("");
  const [due, setDue] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const canRespond = actions && can("borrow-request:update:own");

  // BORROW ต้องมีวันนัดคืนตอนอนุมัติ · GIVEAWAY ห้ามมี (backend ตอบ 400 ถ้าผิด)
  const isGiveaway = r.listing?.listingType === "GIVEAWAY";
  const needsDueDate = !isGiveaway;

  async function send(status: "APPROVED" | "REJECTED" | "RETURNED") {
    setBusy(true); setErr("");
    try {
      await api.respondBorrowRequest(r.id, {
        status,
        responseMessage: resp,
        dueDate: status === "APPROVED" && needsDueDate && due ? endOfDayIso(due) : undefined,
      });
      setResp(""); setDue("");
    } catch (e) { setErr(errorText(toApiError(e))); } // CONFLICT: สถานะอาจเปลี่ยนไปแล้ว → refetch ด้านล่าง
    finally { setBusy(false); onChanged?.(); }
  }
  const who = side === "owner" ? "ผู้ขอ" : "เจ้าของ";
  return (
    <article className={`${cardClass} space-y-3 p-6`}>
      <div className="flex flex-wrap items-center gap-2">
        <RequestStatusBadge status={r.status} />
        {r.listing && <TypeBadge type={r.listing.listingType} />}
        <span className="text-label-sm text-secondary">{who} · ขอเมื่อ {formatDate(r.requestedAt)}</span>
      </div>
      <h2 className="text-body-lg font-semibold">
        {r.listing ? <Link href={`/listings/${r.listing.id}`} className="hover:underline">{r.listing.title}</Link> : "ประกาศ"}
      </h2>
      {r.message && <p className="text-body-md"><span className="text-on-surface-variant">ข้อความ: </span>{r.message}</p>}
      {r.responseMessage && <p className="text-body-md"><span className="text-on-surface-variant">คำตอบเจ้าของ: </span>{r.responseMessage}</p>}
      {r.dueDate && <p className="text-body-md"><span className="text-on-surface-variant">กำหนดคืน: </span>{formatDate(r.dueDate)}</p>}
      {r.returnedAt && <p className="text-body-md"><span className="text-on-surface-variant">คืนเมื่อ: </span>{formatDate(r.returnedAt)}</p>}
      {err && <p role="alert" className="rounded-lg bg-error-container px-4 py-3 text-label-sm text-on-error-container">{err}</p>}

      {canRespond && side === "owner" && r.status === "PENDING" && (
        <div className="max-w-prose space-y-3 border-t border-outline-variant/40 pt-3">
          <FormField label="ข้อความตอบกลับ"><textarea rows={2} maxLength={300} className={inputClass} value={resp} onChange={(e) => setResp(e.target.value)} /></FormField>
          {needsDueDate ? (
            <FormField label="วันนัดคืน" required error={!due ? "ต้องระบุวันนัดคืนก่อนอนุมัติ" : undefined}>
              <input type="date" min={today()} required aria-invalid={!due} className={inputClass} value={due} onChange={(e) => setDue(e.target.value)} />
            </FormField>
          ) : (
            <p className="text-label-sm text-on-surface-variant">รายการให้ต่อไม่มีวันนัดคืน — อนุมัติแล้วถือว่าส่งมอบและปิดรายการถาวร</p>
          )}
          <div className="flex justify-end gap-3">
            <button type="button" className={secondaryButtonClass} disabled={busy} onClick={() => send("REJECTED")}>ปฏิเสธ</button>
            <button type="button" className={primaryButtonClass} disabled={busy || (needsDueDate && !due)} aria-busy={busy} onClick={() => send("APPROVED")}>
              {isGiveaway ? "อนุมัติและส่งมอบ" : "อนุมัติ"}
            </button>
          </div>
        </div>
      )}
      {canRespond && !isGiveaway && (r.status === "APPROVED" || r.status === "OVERDUE") && (
        <div className="flex justify-end border-t border-outline-variant/40 pt-3">
          <button type="button" className={primaryButtonClass} disabled={busy} aria-busy={busy} onClick={() => send("RETURNED")}>ยืนยันว่าคืนแล้ว</button>
        </div>
      )}
    </article>
  );
}

export function BorrowRequests() {
  const params = useSearchParams();
  const initial = params.get("tab");
  const [tab, setTab] = useState<Tab>(initial === "owner" ? "owner" : initial === "notifications" ? "notifications" : "requester");
  const { user } = useMe();
  const { unread } = useNotifications();
  const q = useAsync(() => api.myBorrowRequests(), []);
  if (q.loading && !q.data) return <LoadingState />;
  if (q.error || !q.data) return <ErrorState error={q.error ?? toApiError(null)} onRetry={q.reload} />;

  // backend คืน array เดียว (api-conventions ข้อ 3) — แยกฝั่งที่นี่จาก id ของผู้ใช้
  const mine = q.data.filter((r) => r.requesterCoreUserId === user?.id);
  const incoming = q.data.filter((r) => r.requesterCoreUserId !== user?.id);
  // แท็บแจ้งเตือนนับ "ที่ยังไม่อ่าน" ไม่ใช่ทั้งหมด เพราะที่อ่านแล้วไม่ต้องทำอะไรต่อ
  const tabs: [Tab, string, number][] = [
    ["requester", "คำขอของฉัน", mine.length],
    ["owner", "คำขอที่เข้ามา", incoming.length],
    ["notifications", "การแจ้งเตือน", unread],
  ];
  const side: Side = tab === "owner" ? "owner" : "requester";
  const rows = tab === "owner" ? incoming : mine;
  return (
    <>
      <header className="space-y-2"><h1 className="font-display text-headline-md md:text-headline-lg">คำขอและแจ้งเตือน</h1></header>
      <div role="tablist" aria-label="คำขอและการแจ้งเตือน" className="flex gap-2 border-b border-outline-variant/40">
        {tabs.map(([k, t, n]) => (
          <button key={k} type="button" role="tab" id={`tab-${k}`} aria-selected={tab === k} aria-controls="req-panel" onClick={() => setTab(k)}
            className={`min-h-11 px-4 text-label-md ${tab === k ? "border-b-2 border-primary-container text-primary-container" : "text-on-surface-variant"}`}>{t} ({n})</button>
        ))}
      </div>
      <div role="tabpanel" id="req-panel" aria-labelledby={`tab-${tab}`} className="space-y-4">
        {tab === "notifications" ? <NotificationList showHeader={false} /> : rows.length === 0 ? (
          <EmptyState title={side === "owner" ? "ยังไม่มีคำขอเข้ามา" : "คุณยังไม่ได้ส่งคำขอ"} hint={side === "owner" ? undefined : "เลือกของที่สนใจจาก CampusShare แล้วกดขอยืม"}>
            {side === "requester" && <Link href="/" className={secondaryButtonClass}>ไปที่ CampusShare</Link>}
          </EmptyState>
        ) : rows.map((r) => <RequestCard key={r.id} r={r} side={side} onChanged={q.reload} />)}
      </div>
    </>
  );
}
