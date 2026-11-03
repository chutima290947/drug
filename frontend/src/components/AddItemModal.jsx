import { CLINICS } from '../data.js'
import { baht } from '../utils.js'
import { field, btnGhost, btnPrimary } from '../classes.js'

const row = 'flex justify-between items-center gap-3 text-[14.5px]'
const num = `${field} w-[90px] text-right`
const wide = `${field} w-[150px]`
const err = 'text-[#a8322a] text-[13px]'

export default function AddItemModal({ form, F, setForm, lookup, checking, sugg = [], item, dup, formOk, addItem, onClose }) {
  const supply = true // เพิ่มได้เฉพาะเวชภัณฑ์ (ยาใช้ทะเบียนยาในระบบ)
  const code = form.code.trim()
  const mismatch = lookup && lookup.type !== form.type
  return (
    <div className="fixed inset-0 bg-[rgba(20,30,40,.35)] z-20 flex justify-end items-start overflow-auto" onClick={() => onClose()}>
      <div className="bg-white rounded-2xl shadow-card p-6 w-[min(440px,92vw)] mt-[6vh] mb-6 mx-auto grid gap-3.5" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-[19px] font-semibold">เพิ่มรายการเวชภัณฑ์</h2>
        <label className={row}>รหัสเวชภัณฑ์
          <input list="codes" className={`${wide} text-left`} placeholder="เช่น S001 (ตั้งเอง)" value={form.code} onChange={F('code')} autoFocus />
        </label>
        <datalist id="codes">{sugg.map((d) => <option key={d.code} value={d.code}>{d.name}</option>)}</datalist>
        {code && (checking ? <div className="text-mut text-[13px]">กำลังค้นหา...</div>
          : mismatch ? <div className={err}>รหัสนี้เป็นรายการยาอยู่แล้ว กรุณาใช้รหัสเวชภัณฑ์อื่น</div>
          : lookup && !supply ? <div className="bg-accent-soft rounded-[10px] px-3.5 py-2.5 flex flex-col text-sm"><b>{lookup.name}</b><span className="text-mut text-[13px]">หน่วย: {lookup.unit} · ราคา/หน่วย {baht(lookup.price)}</span></div>
          : supply ? <div className="text-mut text-[13px]">{lookup ? 'พบเวชภัณฑ์เดิมในระบบ — แก้ข้อมูลได้ด้านล่าง' : 'ไม่พบรหัสนี้ในระบบ — กรอกข้อมูลเวชภัณฑ์เองด้านล่าง'}</div>
          : <div className={err}>ไม่พบรหัสยานี้ในฐานข้อมูล</div>)}
        {supply && !mismatch && (
          <>
            <label className={row}>ชื่อเวชภัณฑ์<input className={`${wide} text-left`} value={form.name} onChange={F('name')} /></label>
            <label className={row}>หน่วย<input className={`${wide} text-left`} placeholder="เช่น ชิ้น, กล่อง" value={form.unit} onChange={F('unit')} /></label>
            <label className={row}>ราคา/หน่วย (บาท)<input className={num} type="number" min="0" step="0.01" value={form.price} onChange={F('price')} /></label>
          </>
        )}
        <label className={row}>คลินิก<select className={field} value={form.clinic} onChange={F('clinic')}>{CLINICS.map((c) => <option key={c}>{c}</option>)}</select></label>
        <label className={row}>Lot<input className={`${wide} text-left`} value={form.lot} onChange={F('lot')} /></label>
        <label className={row}>จำนวน<span><input className={num} type="number" min="1" value={form.qty} onChange={F('qty')} /> {item?.unit}</span></label>
        <label className={row}>วันหมดอายุ<input type="date" className={`${wide} text-right`} value={form.exp} onChange={F('exp')} /></label>
        <div className={row}>มูลค่า<b>{item && +form.qty > 0 ? baht(form.qty * item.price) : '—'}</b></div>
        {dup && <div className={err}>Lot นี้มีอยู่แล้วในคลินิกนี้</div>}
        <div className="flex items-center gap-2.5 flex-wrap pt-1.5">
          <button className={btnPrimary} onClick={addItem} disabled={!formOk}>เพิ่มรายการ</button>
          <button className={btnGhost} onClick={() => onClose()}>ยกเลิก</button>
        </div>
      </div>
    </div>
  )
}