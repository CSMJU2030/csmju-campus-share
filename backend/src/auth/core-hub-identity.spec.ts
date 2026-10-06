import { SubsystemRole, mapCoreRole } from './core-hub-identity';

// authorization.md ข้อ 2: core role มี 6 ค่าปิด · ข้อ 3: role ที่ไม่มีในตาราง -> 403 (ไม่ใช่ 401)
describe('mapCoreRole', () => {
  it('แมป core role ที่ระบบนี้รับ', () => {
    expect(mapCoreRole('student')).toBe(SubsystemRole.STUDENT);
    expect(mapCoreRole('alumni')).toBe(SubsystemRole.ALUMNI);
    expect(mapCoreRole('lecturer')).toBe(SubsystemRole.LECTURER);
    expect(mapCoreRole('staff')).toBe(SubsystemRole.STAFF);
    expect(mapCoreRole('admin')).toBe(SubsystemRole.ADMIN);
  });

  it('ไม่สนตัวพิมพ์เล็กใหญ่', () => {
    expect(mapCoreRole('STUDENT')).toBe(SubsystemRole.STUDENT);
  });

  it('role ที่ไม่รู้จักหรือไม่มีค่า -> undefined (guard จะตอบ 403)', () => {
    expect(mapCoreRole('superuser')).toBeUndefined();
    expect(mapCoreRole(undefined)).toBeUndefined();
    expect(mapCoreRole('')).toBeUndefined();
  });

  // guest = ผู้เยี่ยมชม ไม่ใช่คนในสาขา จึงจงใจไม่ใส่ในตาราง -> 403 (authorization.md ข้อ 3)
  it('guest ไม่อยู่ในตารางโดยเจตนา -> 403', () => {
    expect(mapCoreRole('guest')).toBeUndefined();
  });
});
