/** ชุดเทสหน่วยของ backend — ไม่แตะฐานข้อมูลและไม่ต้องมี Core Hub
 *  เทสที่ต้องใช้ DB จริงอยู่ที่ src/dev/test-cron.ts (รันแยกด้วย ts-node) */
module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: 'src',
  testRegex: '.*\\.spec\\.ts$',
  transform: { '^.+\\.(t|j)s$': 'ts-jest' },
  collectCoverageFrom: ['**/*.(t|j)s'],
  coverageDirectory: '../coverage',
  testEnvironment: 'node',
};
