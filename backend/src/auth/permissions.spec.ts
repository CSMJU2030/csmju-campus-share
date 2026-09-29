import { SubsystemRole } from './core-hub-identity';
import { Permission, ROLE_PERMISSIONS, can, canAny } from './permissions';

// authorization.md ข้อ 6: เมทริกซ์สิทธิ์ต้องเขียนไว้ที่เดียว (permissions.ts)
// และต้องมีเทสของเคส 403 อย่างน้อยหนึ่งเคส
describe('เมทริกซ์สิทธิ์ (Layer 2)', () => {
  it('STUDENT ลงของและขอยืมได้ แต่เข้าหน้าผู้ดูแลไม่ได้', () => {
    expect(can(SubsystemRole.STUDENT, Permission.LISTING_CREATE)).toBe(true);
    expect(can(SubsystemRole.STUDENT, Permission.BORROW_REQUEST_CREATE)).toBe(true);
    // เคส 403 ที่ authorization.md บังคับให้มี
    expect(can(SubsystemRole.STUDENT, Permission.ADMIN_ACCESS)).toBe(false);
  });

  it('ALUMNI ดูได้อย่างเดียว — ลงของ ขอยืม และรายงานไม่ได้', () => {
    expect(can(SubsystemRole.ALUMNI, Permission.LISTING_READ)).toBe(true);
    expect(can(SubsystemRole.ALUMNI, Permission.LISTING_CREATE)).toBe(false);
    expect(can(SubsystemRole.ALUMNI, Permission.BORROW_REQUEST_CREATE)).toBe(false);
    expect(can(SubsystemRole.ALUMNI, Permission.REPORT_CREATE)).toBe(false);
    expect(can(SubsystemRole.ALUMNI, Permission.ADMIN_ACCESS)).toBe(false);
  });

  it('LECTURER ทำได้เท่า STUDENT แต่ไม่ได้เป็นผู้ดูแลโดยอัตโนมัติ', () => {
    for (const permission of ROLE_PERMISSIONS[SubsystemRole.STUDENT]) {
      expect(can(SubsystemRole.LECTURER, permission)).toBe(true);
    }
    // อาจารย์ไม่ใช่ admin สาขาโดยตำแหน่ง — ขอบเขตระบุแค่ staff -> admin
    expect(can(SubsystemRole.LECTURER, Permission.ADMIN_ACCESS)).toBe(false);
  });

  it('STAFF ทำได้เท่า STUDENT บวกสิทธิ์ผู้ดูแล (admin โดยตำแหน่ง ไม่ใช่โดยตัวบุคคล)', () => {
    for (const permission of ROLE_PERMISSIONS[SubsystemRole.STUDENT]) {
      expect(can(SubsystemRole.STAFF, permission)).toBe(true);
    }
    expect(can(SubsystemRole.STAFF, Permission.ADMIN_ACCESS)).toBe(true);
  });

  it('ADMIN มีครบทุกสิทธิ์ที่นิยามไว้', () => {
    for (const permission of Object.values(Permission)) {
      expect(can(SubsystemRole.ADMIN, permission)).toBe(true);
    }
  });

  it('canAny ผ่านเมื่อมีอย่างน้อยหนึ่งสิทธิ์', () => {
    expect(canAny(SubsystemRole.ALUMNI, [Permission.ADMIN_ACCESS, Permission.LISTING_READ])).toBe(true);
    expect(canAny(SubsystemRole.ALUMNI, [Permission.ADMIN_ACCESS, Permission.LISTING_CREATE])).toBe(false);
  });

  it('ตารางสิทธิ์ถูก freeze — แก้ตอน runtime ไม่ได้', () => {
    expect(Object.isFrozen(ROLE_PERMISSIONS)).toBe(true);
    expect(Object.isFrozen(ROLE_PERMISSIONS[SubsystemRole.ALUMNI])).toBe(true);
  });
});
