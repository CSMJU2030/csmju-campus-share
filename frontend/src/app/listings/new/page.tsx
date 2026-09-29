import type { Metadata } from "next";
import { ListingForm } from "@/components/features/ListingForm";
import { Gate } from "@/components/shared/Providers";
export const metadata: Metadata = { title: "ลงของ · CampusShare · CSMJU" };
export default function Page() { return <Gate permission="listing:create"><ListingForm /></Gate>; }
