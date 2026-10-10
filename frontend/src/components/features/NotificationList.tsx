"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useNotifications } from "@/components/shared/Providers";
import { EmptyState } from "@/components/shared/States";
import { NOTIFICATION_TYPE_LABEL, formatDate, label } from "@/lib/labels";
import { cardClass } from "@/lib/ui";
import type { Notification } from "@/types";

// ลิงก์ปลายทาง: มี refRequestId → หน้าคำขอ (เลือกแท็บตามชนิด), ไม่งั้นมี refListingId → หน้ารายละเอียดของ
const TAB: Partial<Record<Notification["type"], "owner" | "requester">> = { NEW_REQUEST: "owner", REQUEST_APPROVED: "requester", REQUEST_REJECTED: "requester", RETURN_REMINDER: "requester", OVERDUE_FLAG: "requester" };
const target = (n: Notification) =>
  n.refRequestId ? `/borrow-requests${TAB[n.type] ? `?tab=${TAB[n.type]}` : ""}` : n.refListingId ? `/listings/${n.refListingId}` : null;

/** showHeader=false เมื่อฝังเป็นแท็บในหน้า "คำขอและแจ้งเตือน" (หัวข้อมาจากหน้าแม่แล้ว) */
export function NotificationList({ showHeader = true }: { showHeader?: boolean } = {}) {
  const router = useRouter();
  const { items, markRead } = useNotifications();
  const [busy, setBusy] = useState(false);

  async function open(n: Notification) {
    setBusy(true);
    try { if (!n.isRead) await markRead(n.id); } catch { /* อ่านไม่สำเร็จก็ยังพาไปต่อได้ */ }
    setBusy(false);
    const t = target(n);
    if (t) router.push(t);
  }
  return (
    <>
      {showHeader && <header className="space-y-2"><h1 className="font-display text-headline-md md:text-headline-lg">การแจ้งเตือน</h1></header>}
      {items.length === 0 ? <EmptyState title="ยังไม่มีการแจ้งเตือน" /> : (
        <ul className="space-y-3">
          {items.map((n) => (
            <li key={n.id}>
              <button type="button" disabled={busy} onClick={() => open(n)} className={`${cardClass} block w-full space-y-1 p-4 text-left hover:shadow-md ${n.isRead ? "" : "border-primary-container/60 bg-primary-container/5"}`}>
                <span className="flex items-center gap-2 text-label-sm text-secondary">
                  {!n.isRead && <span aria-label="ยังไม่อ่าน" className="h-2 w-2 rounded-full bg-primary-container" />}
                  {label(NOTIFICATION_TYPE_LABEL, n.type)} · {formatDate(n.createdAt)}
                </span>
                <span className="block text-body-md font-semibold">{n.title}</span>
                {n.body && <span className="block text-body-md text-on-surface-variant">{n.body}</span>}
              </button>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
