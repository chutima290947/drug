const express = require('express')
const pool = require('./db')

const router = express.Router()
const bad = (msg, http = 400) => Object.assign(new Error(msg), { http })

// ทุกคนที่ล็อกอินเห็นข่าวทั้งหมด (หน้าเว็บมีตัวเลือกให้ดูเฉพาะข่าวของคลินิกที่ต้องการ)
const LIST_SQL = `
  SELECT n.id, n.title, n.body, n.all_clinics, n.created_by, n.created_by_name, n.created_at,
         n.updated_by_name, n.updated_at,
         COALESCE(array_agg(nc.clinic_code ORDER BY nc.clinic_code) FILTER (WHERE nc.clinic_code IS NOT NULL), '{}') AS clinics
  FROM news n LEFT JOIN news_clinics nc ON nc.news_id = n.id
  GROUP BY n.id ORDER BY n.created_at DESC LIMIT 200`

// ตรวจข้อมูลที่ส่งมา (ชื่อผู้แก้ไข/เวลา ไม่รับจากหน้าเว็บ — ระบบใส่เองจาก token และเวลาของฐานข้อมูล)
function parse(b) {
  const title = String(b.title || '').trim()
  const body = String(b.body || '').trim()
  const all = b.allClinics === true
  const clinics = all ? [] : [...new Set((Array.isArray(b.clinics) ? b.clinics : []).map((c) => String(c).toUpperCase()))]
  if (!title) throw bad('กรุณากรอกหัวข้อ')
  if (title.length > 200) throw bad('หัวข้อยาวเกิน 200 ตัวอักษร')
  if (!body) throw bad('กรุณากรอกรายละเอียดข่าวสาร')
  if (body.length > 5000) throw bad('รายละเอียดยาวเกิน 5,000 ตัวอักษร')
  if (!all && clinics.length === 0) throw bad('กรุณาเลือกคลินิกอย่างน้อย 1 แห่ง หรือเลือก "ทุกคลินิก"')
  return { title, body, all, clinics }
}

const setClinics = async (c, id, clinics) => {
  await c.query('DELETE FROM news_clinics WHERE news_id = $1', [id])
  if (clinics.length) await c.query('INSERT INTO news_clinics (news_id, clinic_code) SELECT $1, unnest($2::text[])', [id, clinics])
}
// แก้/ลบได้เฉพาะเจ้าของข่าว หรือผู้ดูแลระบบ (role = admin)
const canEdit = (user, row) => user.role === 'admin' || String(row.created_by) === String(user.id)

async function tx(fn) {
  const c = await pool.connect()
  try { await c.query('BEGIN'); const r = await fn(c); await c.query('COMMIT'); return r }
  catch (e) { await c.query('ROLLBACK'); throw e }
  finally { c.release() }
}
const fail = (res, e) => {
  if (e.http) return res.status(e.http).json({ error: e.message })
  if (e.code === '23503') return res.status(400).json({ error: 'รหัสคลินิกไม่ถูกต้อง' })
  console.error(e); res.status(500).json({ error: e.message })
}

router.get('/', async (_req, res) => {
  try { res.json((await pool.query(LIST_SQL)).rows) } catch (e) { fail(res, e) }
})

router.post('/', async (req, res) => {
  try {
    const n = parse(req.body)
    const id = await tx(async (c) => {
      const { rows } = await c.query(
        `INSERT INTO news (title, body, all_clinics, created_by, created_by_name, updated_by_name)
         VALUES ($1, $2, $3, $4, $5, $5) RETURNING id`, [n.title, n.body, n.all, req.user.id, req.user.name])
      await setClinics(c, rows[0].id, n.clinics)
      return rows[0].id
    })
    res.status(201).json({ id })
  } catch (e) { fail(res, e) }
})

router.put('/:id', async (req, res) => {
  try {
    const n = parse(req.body)
    await tx(async (c) => {
      const { rows } = await c.query('SELECT created_by FROM news WHERE id = $1 FOR UPDATE', [req.params.id])
      if (!rows[0]) throw bad('ไม่พบข่าวสาร', 404)
      if (!canEdit(req.user, rows[0])) throw bad('แก้ไขได้เฉพาะข่าวที่ตัวเองโพสต์ (หรือผู้ดูแลระบบ)', 403)
      await c.query(
        `UPDATE news SET title = $2, body = $3, all_clinics = $4, updated_by_name = $5, updated_at = now() WHERE id = $1`,
        [req.params.id, n.title, n.body, n.all, req.user.name])
      await setClinics(c, req.params.id, n.clinics)
    })
    res.status(204).end()
  } catch (e) { fail(res, e) }
})

router.delete('/:id', async (req, res) => {
  try {
    await tx(async (c) => {
      const { rows } = await c.query('SELECT created_by FROM news WHERE id = $1 FOR UPDATE', [req.params.id])
      if (!rows[0]) throw bad('ไม่พบข่าวสาร', 404)
      if (!canEdit(req.user, rows[0])) throw bad('ลบได้เฉพาะข่าวที่ตัวเองโพสต์ (หรือผู้ดูแลระบบ)', 403)
      await c.query('DELETE FROM news WHERE id = $1', [req.params.id])
    })
    res.status(204).end()
  } catch (e) { fail(res, e) }
})

module.exports = router