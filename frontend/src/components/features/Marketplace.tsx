"use client";
import { useState } from "react";
import Link from "next/link";
import { EmptyState, ErrorState, LoadingState } from "@/components/shared/States";
import { FormField } from "@/components/shared/FormField";
import { ListingCard } from "@/components/shared/ListingCard";
import { useMe } from "@/components/shared/Providers";
import { CATEGORY_LABEL, LISTING_STATUS_LABEL, LISTING_TYPE_LABEL } from "@/lib/labels";
import { api } from "@/lib/api";
import { inputClass, primaryButtonClass, secondaryButtonClass } from "@/lib/ui";
import { useAsync } from "@/hooks/useAsync";
import type { ListingStatus, ListingType, Meta } from "@/types";

const PAGE = 12;
const blank = { q: "", category: "", listingType: "", status: "", page: 1 };
const opts = (m: Record<string, string>) => Object.entries(m).map(([k, v]) => <option key={k} value={k}>{v}</option>);
const hasCategories = Object.keys(CATEGORY_LABEL).length > 0;

export function Marketplace({ mine = false }: { mine?: boolean }) {
  const { user, can } = useMe();
  const [f, setF] = useState(blank);
  const set = (k: "q" | "category" | "listingType" | "status", v: string) => setF((p) => ({ ...p, [k]: v, page: 1 }));
  const list = useAsync(async () => {
    const q = { q: f.q, category: f.category, listingType: f.listingType as ListingType | "", status: f.status as ListingStatus | "" };
    if (!mine) return api.listListings({ ...q, page: f.page, limit: PAGE });
    if (!user) return { data: [], meta: { page: 1, limit: PAGE, total: 0, totalPages: 1 } as Meta };
    const all = await api.listMyListings(user.id, q); // กรอง ownerCoreUserId ฝั่ง client แล้วแบ่งหน้าเอง
    const meta: Meta = { page: f.page, limit: PAGE, total: all.length, totalPages: Math.max(1, Math.ceil(all.length / PAGE)) };
    return { data: all.slice((f.page - 1) * PAGE, f.page * PAGE), meta };
  }, [f, mine, user?.id]);
  const filtered = !!(f.q || f.category || f.listingType || f.status);
  const meta = list.data?.meta;
  const createCta = can("listing:create") ? <Link href="/listings/new" className={primaryButtonClass}>ลงของ</Link> : null;

  return (
    <>
      <header className="space-y-2">
        <h1 className="font-display text-headline-md md:text-headline-lg">{mine ? "ของของฉัน" : "CampusShare"}</h1>
        <p className="text-body-md text-on-surface-variant">{mine ? "จัดการสิ่งของที่คุณลงไว้ (ไม่แสดงรายการเก็บถาวรจนกว่าจะเลือกสถานะ)" : "พื้นที่แบ่งปันสิ่งของ ภายในสาขา CSMJU"}</p>
      </header>
      <section aria-label="ตัวกรอง" className="grid gap-4 md:grid-cols-4">
        <FormField label="ค้นหา"><input type="search" className={inputClass} value={f.q} placeholder="ชื่อสิ่งของ" onChange={(e) => set("q", e.target.value)} /></FormField>
        {hasCategories && (
          <FormField label="หมวดหมู่"><select className={inputClass} value={f.category} onChange={(e) => set("category", e.target.value)}><option value="">ทั้งหมด</option>{opts(CATEGORY_LABEL)}</select></FormField>
        )}
        <FormField label="ประเภท"><select className={inputClass} value={f.listingType} onChange={(e) => set("listingType", e.target.value)}><option value="">ทั้งหมด</option>{opts(LISTING_TYPE_LABEL)}</select></FormField>
        {mine && <FormField label="สถานะ"><select className={inputClass} value={f.status} onChange={(e) => set("status", e.target.value)}><option value="">ทั้งหมด (ไม่รวมเก็บถาวร)</option>{opts(LISTING_STATUS_LABEL)}</select></FormField>}
      </section>
      <div aria-live="polite" className="space-y-6">
        {list.loading && !list.data ? <LoadingState /> : list.error ? <ErrorState error={list.error} onRetry={list.reload} /> : meta?.total === 0 ? (
          filtered ? <EmptyState title="ไม่พบประกาศที่ตรงกับการค้นหา" hint="ลองเปลี่ยนคำค้นหาหรือล้างตัวกรอง"><button type="button" className={secondaryButtonClass} onClick={() => setF(blank)}>ล้างตัวกรอง</button></EmptyState>
            : <EmptyState title={mine ? "คุณยังไม่ได้ลงของ" : "ยังไม่มีประกาศในตลาด"} hint={createCta ? "เริ่มต้นด้วยการลงของชิ้นแรก" : undefined}>{createCta}</EmptyState>
        ) : (
          <>
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">{list.data?.data.map((l) => <ListingCard key={l.id} l={l} />)}</div>
            {meta && meta.totalPages > 1 && (
              <nav aria-label="เปลี่ยนหน้า" className="flex items-center justify-end gap-3">
                <span className="text-body-md text-on-surface-variant">หน้า {meta.page} จาก {meta.totalPages}</span>
                <button type="button" className={secondaryButtonClass} disabled={meta.page <= 1} title="อยู่หน้าแรกแล้ว" onClick={() => setF((p) => ({ ...p, page: p.page - 1 }))}>ก่อนหน้า</button>
                <button type="button" className={secondaryButtonClass} disabled={meta.page >= meta.totalPages} title="อยู่หน้าสุดท้ายแล้ว" onClick={() => setF((p) => ({ ...p, page: p.page + 1 }))}>ถัดไป</button>
              </nav>
            )}
          </>
        )}
      </div>
    </>
  );
}
