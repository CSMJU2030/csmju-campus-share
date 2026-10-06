import type { Metadata } from "next";
import { Marketplace } from "@/components/features/Marketplace";
import { Gate } from "@/components/shared/Providers";
export const metadata: Metadata = { title: "ของของฉัน · CampusShare · CSMJU" };
export const dynamic = "force-dynamic";
export default function Page() { return <Gate permission="listing:view"><Marketplace mine /></Gate>; }
