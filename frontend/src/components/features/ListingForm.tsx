"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormField } from "@/components/shared/FormField";
import { errorText } from "@/components/shared/States";
import { ApiError, api, toApiError } from "@/lib/api";
import { CATEGORY_LABEL, LISTING_TYPE_LABEL } from "@/lib/labels";
import { cardClass, inputClass, primaryButtonClass, secondaryButtonClass } from "@/lib/ui";
import type { ListingType } from "@/types";

type Field = "title" | "description" | "category";
const cats = Object.entries(CATEGORY_LABEL);

// backend ไม่มี endpoint แก้ไข/ลบ listing → ฟอร์มนี้มีเฉพาะ "ลงของใหม่"
export function ListingForm() {
  const router = useRouter();
  const [v, setV] = useState({ title: "", description: "", category: "", listingType: "borrow" as ListingType });
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});
  const [formErr, setFormErr] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const on = (k: keyof typeof v) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setV((p) => ({ ...p, [k]: e.target.value }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const er: Partial<Record<Field, string>> = {};
    if (!v.title.trim()) er.title = "กรุณาระบุชื่อสิ่งของ";
    if (!v.category) er.category = "กรุณาเลือกหมวดหมู่";
    setErrors(er);
    if (Object.keys(er).length) { setTimeout(() => document.querySelector<HTMLElement>("[aria-invalid=true]")?.focus(), 0); return; }
    setBusy(true); setFormErr([]);
    try {
      const r = await api.createListing({ title: v.title.trim(), description: v.description.trim(), category: v.category, listingType: v.listingType });
      router.push(`/listings/${r.id}`);
    } catch (x) {
      const a: ApiError = toApiError(x);
      setFormErr(a.messages.length ? a.messages : [errorText(a)]); // VALIDATION_ERROR: แสดง details
      setBusy(false);
    }
  }
  const bad = (k: Field) => ({ "aria-invalid": !!errors[k], className: inputClass });
  return (
    <form onSubmit={submit} noValidate className={`${cardClass} max-w-2xl space-y-4 p-6`}>
      <h1 className="font-display text-headline-md md:text-headline-lg">ลงของ</h1>
      <p className="text-body-md text-on-surface-variant">ช่องที่มี * จำเป็นต้องกรอก</p>
      <FormField label="ชื่อสิ่งของ" required error={errors.title}><input {...bad("title")} maxLength={120} value={v.title} onChange={on("title")} /></FormField>
      <FormField label="รายละเอียด"><textarea rows={4} className={inputClass} maxLength={1000} value={v.description} onChange={on("description")} /></FormField>
      {cats.length === 0 ? (
        <p role="alert" className="rounded-lg bg-error-container px-4 py-3 text-label-sm text-on-error-container">ยังไม่ได้ตั้งค่ารายการหมวดหมู่ (CATEGORY_LABEL ใน lib/labels.ts) จึงลงของไม่ได้</p>
      ) : (
        <FormField label="หมวดหมู่" required error={errors.category}>
          <select {...bad("category")} value={v.category} onChange={on("category")}><option value="">เลือกหมวดหมู่</option>{cats.map(([k, t]) => <option key={k} value={k}>{t}</option>)}</select>
        </FormField>
      )}
      <FormField label="ประเภท" required>
        <select className={inputClass} value={v.listingType} onChange={on("listingType")}>{Object.entries(LISTING_TYPE_LABEL).map(([k, t]) => <option key={k} value={k}>{t}</option>)}</select>
      </FormField>
      {formErr.length > 0 && <ul role="alert" className="list-inside list-disc rounded-lg bg-error-container px-4 py-3 text-label-sm text-on-error-container">{formErr.map((m) => <li key={m}>{m}</li>)}</ul>}
      <div className="flex justify-end gap-3 pt-2">
        <Link href="/" className={secondaryButtonClass}>ยกเลิก</Link>
        <button type="submit" className={primaryButtonClass} disabled={busy || cats.length === 0} aria-busy={busy}>ลงของ</button>
      </div>
    </form>
  );
}
