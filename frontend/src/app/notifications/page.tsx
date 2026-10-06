import type { Metadata } from "next";
import { NotificationList } from "@/components/features/NotificationList";
import { Gate } from "@/components/shared/Providers";
export const metadata: Metadata = { title: "การแจ้งเตือน · CampusShare · CSMJU" };
export const dynamic = "force-dynamic";
export default function Page() { return <Gate permission="notification:view_mine"><NotificationList /></Gate>; }
