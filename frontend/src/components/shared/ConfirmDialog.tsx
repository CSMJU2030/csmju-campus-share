"use client";
import { useEffect, useRef } from "react";
import { dangerButtonClass, secondaryButtonClass } from "@/lib/ui";

interface Props { open: boolean; title: string; body: string; confirmLabel: string; busy?: boolean; onConfirm: () => void; onCancel: () => void }
export function ConfirmDialog({ open, title, body, confirmLabel, busy, onConfirm, onCancel }: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);
  return (
    <dialog ref={ref} onCancel={onCancel} aria-labelledby="dlg-title" className="m-auto w-11/12 max-w-md rounded-xl bg-surface-container-lowest p-6 shadow-xl backdrop:bg-black/40">
      <h2 id="dlg-title" className="font-display text-headline-md">{title}</h2>
      <p className="mt-3 text-body-md text-on-surface-variant">{body}</p>
      <div className="mt-6 flex justify-end gap-3">
        <button type="button" className={secondaryButtonClass} onClick={onCancel}>ยกเลิก</button>
        <button type="button" className={dangerButtonClass} onClick={onConfirm} disabled={busy} aria-busy={busy}>{confirmLabel}</button>
      </div>
    </dialog>
  );
}
