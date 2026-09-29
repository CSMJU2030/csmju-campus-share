import type { Metadata } from "next";
import { Marketplace } from "@/components/features/Marketplace";
export const metadata: Metadata = { title: "ตลาดสิ่งของ · CampusShare · CSMJU" };
export default function Page() { return <Marketplace />; }
