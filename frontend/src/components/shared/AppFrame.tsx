"use client";
// ชั่วคราว: แทน <CsmjuAppShell> จน template csmju-subsystem-web พร้อม (ห้ามใช้ต่อหลังจากนั้น)
import Link from "next/link";
import { usePathname } from "next/navigation";
import { loginUrl } from "@/lib/api";
import { primaryButtonClass, secondaryButtonClass } from "@/lib/ui";
import { EmptyState, ErrorState, LoadingState } from "./States";
import { MeProvider, NotificationsProvider, useMe, useNotifications } from "./Providers";

// Logout ต้องเป็น <form method="POST"> จริง (ห้าม fetch) เพราะ backend ตอบ 303 redirect ไป Core Hub
function LogoutForm({ className }: { className: string }) {
  return <form method="POST" action="/auth/logout"><button type="submit" className={className}>ออกจากระบบ</button></form>;
}

function Frame({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const { state, user, can, reload } = useMe();
  const { unread } = useNotifications();
  const nav = [
    { href: "/", label: "ตลาดสิ่งของ" },
    ...(user ? [{ href: "/my-listings", label: "ของของฉัน" }, { href: "/borrow-requests", label: "คำขอ" }] : []),
    ...(can("admin:access") ? [{ href: "/admin", label: "ผู้ดูแล" }] : []),
  ];
  const active = (h: string) => (h === "/" ? path === "/" : path.startsWith(h));
  const link = (n: (typeof nav)[number], cls: string) => (
    <Link key={n.href} href={n.href} aria-current={active(n.href) ? "page" : undefined} className={`${cls} ${active(n.href) ? "text-primary-container" : "text-on-surface-variant"}`}>{n.label}</Link>
  );
  // guest/forbidden = ยังใช้งานระบบไม่ได้ → ซ่อนเมนูทั้งหมด เหลือแต่ข้อความอธิบาย
  const chromeless = state.status === "forbidden" || state.status === "guest";
  return (
    <>
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:z-20 focus:bg-white focus:p-3">ข้ามไปยังเนื้อหาหลัก</a>
      <header className="sticky top-0 z-10 border-b border-surface-variant bg-surface-container-lowest shadow-sm">
        <div className="mx-auto flex h-16 max-w-[1280px] items-center justify-between gap-4 px-4 md:px-12">
          <Link href="/" className="font-display text-headline-md text-primary-container">CampusShare</Link>
          {!chromeless && <nav aria-label="เมนูหลัก" className="hidden gap-6 text-label-md md:flex">{nav.map((n) => link(n, "py-2"))}</nav>}
          <div className="flex items-center gap-2">
            {user && (
              <Link href="/notifications" aria-label={unread ? `การแจ้งเตือน ยังไม่อ่าน ${unread} รายการ` : "การแจ้งเตือน"} className="relative inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg text-on-surface-variant hover:bg-surface-variant/50">
                <svg aria-hidden="true" className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.7 21a2 2 0 01-3.4 0" /></svg>
                {unread > 0 && <span aria-hidden="true" className="absolute right-1 top-1 min-w-5 rounded-full bg-error px-1 text-center text-label-sm text-white">{unread > 99 ? "99+" : unread}</span>}
              </Link>
            )}
            {can("listing:create") && <Link href="/listings/new" className={primaryButtonClass}>ลงของ</Link>}
            {user && <span className="hidden max-w-48 truncate text-label-sm text-on-surface-variant lg:inline">{user.email}</span>}
            {user && <div className="hidden md:block"><LogoutForm className={secondaryButtonClass} /></div>}
            {state.status === "guest" && <a href={loginUrl(path)} className={primaryButtonClass}>เข้าสู่ระบบ</a>}
          </div>
        </div>
      </header>
      <main id="main" className="mx-auto max-w-[1280px] space-y-8 px-4 py-8 pb-24 md:px-12 md:pb-8">
        {state.status === "forbidden" ? (
          <EmptyState title="บัญชีนี้ไม่มีสิทธิ์เข้าใช้งานระบบนี้" hint="หากคิดว่าเป็นข้อผิดพลาด กรุณาติดต่อผู้ดูแลระบบ หรือออกจากระบบแล้วเข้าสู่ระบบด้วยบัญชีอื่น"><LogoutForm className={secondaryButtonClass} /></EmptyState>
        ) : state.status === "guest" ? (
          state.redirecting ? <LoadingState /> : (
            <EmptyState title="ยังไม่ได้เข้าสู่ระบบ" hint="ระบบพยายามพาไปเข้าสู่ระบบแล้วแต่ยังไม่สำเร็จ อาจเป็นเพราะ Core Hub ไม่พร้อมใช้งานชั่วคราว">
              <a href={loginUrl(path)} className={primaryButtonClass}>เข้าสู่ระบบอีกครั้ง</a>
            </EmptyState>
          )
        ) : state.status === "error" ? <ErrorState error={state.error} onRetry={reload} /> : children}
      </main>
      {!chromeless && (
        <nav aria-label="เมนูมือถือ" style={{ gridTemplateColumns: `repeat(${nav.length + (user ? 1 : 0)}, minmax(0, 1fr))` }} className="fixed inset-x-0 bottom-0 z-10 grid border-t border-surface-variant bg-surface-container-lowest pb-[env(safe-area-inset-bottom)] text-label-md md:hidden">
          {nav.map((n) => link(n, "flex min-h-11 items-center justify-center py-3"))}
          {user && <form method="POST" action="/auth/logout" className="contents"><button type="submit" className="flex min-h-11 items-center justify-center py-3 text-on-surface-variant">ออกจากระบบ</button></form>}
        </nav>
      )}
    </>
  );
}
export function AppFrame({ children }: { children: React.ReactNode }) {
  return <MeProvider><NotificationsProvider><Frame>{children}</Frame></NotificationsProvider></MeProvider>;
}
