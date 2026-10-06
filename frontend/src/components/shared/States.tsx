"use client";
import Link from "next/link";
import { ApiError } from "@/lib/api";
import { primaryButtonClass, secondaryButtonClass } from "@/lib/ui";

export function LoadingState() {
  return (
    <div aria-busy="true" aria-label="กำลังโหลดข้อมูล" className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
      {[0, 1, 2, 3, 4, 5].map((i) => <div key={i} className="h-44 animate-pulse rounded-xl bg-surface-variant" />)}
    </div>
  );
}
export function EmptyState({ title, hint, children }: { title: string; hint?: string; children?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-3 px-6 py-12 text-center">
      <svg aria-hidden="true" className="h-12 w-12 text-outline" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 8l-9-5-9 5v8l9 5 9-5V8z" /><path d="M3 8l9 5 9-5M12 13v8" />
      </svg>
      <h2 className="font-display text-headline-md">{title}</h2>
      {hint && <p className="max-w-prose text-body-md text-on-surface-variant">{hint}</p>}
      {children}
    </div>
  );
}
const GENERIC = "เกิดข้อผิดพลาด ลองใหม่อีกครั้ง";
/** ข้อความสำหรับผู้ใช้ตาม error.code (message จาก backend เป็นภาษาไทยแล้ว ยกเว้น VALIDATION_ERROR ใช้ details แทน) */
export function errorText(e: ApiError): string {
  switch (e.code) {
    case "VALIDATION_ERROR": return e.messages.join(" / ") || "ข้อมูลไม่ถูกต้อง";
    case "INTERNAL_ERROR": return GENERIC;
    case "UNAUTHORIZED": return e.message || "กรุณาเข้าสู่ระบบอีกครั้ง";
    case "NOT_FOUND": return e.message || "ไม่พบข้อมูลที่คุณกำลังค้นหา อาจถูกลบไปแล้วหรือลิงก์ไม่ถูกต้อง";
    default: return e.message || GENERIC; // BAD_REQUEST, FORBIDDEN, CONFLICT
  }
}
export function ForbiddenState({ hint }: { hint?: string }) {
  return <EmptyState title="ไม่มีสิทธิ์เข้าถึง" hint={hint ?? "บทบาทของคุณไม่สามารถใช้งานส่วนนี้ได้"}><Link href="/" className={secondaryButtonClass}>กลับหน้าหลัก</Link></EmptyState>;
}
export function ErrorState({ error, onRetry }: { error: ApiError; onRetry?: () => void }) {
  if (error.code === "NOT_FOUND") return <EmptyState title="ไม่พบข้อมูล" hint={errorText(error)}><Link href="/" className={secondaryButtonClass}>กลับหน้าหลัก</Link></EmptyState>;
  if (error.code === "FORBIDDEN") return <ForbiddenState hint={errorText(error)} />;
  return (
    <div role="alert" className="flex flex-col items-center gap-3 rounded-xl bg-error-container px-6 py-12 text-center text-on-error-container">
      <p className="text-body-md">{errorText(error)}</p>
      {onRetry && <button type="button" onClick={onRetry} className={primaryButtonClass}>ลองอีกครั้ง</button>}
    </div>
  );
}
