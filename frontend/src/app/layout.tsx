import type { Metadata } from "next";
import { Noto_Sans_Thai, Plus_Jakarta_Sans } from "next/font/google";
import { AppFrame } from "@/components/shared/AppFrame";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({ variable: "--font-jakarta", subsets: ["latin"], weight: ["400", "600", "700", "800"] });
const noto = Noto_Sans_Thai({ variable: "--font-noto-thai", subsets: ["latin", "thai"], weight: ["400", "500", "600", "700"] });
// standards 1.7.3 ข้อ 5.1 — ปุ่ม "กลับ CSMJU Portal" ใน CsmjuAppShell
// อ่านที่นี่เพราะ layout เป็น server component · ห้าม hardcode · ไม่ตั้ง = ไม่แสดงปุ่ม
const CORE_HUB_WEB_URL = process.env.CORE_HUB_WEB_URL;

export const metadata: Metadata = { title: "CampusShare · CSMJU" };

export default function RootLayout({ children, modal }: { children: React.ReactNode; modal: React.ReactNode }) {
  return (
    <html lang="th" className={`${jakarta.variable} ${noto.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col bg-background text-on-surface">
        <AppFrame coreHubUrl={CORE_HUB_WEB_URL}>
          {children}
          {modal}
        </AppFrame>
      </body>
    </html>
  );
}
