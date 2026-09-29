import type { Metadata } from "next";
import { ListingDetail } from "@/components/features/ListingDetail";
export const metadata: Metadata = { title: "รายละเอียดประกาศ · CampusShare · CSMJU" };
export const dynamic = "force-dynamic";
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ListingDetail id={id} />;
}
