"use client";
// สถานะผู้ใช้ปัจจุบัน (จาก GET /api/v1/me) + การแจ้งเตือน + Gate สำหรับหน้าที่ต้อง login/มีสิทธิ์
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { ApiError, api, clearSsoLoopGuard, goLogin, toApiError } from "@/lib/api";
import { Permission, can as canDo } from "@/lib/permissions";
import type { Me, Notification } from "@/types";
import { ErrorState, ForbiddenState, LoadingState } from "./States";

export type MeState =
  | { status: "loading" } | { status: "guest"; redirecting: boolean } | { status: "forbidden" }
  | { status: "error"; error: ApiError } | { status: "user"; user: Me };

const MeCtx = createContext<{ state: MeState; reload: () => void }>({ state: { status: "loading" }, reload: () => {} });
export function MeProvider({ children }: { children: React.ReactNode }) {
  const [state, set] = useState<MeState>({ status: "loading" });
  const [n, setN] = useState(0);
  useEffect(() => {
    let live = true;
    api.me()
      .then((user) => { if (!live) return; clearSsoLoopGuard(); set({ status: "user", user }); })
      .catch((e) => {
        if (!live) return;
        const a = toApiError(e);
        if (a.code === "UNAUTHORIZED") {
          // ไม่มีหน้าที่เปิดให้ผู้เยี่ยมชมแล้ว (api-conventions v1.1 ข้อ 7.6) → พาไป login ทันที
          // goLogin() คืน false เมื่อเจอลูป → AppFrame แสดงปุ่ม "เข้าสู่ระบบอีกครั้ง" แทน
          set({ status: "guest", redirecting: goLogin() });
          return;
        }
        set(a.code === "FORBIDDEN" ? { status: "forbidden" } : { status: "error", error: a });
      });
    return () => { live = false; };
  }, [n]);
  const value = useMemo(() => ({ state, reload: () => setN((x) => x + 1) }), [state]);
  return <MeCtx.Provider value={value}>{children}</MeCtx.Provider>;
}
export function useMe() {
  const { state, reload } = useContext(MeCtx);
  const user = state.status === "user" ? state.user : null;
  return { state, reload, user, can: (p: Permission) => canDo(user?.subsystemRole, p) };
}

const NotifCtx = createContext<{ items: Notification[]; unread: number; markRead: (id: string) => Promise<void> }>({ items: [], unread: 0, markRead: async () => {} });
export function NotificationsProvider({ children }: { children: React.ReactNode }) {
  const { user } = useMe();
  const path = usePathname();
  const [items, set] = useState<Notification[]>([]);
  useEffect(() => {
    if (!user) { set([]); return; }
    let live = true;
    api.notifications().then((r) => live && set(r)).catch(() => {}); // เบื้องหลัง: ล้มเหลวได้เงียบๆ
    return () => { live = false; };
  }, [user, path]);
  const markRead = useCallback(async (id: string) => {
    await api.markNotificationRead(id);
    set((p) => p.map((x) => (x.id === id ? { ...x, isRead: true } : x)));
  }, []);
  const value = useMemo(() => ({ items, unread: items.filter((x) => !x.isRead).length, markRead }), [items, markRead]);
  return <NotifCtx.Provider value={value}>{children}</NotifCtx.Provider>;
}
export const useNotifications = () => useContext(NotifCtx);

/** ตรวจสิทธิ์เพื่อ UX เท่านั้น — backend ตัดสินจริง (403) · เรื่อง login จัดการที่ MeProvider/AppFrame ที่เดียว */
export function Gate({ permission, children }: { permission: Permission; children: React.ReactNode }) {
  const { state, user, can, reload } = useMe();
  if (state.status === "error") return <ErrorState error={state.error} onRetry={reload} />;
  if (!user) return <LoadingState />; // loading / guest / forbidden → AppFrame แสดงสถานะแทนอยู่แล้ว
  if (!can(permission)) return <ForbiddenState />;
  return <>{children}</>;
}
