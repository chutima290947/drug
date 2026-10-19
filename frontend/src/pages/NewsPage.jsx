import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { api } from '../api.js'
import { CLINICS } from '../data.js'
import { short } from '../utils.js'
import { card, field, btnGhost, btnPrimary } from '../classes.js'

const CODES = CLINICS.map(short)
const EMPTY = { id: null, title: '', body: '', all: false, codes: [] }
const dt = (t) => {
  const d = new Date(t)
  return `${d.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })} ${d.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', hour12: false })} น.`
}
const chip = 'cursor-pointer border rounded-full px-3.5 py-1 text-[13px] transition-[border-color,box-shadow] duration-150 focus-visible:outline-none focus-visible:border-accent focus-visible:shadow-[0_0_0_3px_var(--color-accent-soft)]'

export default function NewsPage({ user, clinic, setClinic, notify, onCount }) {
  const [items, setItems] = useState(null) // null = กำลังโหลด
  const [err, setErr] = useState('')
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)
  const lastRef = useRef(null)

  const load = useCallback(async () => {
    try { const r = await api.news(); setItems(r); onCount?.(r.length); setErr('') } catch (e) { setErr(e.message); setItems([]) }
  }, [onCount])
  useEffect(() => { load() }, [load])

  // เรียงข่าวเก่า → ใหม่ และเลขข่าว 1, 2, 3... (ลบข่าวไหนออก เลขของข่าวที่เหลือจะเรียงใหม่)
  const ordered = useMemo(() => [...(items || [])].sort((a, b) => new Date(a.created_at) - new Date(b.created_at) || a.id - b.id), [items])
  const numOf = useMemo(() => Object.fromEntries(ordered.map((n, i) => [n.id, i + 1])), [ordered])
  // เลือกดูข่าวของคลินิกที่ต้องการ: แสดงข่าวที่ส่งถึงคลินิกนั้น + ข่าวที่ส่งถึงทุกคลินิก
  const shown = useMemo(() => ordered.filter((n) => clinic === 'all' || n.all_clinics || n.clinics.includes(short(clinic))), [ordered, clinic])

  const toggle = (c) => setForm((f) => ({ ...f, codes: f.codes.includes(c) ? f.codes.filter((x) => x !== c) : [...f.codes, c] }))
  const ok = form.title.trim() && form.body.trim() && (form.all || form.codes.length > 0)

  const submit = async () => {
    if (!ok || saving) return
    setSaving(true)
    const b = { title: form.title.trim(), body: form.body.trim(), allClinics: form.all, clinics: form.all ? [] : form.codes }
    const adding = !form.id
    try {
      if (form.id) await api.editNews(form.id, b); else await api.addNews(b)
      setForm(EMPTY); await load(); notify(adding ? 'โพสต์ข่าวสารแล้ว' : 'แก้ไขข่าวสารแล้ว')
      if (adding) setTimeout(() => lastRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 150) // เลื่อนไปที่ข่าวที่เพิ่งโพสต์ (อยู่ท้ายรายการ)
    } catch (e) { notify('บันทึกไม่สำเร็จ: ' + e.message) }
    setSaving(false)
  }
  const edit = (n) => { setForm({ id: n.id, title: n.title, body: n.body, all: n.all_clinics, codes: n.clinics }); window.scrollTo({ top: 0, behavior: 'smooth' }) }
  const del = async (n) => {
    if (!confirm(`ลบข่าวที่ ${numOf[n.id]}: "${n.title}" ?\n(ข่าวที่เหลือจะเรียงเลขใหม่)`)) return
    try { await api.delNews(n.id); if (form.id === n.id) setForm(EMPTY); await load() } catch (e) { notify('ลบไม่สำเร็จ: ' + e.message) }
  }
  const mine = (n) => user.role === 'admin' || String(n.created_by) === String(user.id)
  const pick = (c) => setClinic(c === 'all' ? 'all' : CLINICS.find((n) => short(n) === c))

  return (
    <div className="grid gap-4">
      <section className={`${card} px-5 py-4`}>
        <h3 className="text-[16px] font-semibold mb-3">{form.id ? `แก้ไขข่าวที่ ${numOf[form.id] ?? ''}` : 'โพสต์ข่าวสารใหม่'}</h3>
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
            {form.id && <button className={btnGhost} onClick={() => setForm(EMPTY)}>ยกเลิกการแก้ไข</button>}
            <button className={btnPrimary} disabled={!ok || saving} onClick={submit}>{saving ? 'กำลังบันทึก...' : form.id ? 'บันทึกการแก้ไข' : 'โพสต์ข่าวสาร'}</button>
          </div>
        </div>
      </section>

      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-[13.5px] font-medium mr-1">ดูข่าวของคลินิก:</span>
        {['all', ...CODES].map((c) => {
          const on = c === 'all' ? clinic === 'all' : clinic !== 'all' && short(clinic) === c
          return (
            <button key={c} type="button" aria-pressed={on} onClick={() => pick(c)}
              className={`${chip} ${on ? 'bg-accent border-accent text-white' : 'bg-white border-line text-ink'}`}>{c === 'all' ? 'ทุกคลินิก' : c}</button>
          )
        })}
      </div>

      {err && <div className={`${card} px-5 py-4 text-rd`}>โหลดข่าวสารไม่สำเร็จ: {err} <button className={`${btnGhost} ml-2`} onClick={load}>ลองใหม่</button></div>}
      {items === null && <div className="py-10 text-center text-mut">กำลังโหลดข่าวสาร...</div>}
      {items && !err && shown.length === 0 && <div className={`${card} px-5 py-10 text-center text-mut`}>ยังไม่มีข่าวสาร{clinic === 'all' ? '' : `สำหรับ ${clinic}`}</div>}

      {shown.map((n, i) => {
        const edited = new Date(n.updated_at) - new Date(n.created_at) > 1000
        return (
          <article key={n.id} ref={i === shown.length - 1 ? lastRef : null} className={`${card} px-5 py-4`}>
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <h3 className="flex items-start gap-2.5 text-[16.5px] font-semibold min-w-0 break-words">
                <span className="mt-px grid size-7 flex-none place-items-center rounded-full bg-accent-soft text-[13px] text-accent" aria-label={`ข่าวที่ ${numOf[n.id]}`}>{numOf[n.id]}</span>
                <span className="min-w-0">{n.title}</span>
              </h3>
              <div className="flex gap-1.5 flex-wrap">
                {n.all_clinics
                  ? <span className="rounded-full bg-accent text-white px-3 py-0.5 text-[12.5px] font-medium">ทุกคลินิก</span>
                  : n.clinics.map((c) => <span key={c} className="rounded-full bg-accent-soft text-accent px-3 py-0.5 text-[12.5px] font-medium">{c}</span>)}
              </div>
            </div>
            <p className="whitespace-pre-wrap break-words my-2.5 pl-[38px]">{n.body}</p>
            <div className="flex items-center justify-between gap-3 flex-wrap pl-[38px] text-[13px] text-mut">
              <span>
                อัปเดตโดย <b className="text-ink font-medium">{n.updated_by_name}</b> · {dt(n.updated_at)}
                {edited && <> (โพสต์ครั้งแรกโดย {n.created_by_name} · {dt(n.created_at)})</>}
              </span>
              {mine(n) && (
                <span className="flex gap-2">
                  <button className={btnGhost} onClick={() => edit(n)}>แก้ไข</button>
                  <button className={btnGhost} onClick={() => del(n)}>ลบ</button>
                </span>
              )}
            </div>
          </article>
        )
      })}
    </div>
  )
}