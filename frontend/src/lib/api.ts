// ชั้น API กลางไฟล์เดียว: ทุกหน้าต้องเรียก backend ผ่านไฟล์นี้เท่านั้น (ห้าม fetch กระจัดกระจาย)
// - ใช้ cookie HttpOnly เท่านั้น (credentials: same-origin) ไม่แตะ token ไม่ใส่ Authorization เอง
// - จัดการ casing ที่นี่: body ของ listings/borrow-requests = snake_case, reports = camelCase, query = camelCase
import type {
  AdminStats, BorrowRequest, Envelope, ErrorCode, Listing, ListingCategory, ListingStatus, ListingType, Me, Meta,
  Notification, Report, ReportTargetType,
} from "@/types";

export class ApiError extends Error {
  constructor(public code: ErrorCode, message: string, public details: unknown = [], public status = 0) { super(message); }
  /** details ของ VALIDATION_ERROR (array ของข้อความ) */
  get messages(): string[] { return Array.isArray(this.details) ? this.details.filter((d): d is string => typeof d === "string") : []; }
}
export const toApiError = (e: unknown) => (e instanceof ApiError ? e : new ApiError("INTERNAL_ERROR", "ระบบขัดข้องชั่วคราว"));

// ---------- login ----------
// กฎของ next ตาม backend: ขึ้นต้น "/", ≤512 ตัวอักษร, ไม่ขึ้นต้น "//", ไม่มี "\", ไม่ใช่ /auth หรือ /auth/...
export function safeNext(next: string): string {
  const bad = !next.startsWith("/") || next.length > 512 || next.startsWith("//") || next.includes("\\") || next === "/auth" || next.startsWith("/auth/");
  return bad ? "/" : next;
}
export const loginUrl = (next: string) => `/auth/login?next=${encodeURIComponent(safeNext(next))}`;

// กันวนลูป SSO ตาม auth-contract.md ข้อ 7: เพิ่งกลับจาก login ไม่ถึง 30 วินาทีแล้วยังได้ 401 อีก
// = Core Hub ล่ม / role mapping ไม่ผ่าน / คุกกี้ตั้งไม่ติด → ห้าม redirect ซ้ำ ให้ขึ้นปุ่มแทน
//
// เก็บใน "คุกกี้ธรรมดา" เท่านั้น — aie-workflow.md ขั้น 7 (SEC-03) ห้ามใช้ web storage API
// กับเรื่อง auth · ค่าที่เก็บเป็นแค่ timestamp ไม่ใช่ token และไม่มีข้อมูลผู้ใช้
// ต้องข้าม full-page redirect ไป Core Hub จึงเก็บในตัวแปรไม่ได้ · หมดอายุเองใน 30 วินาที
const SSO_ATTEMPT_COOKIE = "campusshare_sso_attempt";
const SSO_LOOP_WINDOW_MS = 30_000;

function readBrowserCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  for (const part of document.cookie.split(";")) {
    const i = part.indexOf("=");
    if (i === -1) continue;
    if (part.slice(0, i).trim() !== name) continue;
    return decodeURIComponent(part.slice(i + 1).trim());
  }
  return null;
}

export function ssoLoopDetected(): boolean {
  const at = Number(readBrowserCookie(SSO_ATTEMPT_COOKIE) ?? 0);
  return at > 0 && Date.now() - at < SSO_LOOP_WINDOW_MS;
}

/** @returns true = กำลังพาไป login แล้ว · false = ตรวจพบลูป ผู้เรียกต้องแสดงปุ่มเอง */
export function goLogin(): boolean {
  if (typeof window === "undefined" || ssoLoopDetected()) return false;
  document.cookie = `${SSO_ATTEMPT_COOKIE}=${Date.now()}; Path=/; Max-Age=${SSO_LOOP_WINDOW_MS / 1000}; SameSite=Lax`;
  window.location.href = loginUrl(window.location.pathname + window.location.search);
  return true;
}

/** เรียกเมื่อ /me สำเร็จ — ล้างตัวนับกันลูป */
export function clearSsoLoopGuard(): void {
  if (typeof document === "undefined") return;
  document.cookie = `${SSO_ATTEMPT_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`;
}

// ---------- core ----------
type Query = Record<string, string | number | undefined>;
interface Opt { method?: string; query?: Query; body?: unknown; guest?: boolean }

const codeFromStatus = (s: number): ErrorCode =>
  s === 400 ? "BAD_REQUEST" : s === 401 ? "UNAUTHORIZED" : s === 403 ? "FORBIDDEN" : s === 404 ? "NOT_FOUND" : s === 409 ? "CONFLICT" : "INTERNAL_ERROR";

async function request<T>(path: string, o: Opt = {}): Promise<{ data: T; meta?: Meta }> {
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(o.query ?? {})) if (v !== undefined && v !== "") qs.set(k, String(v));
  const hasBody = o.body !== undefined;
  let res: Response;
  try {
    res = await fetch(`/api/v1${path}${qs.size ? `?${qs}` : ""}`, {
      method: o.method ?? "GET", credentials: "same-origin", cache: "no-store",
      headers: hasBody ? { "Content-Type": "application/json" } : undefined,
      body: hasBody ? JSON.stringify(o.body) : undefined,
    });
  } catch { throw new ApiError("INTERNAL_ERROR", "เชื่อมต่อเซิร์ฟเวอร์ไม่ได้"); }

  let json: Envelope<T> | null = null;
  try { json = (await res.json()) as Envelope<T>; } catch { /* ไม่ใช่ JSON */ }
  if (json && json.success) return { data: json.data, meta: json.meta };

  const err = json && !json.success ? json.error : null;
  // 401 (ไม่มี token / token หมดอายุ) → พาไป login แล้วกลับมาที่เดิม
  // guest: true = ผู้เรียกจัดการ 401 เอง (มีแค่ /me ที่ใช้ตรวจว่า login อยู่ไหม)
  if (res.status === 401 && !o.guest && goLogin()) return new Promise<never>(() => {});
  throw new ApiError(err?.code ?? codeFromStatus(res.status), err?.message ?? "", err?.details ?? [], res.status);
}
const get = async <T,>(path: string, o?: Opt) => (await request<T>(path, o)).data;

// ---------- endpoints ----------
export interface ListingQuery { category?: ListingCategory; listingType?: ListingType | ""; status?: ListingStatus | ""; q?: string; page?: number; limit?: number }
export interface CreateListingInput { title: string; description?: string; category: ListingCategory; listingType: ListingType }
/** PATCH /listings/:id — partial update: ส่งเฉพาะฟิลด์ที่ต้องการเปลี่ยน (api-conventions.md ข้อ 4) */
export interface UpdateListingInput { title?: string; description?: string; category?: ListingCategory; status?: "AVAILABLE" | "UNAVAILABLE" }
export interface RespondInput { status: "APPROVED" | "REJECTED" | "RETURNED"; responseMessage?: string; dueDate?: string }

/** วันที่ (yyyy-mm-dd) → ISO สิ้นวันตามเวลาไทย สำหรับ dueDate */
export const endOfDayIso = (date: string) => new Date(`${date}T23:59:59+07:00`).toISOString();

export const api = {
  me: () => get<Me>("/me", { guest: true }), // 401 = ผู้เยี่ยมชม, 403 = บัญชีไม่มีสิทธิ์ (ผู้เรียกจัดการเอง)

  // Listings
  async listListings(q: ListingQuery) {
    const r = await request<Listing[]>("/listings", { query: { ...q } });
    return { data: r.data, meta: r.meta as Meta };
  },
  getListing: (id: string) => get<Listing>(`/listings/${encodeURIComponent(id)}`),
  createListing: (i: CreateListingInput) =>
    get<Listing>("/listings", { method: "POST", body: { title: i.title, description: i.description || undefined, category: i.category, listingType: i.listingType } }),
  updateListing: (id: string, i: UpdateListingInput) =>
    get<Listing>(`/listings/${encodeURIComponent(id)}`, { method: "PATCH", body: { ...i } }),
  setListingStatus: (id: string, status: "AVAILABLE" | "UNAVAILABLE") =>
    api.updateListing(id, { status }),
  /** ไม่มี endpoint "ของฉัน": ดึง limit=100 วนทุกหน้าแล้วกรอง ownerCoreUserId ฝั่ง client
   *  (ไม่ส่ง status = backend ซ่อน ARCHIVED ให้เอง; ส่ง status=ARCHIVED เพื่อดูของที่เก็บถาวร) */
  async listMyListings(ownerId: string, q: Omit<ListingQuery, "page" | "limit">) {
    const out: Listing[] = [];
    for (let page = 1; page <= 50; page++) {
      const { data, meta } = await api.listListings({ ...q, page, limit: 100 });
      out.push(...data.filter((l) => l.ownerCoreUserId === ownerId));
      if (page >= meta.totalPages) break;
    }
    return out;
  },

  // Borrow requests
  createBorrowRequest: (listingId: string, message?: string) =>
    get<BorrowRequest>("/borrow-requests", { method: "POST", body: { listingId, message: message?.trim() || undefined } }),
  /** คืน array เดียวทั้งที่เราขอและที่เข้ามาหาของเรา — หน้าเว็บแยกสองฝั่งเองจาก requesterCoreUserId */
  myBorrowRequests: () => get<BorrowRequest[]>("/borrow-requests/mine", { query: { limit: 100 } }),
  respondBorrowRequest: (id: string, i: RespondInput) =>
    get<BorrowRequest>(`/borrow-requests/${encodeURIComponent(id)}`, {
      method: "PATCH", body: { status: i.status, responseMessage: i.responseMessage?.trim() || undefined, dueDate: i.dueDate || undefined },
    }),

  // Notifications — ขอ limit สูงสุดเพื่อให้ตัวเลข unread ที่นับฝั่ง client ครบ
  // guest: true = เป็นการเรียกเบื้องหลัง ไม่บังคับ redirect ไป login ระหว่างอยู่หน้าสาธารณะ
  notifications: () => get<Notification[]>("/notifications", { guest: true, query: { limit: 100 } }),
  markNotificationRead: (id: string) => get<{ id: string; isRead: true }>(`/notifications/${encodeURIComponent(id)}`, { method: "PATCH" }),

  // Reports (body เป็น camelCase)
  createReport: (i: { targetType: ReportTargetType; targetId: string; reason: string }) => get<Report>("/reports", { method: "POST", body: i }),

  // Admin (STAFF/ADMIN)
  adminStats: () => get<AdminStats>("/admin/stats"),
  adminReports: () => get<Report[]>("/admin/reports", { query: { limit: 100 } }),
  resolveReport: (id: string, note?: string) => get<Report>(`/admin/reports/${encodeURIComponent(id)}`, { method: "PATCH", body: { note: note?.trim() || undefined } }),
  adminOverdue: () => get<BorrowRequest[]>("/admin/overdue-requests", { query: { limit: 100 } }),
};
