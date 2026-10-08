"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { ListingForm } from "@/components/features/ListingForm";

export function ListingCreateDialog() {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const router = useRouter();

  function close() {
    router.back();
  }

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog || dialog.open) return;

    // Native modal dialogs trap focus, close on Escape, and restore focus on close.
    dialog.showModal();
    return () => {
      if (dialog.open) dialog.close();
    };
  }, []);

  return (
    <dialog
      ref={dialogRef}
      aria-modal="true"
      aria-labelledby="listing-create-dialog-title"
      onCancel={(event) => {
        event.preventDefault();
        close();
      }}
      className="m-auto max-h-[calc(100dvh-2rem)] w-[calc(100vw-2rem)] max-w-md overflow-y-auto border-0 bg-surface-container-lowest p-0 text-on-surface shadow-xl backdrop:bg-black/40"
    >
      <div className="relative p-6">
        <button
          type="button"
          aria-label="ปิดหน้าต่างลงของ"
          onClick={close}
          className="absolute right-4 top-4 inline-flex h-11 w-11 items-center justify-center rounded-lg text-on-surface-variant transition-colors hover:bg-surface-variant focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-container"
        >
          <span aria-hidden="true">×</span>
        </button>
        <ListingForm embedded onCancel={close} />
      </div>
    </dialog>
  );
}
