"use client";
import { useEffect, useState } from "react";
import { ApiError, toApiError } from "@/lib/api";

// reload() แสดงข้อมูลเดิมค้างไว้ระหว่างโหลดใหม่ (loading=true แต่ data ยังอยู่)
export function useAsync<T>(fn: () => Promise<T>, deps: unknown[]) {
  const [s, set] = useState<{ data?: T; error?: ApiError; loading: boolean }>({ loading: true });
  const [n, setN] = useState(0);
  useEffect(() => {
    let live = true;
    set((p) => ({ ...p, loading: true, error: undefined }));
    fn().then((data) => live && set({ data, loading: false }))
      .catch((e) => live && set((p) => ({ data: p.data, error: toApiError(e), loading: false })));
    return () => { live = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, n]);
  return { ...s, reload: () => setN((x) => x + 1) };
}
