// ตั้งบทบาทของรหัสพนักงาน (ใช้กำหนดผู้ดูแลระบบ) — ไม่มีรหัสผ่าน เพราะล็อกอินด้วยรหัสผ่าน iMed
// คนทั่วไปไม่ต้องรันคำสั่งนี้ แค่ล็อกอินครั้งแรก ระบบจะบันทึกชื่อให้เอง
// วิธีใช้:  npm run create-user -- <รหัสพนักงาน> "<ชื่อที่แสดง>" [admin|user]
// ตัวอย่าง: npm run create-user -- 12345 "ภก.สมชาย ใจดี" admin
require('dotenv').config()
const pool = require('../db')

;(async () => {
  const [username, display, role = 'user'] = process.argv.slice(2)
  if (!username || !display || !['admin', 'user'].includes(role)) {
    console.error('วิธีใช้: npm run create-user -- <รหัสพนักงาน> "<ชื่อที่แสดง>" [admin|user]')
    process.exit(1)
  }
  const code = username.trim().toLowerCase()
  if (!/^[a-z0-9._-]{2,32}$/.test(code)) { console.error('รหัสพนักงานใช้ได้เฉพาะ a-z 0-9 . _ - ความยาว 2-32 ตัวอักษร'); process.exit(1) }
  await pool.query(
    `INSERT INTO users (username, display_name, password_hash, role) VALUES ($1, $2, '!imed', $3)
     ON CONFLICT (username) DO UPDATE SET display_name = EXCLUDED.display_name, role = EXCLUDED.role, active = true`, [code, display, role])
  console.log(`✅ บันทึก "${code}" (${role}) แล้ว`)
  await pool.end()
})().catch((e) => { console.error('❌', e.message); process.exit(1) })