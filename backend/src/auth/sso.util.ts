import { randomBytes } from 'crypto';

/** เปลี่ยน "-" เป็น "_" ตาม auth-contract.md ข้อ 5.1 (เช่น csmju-campus-share -> csmju_campus_share) */
export function cookieSafeName(subsystemName: string): string {
  return subsystemName.replace(/-/g, '_');
}

export function generateState(): string {
  return randomBytes(32).toString('base64url'); // >=32 ไบต์ ตามข้อ 5.2
}

export function encodeStateCookie(state: string, next: string): string {
  return `${state}.${Buffer.from(next, 'utf8').toString('base64url')}`;
}

export function decodeStateCookie(value: string): { state: string; next: string } | null {
  const dot = value.indexOf('.');
  if (dot === -1) return null;
  try {
    const state = value.slice(0, dot);
    const next = Buffer.from(value.slice(dot + 1), 'base64url').toString('utf8');
    return { state, next };
  } catch {
    return null;
  }
}

/** ตาม auth-contract.md ข้อ 5.2 — ตรวจครบ 5 กฎ ต้องเรียกทั้งตอน /auth/login และตอน callback */
export function isValidNext(next: string | undefined, ownOrigin: string): next is string {
  if (!next) return false;
  if (next.length < 1 || next.length > 512) return false;
  if (!next.startsWith('/') || next.startsWith('//')) return false;
  if (next.includes('\\')) return false;
  // eslint-disable-next-line no-control-regex
  if (/[\x00-\x1f\x7f]/.test(next)) return false;
  try {
    const resolved = new URL(next, ownOrigin);
    if (resolved.origin !== ownOrigin) return false;
  } catch {
    return false;
  }
  if (next === '/auth' || next.startsWith('/auth/')) return false;
  return true;
}

/** constant-time compare กัน timing attack ตอนเทียบ state */
export function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

/** Reads one cookie out of a raw `Cookie:` header without extra dependencies (ยกจาก demo sso-session.ts). */
export function readCookie(header: string | undefined, name: string): string | null {
  if (!header) return null;
  for (const part of header.split(';')) {
    const separator = part.indexOf('=');
    if (separator === -1) continue;
    if (part.slice(0, separator).trim() !== name) continue;
    const value = part.slice(separator + 1).trim();
    return value.length > 0 ? decodeURIComponent(value) : null;
  }
  return null;
}