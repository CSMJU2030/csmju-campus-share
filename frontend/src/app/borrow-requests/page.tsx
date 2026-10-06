import { Suspense } from "react";
import type { Metadata } from "next";
import { BorrowRequests } from "@/components/features/BorrowRequests";
import { Gate } from "@/components/shared/Providers";
import { LoadingState } from "@/components/shared/States";
export const metadata: Metadata = { title: "คำขอ · CampusShare · CSMJU" };
export const dynamic = "force-dynamic";
export default function Page() {
  return <Gate permission="borrow:view_mine"><Suspense fallback={<LoadingState />}><BorrowRequests /></Suspense></Gate>;
}
