import Link from "next/link";
import { EmptyState } from "@/components/shared/States";
import { secondaryButtonClass } from "@/lib/ui";
export default function NotFound() {
  return <EmptyState title="ไม่พบหน้าที่ต้องการ" hint="ลิงก์อาจไม่ถูกต้องหรือหน้านี้ถูกลบไปแล้ว"><Link href="/" className={secondaryButtonClass}>กลับหน้าหลัก</Link></EmptyState>;
}
