import {
  cookieSafeName, decodeStateCookie, encodeStateCookie, generateState, isValidNext, readCookie, timingSafeEqual,
} from './sso.util';

const ORIGIN = 'http://localhost:3003';

// auth-contract.md ข้อ 5.2 — กฎของ next ครบ 5 ข้อ กัน open redirect
describe('isValidNext', () => {
  it.each<[string]>([['/'], ['/my-listings'], ['/listings/abc?tab=owner']])(
    'ยอมรับ path ภายใน: %s',
    (next) => {
      expect(isValidNext(next, ORIGIN)).toBe(true);
    },
  );

  it.each<[string, string]>([
    ['https://evil.com', 'absolute URL ข้าม origin'],
    ['//evil.com', 'protocol-relative'],
    ['/\\evil.com', 'backslash ที่เบราว์เซอร์มองเป็น //'],
    ['not-a-path', 'ไม่ขึ้นต้นด้วย /'],
    ['/auth', 'path ของ auth เอง (กันวน)'],
    ['/auth/callback', 'path ใต้ /auth/'],
    ['/x\u0000y', 'มีอักขระควบคุม'],
    ['', 'ค่าว่าง'],
  ])('ปฏิเสธ %s — %s', (next) => {
    expect(isValidNext(next, ORIGIN)).toBe(false);
  });

  it('ปฏิเสธ next ที่ยาวเกิน 512 ตัวอักษร', () => {
    expect(isValidNext('/' + 'a'.repeat(512), ORIGIN)).toBe(false);
  });

  it('ปฏิเสธ undefined', () => {
    expect(isValidNext(undefined, ORIGIN)).toBe(false);
  });
});

describe('state cookie', () => {
  it('state สุ่มอย่างน้อย 32 ไบต์ และไม่ซ้ำ', () => {
    const a = generateState();
    const b = generateState();
    expect(a).not.toBe(b);
    expect(Buffer.from(a, 'base64url').length).toBeGreaterThanOrEqual(32);
  });

  it('encode แล้ว decode กลับได้เหมือนเดิม', () => {
    const decoded = decodeStateCookie(encodeStateCookie('st4te', '/listings/abc?x=1'));
    expect(decoded).toEqual({ state: 'st4te', next: '/listings/abc?x=1' });
  });

  it('คุกกี้ที่ไม่มีตัวคั่นถือว่าใช้ไม่ได้', () => {
    expect(decodeStateCookie('ไม่มีจุดคั่น')).toBeNull();
  });
});

describe('timingSafeEqual', () => {
  it('ตรงกันเมื่อค่าเท่ากัน และไม่ตรงเมื่อต่างกันแม้ยาวเท่ากัน', () => {
    expect(timingSafeEqual('abc123', 'abc123')).toBe(true);
    expect(timingSafeEqual('abc123', 'abc124')).toBe(false);
    expect(timingSafeEqual('abc', 'abcd')).toBe(false);
  });
});

describe('cookieSafeName', () => {
  it('เปลี่ยน - เป็น _ ตามข้อ 5.1', () => {
    expect(cookieSafeName('csmju-campus-share')).toBe('csmju_campus_share');
  });
});

describe('readCookie', () => {
  it('อ่านเฉพาะคุกกี้ที่ชื่อตรงเป๊ะ', () => {
    const header = 'other=1; csmju_campus_share_access_token=tok123; another=2';
    expect(readCookie(header, 'csmju_campus_share_access_token')).toBe('tok123');
    expect(readCookie(header, 'campus_share_access_token')).toBeNull();
    expect(readCookie(undefined, 'anything')).toBeNull();
  });
});
