"use client";
import { useState } from "react";
import Link from "next/link";
import { FormField } from "@/components/shared/FormField";
import { EmptyState, ErrorState, LoadingState, errorText } from "@/components/shared/States";
import { api, toApiError } from "@/lib/api";
import { LISTING_STATUS_LABEL, REPORT_TARGET_LABEL, REQUEST_STATUS_LABEL, formatDate, label } from "@/lib/labels";
import { cardClass, inputClass, primaryButtonClass } from "@/lib/ui";
import { useAsync } from "@/hooks/useAsync";
import type { Report } from "@/types";
import { RequestCard } from "./BorrowRequests";

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="space-y-4"><h2 className="font-display text-headline-md">{title}</h2>{children}</section>
);
function Counts({ title, data, map }: { title: string; data: Record<string, number>; map: Record<string, string> }) {
  return (
    <div className={`${cardClass} p-4`}>
      <h3 className="text-label-md text-on-surface-variant">{title}</h3>
      <dl className="mt-2 space-y-1">{Object.entries(data).map(([k, n]) => <div key={k} className="flex justify-between text-body-md"><dt>{label(map, k)}</dt><dd>{n}</dd></div>)}</dl>
    </div>
  );
}

function ReportRow({ r, onChanged }: { r: Report; onChanged: () => void }) {
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  async function resolve() {
    setBusy(true); setErr("");
    try { await api.resolveReport(r.id, note); }
    catch (e) { setErr(errorText(toApiError(e))); } // 409 = ปิดไปแล้ว
    finally { setBusy(false); onChanged(); }
  }
  return (
    <article className={`${cardClass} space-y-3 p-6`}>
      <p className="text-label-sm text-secondary">
        {label(REPORT_TARGET_LABEL, r.targetType)} · รายงานเมื่อ {formatDate(r.createdAt)}
        {r.targetType === "LISTING" && <> · <Link href={`/listings/${r.targetId}`} className="text-primary-container underline">ดูประกาศ</Link></>}
      </p>
      <p className="text-body-md">{r.reason}</p>
      {err && <p role="alert" className="rounded-lg bg-error-container px-4 py-3 text-label-sm text-on-error-container">{err}</p>}
      <div className="max-w-prose space-y-3">
        <FormField label="บันทึกการปิดรายงาน"><input maxLength={300} className={inputClass} value={note} onChange={(e) => setNote(e.target.value)} /></FormField>
        <div className="flex justify-end"><button type="button" className={primaryButtonClass} disabled={busy} aria-busy={busy} onClick={resolve}>ปิดรายงาน</button></div>
      </div>
    </article>
  );
}

export function AdminDashboard() {
  const stats = useAsync(() => api.adminStats(), []);
  const reports = useAsync(() => api.adminReports(), []);
  const overdue = useAsync(() => api.adminOverdue(), []);
  const refresh = () => { stats.reload(); reports.reload(); };
  return (
    <>
      <header className="space-y-2"><h1 className="font-display text-headline-md md:text-headline-lg">ผู้ดูแลระบบ</h1></header>
      <Section title="สถิติ">
        {stats.loading && !stats.data ? <LoadingState /> : stats.error || !stats.data ? <ErrorState error={stats.error ?? toApiError(null)} onRetry={stats.reload} /> : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <div className={`${cardClass} space-y-1 p-4`}>
              <p className="text-body-md">รายงานที่ค้าง: <strong>{stats.data.openReportsCount}</strong></p>
              <p className="text-body-md">คำขอเกินกำหนดคืน: <strong>{stats.data.overdueRequestsCount}</strong></p>
              <p className="text-body-md">ผู้ลงของที่ยังใช้งาน: <strong>{stats.data.activeListersCount}</strong></p>
            </div>
            <Counts title="ของแยกตามสถานะ" data={stats.data.listingsByStatus} map={LISTING_STATUS_LABEL} />
            <Counts title="คำขอแยกตามสถานะ" data={stats.data.requestsByStatus} map={REQUEST_STATUS_LABEL} />
          </div>
        )}
      </Section>
      <Section title="รายงานที่ค้างอยู่">
        {reports.loading && !reports.data ? <LoadingState /> : reports.error || !reports.data ? <ErrorState error={reports.error ?? toApiError(null)} onRetry={reports.reload} /> :
          reports.data.length === 0 ? <EmptyState title="ไม่มีรายงานค้าง" /> : <div className="space-y-4">{reports.data.map((r) => <ReportRow key={r.id} r={r} onChanged={refresh} />)}</div>}
      </Section>
      <Section title="คำขอที่เกินกำหนดคืน">
        {overdue.loading && !overdue.data ? <LoadingState /> : overdue.error || !overdue.data ? <ErrorState error={overdue.error ?? toApiError(null)} onRetry={overdue.reload} /> :
          overdue.data.length === 0 ? <EmptyState title="ไม่มีคำขอเกินกำหนดคืน" /> : <div className="space-y-4">{overdue.data.map((r) => <RequestCard key={r.id} r={r} side="owner" actions={false} />)}</div>}
      </Section>
    </>
  );
}
