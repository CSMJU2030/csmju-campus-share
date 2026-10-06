import type { Metadata } from "next";
import { AdminDashboard } from "@/components/features/AdminDashboard";
import { Gate } from "@/components/shared/Providers";
export const metadata: Metadata = { title: "ผู้ดูแลระบบ · CampusShare · CSMJU" };
export const dynamic = "force-dynamic";
export default function Page() { return <Gate permission="admin:access"><AdminDashboard /></Gate>; }
