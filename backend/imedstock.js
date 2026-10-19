// ยอดคงเหลือ: ของจริงอยู่ที่ iMed Stock (real-time)
// IMED_STOCK=manual (ค่าเริ่มต้น) = ใช้ยอดที่บันทึกในระบบนี้ / IMED_STOCK=imed = เอายอดจาก iMed มาทับทุกครั้งที่โหลด
// เมื่อได้ข้อมูลเชื่อมต่อ iMed Stock จริงจากฝ่าย IT ให้แก้เฉพาะฟังก์ชัน fetchReal ด้านล่าง
const source = (process.env.IMED_STOCK || 'manual').toLowerCase()

// TODO(iMed จริง): ขอยอดคงเหลือแยกคลินิก / ยา / Lot จาก iMed แล้วคืน Map
//   key   = `${clinic_code}|${drug_code}|${lot_no}`  (เช่น "BCA|D014|D014-L1")
//   value = จำนวนคงเหลือ (ตัวเลข)
async function fetchReal() {
  throw new Error('ยังไม่ได้เชื่อมต่อ iMed Stock — แก้ฟังก์ชัน fetchReal ใน imedStock.js')
}

// รับแถว Lot จากฐานข้อมูล (v_lots) แล้วแทนค่า qty ด้วยยอดจาก iMed (Lot ที่ iMed ไม่รู้จักจะคงยอดเดิมไว้)
async function overlay(rows) {
  if (source !== 'imed') return rows
  const m = await fetchReal()
  return rows.map((r) => {
    const q = m.get(`${r.clinic_code}|${r.drug_code}|${r.lot_no}`)
    return q === undefined ? r : { ...r, qty: q }
  })
}

module.exports = { overlay, source }