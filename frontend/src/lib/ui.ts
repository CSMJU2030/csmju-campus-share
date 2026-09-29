// ชั่วคราว: แทน ui.ts ของ template (ชื่อค่าคงที่ตรงกับมาตรฐาน)
const focus = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-container disabled:cursor-not-allowed disabled:opacity-40";
const btn = `inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-label-md ${focus}`;
export const primaryButtonClass = `${btn} btn-gradient text-white shadow-md`;
export const secondaryButtonClass = `${btn} border border-outline-variant text-on-surface-variant hover:bg-surface-variant/50`;
export const dangerButtonClass = `${btn} bg-error text-white hover:opacity-90`;
export const inputClass = "w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2.5 text-body-md focus-visible:outline-2 focus-visible:outline-accent aria-[invalid=true]:border-error";
export const cardClass = "overflow-hidden rounded-xl border border-outline-variant/40 bg-surface-container-lowest shadow-sm";
