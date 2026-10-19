const express = require('express')
const jwt = require('jsonwebtoken')
const pool = require('./db')
const imed = require('./imed')
const stock = require('./imedStock')

const SECRET = process.env.JWT_SECRET
if (!SECRET || SECRET.length < 16) {
  console.error('❌ ยังไม่ได้ตั้ง JWT_SECRET ในไฟล์ .env (ยาวอย่างน้อย 16 ตัวอักษร)')
  process.exit(1)
}
const EXPIRES = process.env.JWT_EXPIRES || '12h'
const wrap = (fn) => (req, res) => fn(req, res).catch((e) => { console.error(e); res.status(500).json({ error: e.message }) })

// บัญชีที่ถูกปิดใช้งานต้องใช้ต่อไม่ได้ทันที (แคชผลตรวจ 30 วินาที เพื่อไม่ต้องถามฐานข้อมูลทุก request)
const alive = new Map()
const forget = (id) => alive.delete(String(id)) // เรียกหลังผู้ดูแลแก้ผู้ใช้ เพื่อให้มีผลทันที
async function isActive(id) {
  const c = alive.get(String(id))
  if (c && Date.now() - c.t < 30000) return c.ok
  const { rows } = await pool.query('SELECT 1 FROM users WHERE id = $1 AND active', [id])
  alive.set(String(id), { ok: !!rows[0], t: Date.now() })
  return !!rows[0]
}

// ตรวจ token ทุก request ที่ต้องล็อกอิน แล้วใส่ req.user = { id, username, name, role }
async function requireAuth(req, res, next) {
  const m = /^Bearer (.+)$/.exec(req.headers.authorization || '')
  if (!m) return res.status(401).json({ error: 'กรุณาเข้าสู่ระบบ' })
  let p
  try { p = jwt.verify(m[1], SECRET) } catch { return res.status(401).json({ error: 'เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่' }) }
  try {
    if (!(await isActive(p.id))) return res.status(401).json({ error: 'บัญชีนี้ถูกปิดการใช้งาน' })
  } catch (e) { console.error(e); return res.status(500).json({ error: e.message }) }
  req.user = { id: p.id, username: p.username, name: p.name, role: p.role }
  next()
}

// กันเดารหัสผ่าน: ผิดเกิน 10 ครั้งใน 15 นาที (ต่อ IP + รหัสพนักงาน) ให้รอก่อน
const fails = new Map()
const recent = (k) => { const t = (fails.get(k) || []).filter((x) => Date.now() - x < 15 * 60 * 1000); fails.set(k, t); return t }

const router = express.Router()

// หน้า login ใช้ดูว่าอยู่โหมดจำลอง iMed หรือไม่ (เพื่อแสดงป้าย "โหมดทดลอง")
router.get('/config', (_req, res) => res.json({ imed: imed.provider, stock: stock.source }))

// ล็อกอินด้วยรหัสพนักงาน + รหัสผ่าน iMed (ระบบนี้ไม่เก็บรหัสผ่านใด ๆ)
// พนักงานที่ iMed ยืนยันแล้วแต่ยังไม่มีในระบบ จะถูกเพิ่มอัตโนมัติ (ไม่ต้องให้ใครกำหนดสิทธิ์ — ทุกคนเห็นข่าวทั้งหมด และเลือกดูเฉพาะคลินิกที่ต้องการได้)
router.post('/login', wrap(async (req, res) => {
  const username = String(req.body.username || '').trim().toLowerCase()
  const password = String(req.body.password || '')
  if (!username || !password) return res.status(400).json({ error: 'กรุณากรอกรหัสพนักงานและรหัสผ่าน' })
  const key = `${req.ip}|${username}`
  if (recent(key).length >= 10) return res.status(429).json({ error: 'ลองผิดหลายครั้งเกินไป กรุณารอ 15 นาที' })

  let who
  try { who = /^[a-z0-9._-]{2,32}$/.test(username) ? await imed.verify(username, password) : null }
  catch (e) { console.error(e); return res.status(502).json({ error: 'เชื่อมต่อ iMed ไม่ได้ กรุณาลองใหม่ภายหลัง' }) }
  if (!who) {
    fails.set(key, [...recent(key), Date.now()])
    return res.status(401).json({ error: 'รหัสพนักงานหรือรหัสผ่านไม่ถูกต้อง' })
  }
  fails.delete(key)

  const find = () => pool.query('SELECT id, username, display_name, role, active FROM users WHERE username = $1', [username])
  let u = (await find()).rows[0]
  if (!u) {
    await pool.query(
      `INSERT INTO users (username, display_name, password_hash, role) VALUES ($1, $2, '!imed', 'user')
       ON CONFLICT (username) DO NOTHING`, [username, who.name || username])
    u = (await find()).rows[0]
  }
  if (!u.active) return res.status(401).json({ error: 'บัญชีนี้ถูกปิดการใช้งาน กรุณาติดต่อผู้ดูแลระบบ' })

  const user = { id: u.id, username: u.username, name: u.display_name, role: u.role }
  res.json({ token: jwt.sign(user, SECRET, { expiresIn: EXPIRES }), user })
}))

// ใช้ตอนเปิดหน้าเว็บ: ตรวจว่า token ยังใช้ได้ และผู้ใช้ยัง active
router.get('/me', requireAuth, wrap(async (req, res) => {
  const { rows } = await pool.query('SELECT id, username, display_name, role FROM users WHERE id = $1 AND active', [req.user.id])
  const u = rows[0]
  if (!u) return res.status(401).json({ error: 'บัญชีนี้ถูกปิดการใช้งาน' })
  res.json({ id: u.id, username: u.username, name: u.display_name, role: u.role })
}))

module.exports = { router, requireAuth, forget }