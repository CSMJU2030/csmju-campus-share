"use client";
// ชั้นต่อระหว่างสถานะผู้ใช้ (client) กับ <CsmjuAppShell> ของกลาง
// ui-design-system.md v1.3.1 ข้อ 17.0 — layout.tsx เป็น server component จึงเรียก can() ไม่ได้
// ไฟล์นี้อ่าน useMe()/useNotifications() แล้วประกอบ prop ส่งให้ของกลางเท่านั้น ไม่มีการแก้ไฟล์ใน src/csmju/
import { usePathname } from "next/navigation";
import { CsmjuAppShell, type NavItem } from "@/csmju";
import { loginUrl } from "@/lib/api";
import { ROLE_LABEL } from "@/lib/labels";
import { primaryButtonClass, secondaryButtonClass } from "@/lib/ui";
import { EmptyState, ErrorState, LoadingState } from "./States";
import { MeProvider, NotificationsProvider, useMe, useNotifications } from "./Providers";

/** ต้องตรงกับ display_name ใน subsystem.yaml */
const DISPLAY_NAME = "CampusShare";

/** ออกจากระบบต้องเป็น <form method="POST"> จริง (auth-contract.md ข้อ 5) เพราะ backend ตอบ 303 ไป Core Hub
 *  ใน shell ของกลางมีปุ่มนี้อยู่แล้ว — ที่นี่ใช้เฉพาะหน้า forbidden ซึ่งไม่ได้ render shell */
function LogoutForm({ className }: { className: string }) {
  return <form method="POST" action="/auth/logout"><button type="submit" className={className}>ออกจากระบบ</button></form>;
}

/** อักษรย่อ 2 ตัวจากอีเมล — reference-data.md 1.3 ห้ามระบบย่อยเก็บชื่อผู้ใช้ จึงไม่มีชื่อจริงให้ใช้ */
function initialsOf(email: string): string {
  const letters = (email.split("@")[0] ?? "").replace(/[^A-Za-z0-9]/g, "");
  return (letters.slice(0, 2) || "??").toUpperCase();
}

function Frame({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const { state, can, reload } = useMe();
  const { unread } = useNotifications();

  // ยังไม่มีผู้ใช้ = ใช้งานระบบไม่ได้ → ไม่ render shell เลย (ไม่มีเมนูให้กดอยู่ดี)
  if (state.status !== "user") {
    return (
      <div className="mx-auto flex w-full max-w-[1280px] flex-1 flex-col justify-center px-4 py-8 md:px-12">
        {state.status === "loading" ? (
          <LoadingState />
        ) : state.status === "forbidden" ? (
          <EmptyState title="บัญชีนี้ไม่มีสิทธิ์เข้าใช้งานระบบนี้" hint="หากคิดว่าเป็นข้อผิดพลาด กรุณาติดต่อผู้ดูแลระบบ หรือออกจากระบบแล้วเข้าสู่ระบบด้วยบัญชีอื่น">
            <LogoutForm className={secondaryButtonClass} />
          </EmptyState>
        ) : state.status === "error" ? (
          <ErrorState error={state.error} onRetry={reload} />
        ) : state.redirecting ? (
          <LoadingState />
        ) : (
          <EmptyState title="ยังไม่ได้เข้าสู่ระบบ" hint="ระบบพยายามพาไปเข้าสู่ระบบแล้วแต่ยังไม่สำเร็จ อาจเป็นเพราะ Core Hub ไม่พร้อมใช้งานชั่วคราว">
            <a href={loginUrl(path)} className={primaryButtonClass}>เข้าสู่ระบบอีกครั้ง</a>
          </EmptyState>
        )}
      </div>
    );
  }

  // icon เลือกได้เฉพาะ 10 ชื่อใน NavIconName ของ CsmjuAppShell — nav[0] คือ root ที่ shell เทียบแบบ exact
  const nav: NavItem[] = [
    { label: "CampusShare", href: "/", icon: "dashboard" },
    { label: "ของของฉัน", href: "/my-listings", icon: "menu-book" },
    { label: "คำขอ", href: "/borrow-requests", icon: "receipt" },
    // ปุ่มกระดิ่งของกลางยังไม่มี badge และยังไม่มีปลายทาง → ใส่จำนวนที่ยังไม่อ่านไว้ใน label ของเมนูแทน
    { label: unread > 0 ? `การแจ้งเตือน (${unread > 99 ? "99+" : unread})` : "การแจ้งเตือน", href: "/notifications", icon: "campaign" },
  ];
  if (can("admin:access")) nav.push({ label: "ผู้ดูแล", href: "/admin", icon: "settings" });

  return (
    <>
      {/* shell ของกลางมี <main id="main"> แต่ไม่มีลิงก์ข้ามเนื้อหา — เติมจากฝั่งเราโดยไม่แตะของกลาง */}
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:z-40 focus:bg-white focus:p-3">ข้ามไปยังเนื้อหาหลัก</a>
      <CsmjuAppShell
        displayName={DISPLAY_NAME}
        nav={nav}
        primaryAction={can("listing:create") ? { label: "ลงของ", href: "/listings/new" } : undefined}
        user={{ initials: initialsOf(state.user.email), roleLabel: ROLE_LABEL[state.user.subsystemRole] }}
      >
        {children}
      </CsmjuAppShell>
    </>
  );
}

export function AppFrame({ children }: { children: React.ReactNode }) {
  return <MeProvider><NotificationsProvider><Frame>{children}</Frame></NotificationsProvider></MeProvider>;
}
