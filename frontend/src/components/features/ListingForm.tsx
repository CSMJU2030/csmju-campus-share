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

type Field = "title" | "description" | "category" | "listingType";
type TextField = Exclude<Field, "listingType">;
// listingType ต้องมีชนิดเป็น ListingType ไม่ใช่ string — ไม่งั้น typecheck จับค่าเพี้ยนไม่ได้
type FormState = { title: string; description: string; category: string; listingType: ListingType };
const cats = Object.entries(CATEGORY_LABEL);
const types = Object.entries(LISTING_TYPE_LABEL);
const isListingType = (x: string): x is ListingType => Object.prototype.hasOwnProperty.call(LISTING_TYPE_LABEL, x);

// ฟอร์มนี้มีเฉพาะ "ลงของใหม่" — การแก้ไขอยู่ในหน้ารายละเอียด (PATCH /listings/:id)
// ห้ามใส่ค่าเริ่มต้นเป็นตัวพิมพ์เล็ก: React เลือก <option> แรกให้เองโดยไม่ยิง onChange
// (react-dom updateOptions) หน้าจอจะดูถูกแต่ค่าที่ส่งผิด -> backend ตอบ 400
type ListingFormProps = { embedded?: boolean; onCancel?: () => void };

export function ListingForm({ embedded = false, onCancel }: ListingFormProps) {
  const router = useRouter();
  const [v, setV] = useState<FormState>({ title: "", description: "", category: "", listingType: "BORROW" });
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});
  const [formErr, setFormErr] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const on = (k: TextField) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setV((p) => ({ ...p, [k]: e.target.value }));
  const onType = (e: React.ChangeEvent<HTMLSelectElement>) => setV((p) => ({ ...p, listingType: isListingType(e.target.value) ? e.target.value : p.listingType }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const er: Partial<Record<Field, string>> = {};
    if (!v.title.trim()) er.title = "กรุณาระบุชื่อสิ่งของ";
    if (!v.category) er.category = "กรุณาเลือกหมวดหมู่";
    if (!isListingType(v.listingType)) er.listingType = "กรุณาเลือกประเภท";
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
    <form onSubmit={submit} noValidate className={embedded ? "space-y-4" : `${cardClass} mx-auto max-w-2xl space-y-4 p-6`}>
      <h1 id={embedded ? "listing-create-dialog-title" : undefined} className={`${embedded ? "pr-12 " : ""}font-display text-headline-md md:text-headline-lg`}>ลงของ</h1>
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
      <FormField label="ประเภท" required error={errors.listingType}>
        <select {...bad("listingType")} value={v.listingType} onChange={onType}>{types.map(([k, t]) => <option key={k} value={k}>{t}</option>)}</select>
      </FormField>
      {formErr.length > 0 && <ul role="alert" className="list-inside list-disc rounded-lg bg-error-container px-4 py-3 text-label-sm text-on-error-container">{formErr.map((m) => <li key={m}>{m}</li>)}</ul>}
      <div className="flex justify-end gap-3 pt-2">
        {onCancel ? <button type="button" className={secondaryButtonClass} onClick={onCancel}>ยกเลิก</button> : <Link href="/" className={secondaryButtonClass}>ยกเลิก</Link>}
        <button type="submit" className={primaryButtonClass} disabled={busy || cats.length === 0} aria-busy={busy}>ลงของ</button>
      </div>
    </form>
  );
}
