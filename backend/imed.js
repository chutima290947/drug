// ตัวตรวจรหัสพนักงาน + รหัสผ่านกับ iMed
// ตอนนี้เป็นโหมดจำลอง (mock) สำหรับทำหน้า UI: รหัสพนักงานอะไรก็ได้ + รหัสผ่านทดสอบตัวเดียวจาก .env (IMED_MOCK_PASSWORD)
const crypto = require('crypto')

const provider = (process.env.IMED_PROVIDER || 'mock').toLowerCase()
const MOCK_PASSWORD = process.env.IMED_MOCK_PASSWORD || ''

if (provider === 'mock') {
  if (process.env.NODE_ENV === 'production') {
    console.error('❌ ห้ามใช้โหมดจำลอง iMed (IMED_PROVIDER=mock) บนระบบจริง')
    process.exit(1)
  }
  if (MOCK_PASSWORD.length < 4) {
    console.error('❌ โหมดจำลอง iMed ต้องตั้ง IMED_MOCK_PASSWORD ใน .env (อย่างน้อย 4 ตัวอักษร)')
    process.exit(1)
  }
  console.warn('⚠️  โหมดจำลอง iMed: รหัสพนักงานใดก็ได้ล็อกอินได้ด้วยรหัสผ่านทดสอบ — ใช้ตอนพัฒนาเท่านั้น')
}

const same = (a, b) => {
  const h = (s) => crypto.createHash('sha256').update(String(s)).digest()
  return crypto.timingSafeEqual(h(a), h(b))
}

// TODO(iMed จริง): ส่ง code/password ไปตรวจกับ iMed (API / SSO / LDAP ตามที่ฝ่าย IT ให้ข้อมูล)
// คืน { name } เมื่อถูกต้อง (name = ชื่อพนักงานจาก iMed), คืน null เมื่อรหัสไม่ถูกต้อง, throw เมื่อเชื่อมต่อ iMed ไม่ได้
async function verifyReal(_code, _password) {
  throw new Error('ยังไม่ได้เชื่อมต่อ iMed จริง — แก้ฟังก์ชัน verifyReal ใน imed.js')
}

async function verify(code, password) {
  if (provider === 'mock') return same(password, MOCK_PASSWORD) ? { name: `พนักงาน ${code}` } : null
  return verifyReal(code, password)
}

module.exports = { verify, provider }