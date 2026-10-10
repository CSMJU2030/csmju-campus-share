import { redirect } from "next/navigation";

// หน้านี้ถูกยุบไปเป็นแท็บใน /borrow-requests แล้ว — คง path ไว้เพื่อให้ลิงก์เก่า
// บุ๊กมาร์ก และการแจ้งเตือนที่เคยส่งออกไปยังเปิดได้
export default function Page() {
  redirect("/borrow-requests?tab=notifications");
}
