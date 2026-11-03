import { useEffect, useState } from 'react'
import { api } from '../api.js'
import { CLINICS } from '../data.js'
import { short } from '../utils.js'
import { card, field, btnGhost, btnPrimary } from '../classes.js'

const CODES = CLINICS.map(short)
const EMPTY = { id: null, title: '', body: '', all: false, codes: [] }
const chip = 'cursor-pointer border rounded-full px-3.5 py-1 text-[13px] transition-[border-color,box-shadow] duration-150 focus-visible:outline-none focus-visible:border-accent focus-visible:shadow-[0_0_0_3px_var(--color-accent-soft)]'

// หน้านี้ไว้โพสต์ข่าวสารอย่างเดียว — ดู แก้ไข และลบข่าว ทำที่หน้า คลังยา / Lot (ปุ่ม 📰 ข่าวสาร)
export default function NewsPage({ user, notify, editing, onSaved, onCancel }) {
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)

  // กด "แก้ไข" จากหน้าคลังยา/Lot จะพาข่าวนั้นมาใส่ในฟอร์มนี้
  useEffect(() => {
    setForm(editing ? { id: editing.id, title: editing.title, body: editing.body, all: editing.all_clinics, codes: editing.clinics } : EMPTY)
  }, [editing])

  const toggle = (c) => setForm((f) => ({ ...f, codes: f.codes.includes(c) ? f.codes.filter((x) => x !== c) : [...f.codes, c] }))
  const ok = form.title.trim() && form.body.trim() && (form.all || form.codes.length > 0)

  const submit = async () => {
    if (!ok || saving) return
    setSaving(true)
    const b = { title: form.title.trim(), body: form.body.trim(), allClinics: form.all, clinics: form.all ? [] : form.codes }
    const editingNow = !!form.id
    try {
      if (editingNow) await api.editNews(form.id, b); else await api.addNews(b)
      setForm(EMPTY)
      notify(editingNow ? 'แก้ไขข่าวสารแล้ว' : 'โพสต์ข่าวสารแล้ว — ดูได้ที่หน้าคลังยา / Lot ปุ่ม 📰 ข่าวสาร')
      onSaved?.()
    } catch (e) { notify('บันทึกไม่สำเร็จ: ' + e.message) }
    setSaving(false)
  }
  const cancel = () => { setForm(EMPTY); onCancel?.() }

  return (
    <section className={`${card} px-5 py-4`}>
      <h3 className="text-[16px] font-semibold mb-3">{form.id ? 'แก้ไขข่าวสาร' : 'โพสต์ข่าวสารใหม่'}</h3>
      <input className={`${field} w-full mb-2.5`} placeholder="หัวข้อ" maxLength={200}
        value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
      <textarea className={`${field} w-full min-h-[120px] mb-3 resize-y`} placeholder="รายละเอียด" maxLength={5000}
        value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} />

      <div className="text-[13.5px] font-medium mb-1.5">ส่งถึงคลินิก</div>
      <div className="flex gap-2 flex-wrap mb-3">
        <button type="button" aria-pressed={form.all} onClick={() => setForm({ ...form, all: !form.all })}
          className={`${chip} ${form.all ? 'bg-accent border-accent text-white' : 'bg-white border-line text-ink'}`}>ทุกคลินิก</button>
        {CODES.map((c) => (
          <button key={c} type="button" aria-pressed={form.all || form.codes.includes(c)} disabled={form.all} onClick={() => toggle(c)}
            className={`${chip} disabled:cursor-not-allowed ${form.all ? 'bg-accent-soft border-accent-soft text-accent' : form.codes.includes(c) ? 'bg-accent border-accent text-white' : 'bg-white border-line text-ink'}`}>{c}</button>
        ))}
      </div>

      <div className="flex items-center justify-between gap-3 flex-wrap">
        <small className="text-mut">ระบบบันทึกชื่อผู้ใช้ ({user.name}) วันที่ และเวลาที่อัปเดตให้อัตโนมัติ</small>
        <div className="flex gap-2">
          {form.id && <button className={btnGhost} onClick={cancel}>ยกเลิกการแก้ไข</button>}
          <button className={btnPrimary} disabled={!ok || saving} onClick={submit}>{saving ? 'กำลังบันทึก...' : form.id ? 'บันทึกการแก้ไข' : 'โพสต์ข่าวสาร'}</button>
        </div>
      </div>
      <p className="mt-3 border-t border-line pt-3 text-[13px] text-mut">ดู แก้ไข และลบข่าวที่โพสต์แล้วได้ที่หน้า <b className="text-ink">คลังยา / Lot</b> → ปุ่ม <b className="text-ink">📰 ข่าวสาร</b></p>
    </section>
  )
}