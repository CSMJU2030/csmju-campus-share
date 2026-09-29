import { LISTING_STATUS_LABEL, LISTING_TYPE_LABEL, REQUEST_STATUS_LABEL, label } from "@/lib/labels";

type Tone = readonly [string, string];
const grey: Tone = ["bg-surface-variant text-on-surface-variant", "bg-outline"];
const green: Tone = ["bg-success/10 text-emerald-700", "bg-success"];
const amber: Tone = ["bg-amber-100 text-amber-800", "bg-amber-500"];
const blue: Tone = ["bg-primary-container/10 text-primary-container", "bg-primary-container"];
const red: Tone = ["bg-error-container text-on-error-container", "bg-error"];

const LISTING_TONE: Record<string, Tone> = {
  AVAILABLE: green, PENDING: amber, BORROWED: blue, GIVEN_AWAY: blue, UNAVAILABLE: grey, ARCHIVED: grey,
};
const REQUEST_TONE: Record<string, Tone> = {
  PENDING: amber, APPROVED: green, REJECTED: grey, RETURNED: blue, EXPIRED: grey, OVERDUE: red,
};

function Pill({ tone, text }: { tone: Tone; text: string }) {
  return <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-label-sm ${tone[0]}`}><span aria-hidden="true" className={`h-2 w-2 rounded-full ${tone[1]}`} />{text}</span>;
}
export const StatusBadge = ({ status }: { status: string }) => <Pill tone={LISTING_TONE[status] ?? grey} text={label(LISTING_STATUS_LABEL, status)} />;
export const RequestStatusBadge = ({ status }: { status: string }) => <Pill tone={REQUEST_TONE[status] ?? grey} text={label(REQUEST_STATUS_LABEL, status)} />;
export function TypeBadge({ type }: { type: string }) {
  return <span className="inline-flex rounded-full bg-primary-container/10 px-2.5 py-1 text-label-sm text-primary-container">{label(LISTING_TYPE_LABEL, type)}</span>;
}
