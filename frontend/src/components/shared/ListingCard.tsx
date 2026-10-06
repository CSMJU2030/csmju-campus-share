import Link from "next/link";
import { CATEGORY_LABEL, formatDate, label } from "@/lib/labels";
import { cardClass } from "@/lib/ui";
import type { Listing } from "@/types";
import { StatusBadge, TypeBadge } from "./Badges";

export function ListingCard({ l }: { l: Listing }) {
  // ไม่โชว์ departmentCode — ระบบเปิดใช้สาขาเดียว ทุกใบค่าเดียวกัน และ code ดิบอ่านไม่รู้เรื่อง
  const meta = [label(CATEGORY_LABEL, l.category), formatDate(l.createdAt)].filter(Boolean).join(" · ");
  return (
    <article className={`${cardClass} hover:shadow-md`}>
      <Link href={`/listings/${l.id}`} className="block h-full space-y-3 p-6 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary-container">
        <div className="flex flex-wrap gap-2"><TypeBadge type={l.listingType} /><StatusBadge status={l.status} /></div>
        <h2 className="line-clamp-2 text-body-lg font-semibold text-on-surface">{l.title}</h2>
        {l.description && <p className="line-clamp-2 text-body-md text-on-surface-variant">{l.description}</p>}
        <p className="text-label-sm text-secondary">{meta}</p>
      </Link>
    </article>
  );
}
