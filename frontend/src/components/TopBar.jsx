import { CLINICS } from '../data.js'
import { thDate } from '../utils.js'
import { field, btnGhost, btnPrimary } from '../classes.js'

export default function TopBar({ clinic, setClinic, q, setQ, onSettings, onAdd, user }) {
  return (
    <header className="sticky top-0 z-[5] bg-white border-b border-line px-6 py-3 flex flex-wrap gap-3 items-center justify-between max-[1000px]:static print:hidden">
      <div className="relative flex items-center gap-3.5 overflow-hidden rounded-2xl py-2.5 pl-3 pr-6 text-white ring-1 ring-white/10 shadow-[0_8px_20px_-8px_rgba(5,13,43,.6)] bg-[linear-gradient(135deg,#050d2b_0%,#0a1a4a_55%,#17398f_100%)]">
        <span aria-hidden className="pointer-events-none absolute -right-10 -top-12 size-32 rounded-full bg-white/10" />
        <span aria-hidden className="pointer-events-none absolute -bottom-14 right-16 size-24 rounded-full bg-sky-300/10" />
        <span aria-hidden className="relative grid size-11 shrink-0 place-items-center rounded-xl bg-white/15 text-[22px] ring-1 ring-white/25">💊</span>
        <div className="relative min-w-0">
          <h1 className="text-[20px] font-semibold leading-tight tracking-tight">คลังยา OutList Clinic <span className="ml-1.5 rounded-full bg-white/15 px-2.5 py-0.5 align-[2px] text-xs font-medium text-sky-100 ring-1 ring-white/30">คลินิกนอก {CLINICS.length} แห่ง</span></h1>
          <small className="mt-0.5 block text-[13px] text-blue-100/85">แผนกเภสัชกรรม โรงพยาบาลกรุงเทพสิริโรจน์ · ข้อมูลล่าสุด {thDate(new Date())}</small>
        </div>
      </div>
      <div className="flex gap-2 flex-wrap items-center">
        <select className={field} value={clinic} onChange={(e) => setClinic(e.target.value)}>
          <option value="all">ทุกคลินิก ({CLINICS.length} สาขา)</option>
          {CLINICS.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <input className={`${field} w-[210px]`} placeholder="🔍 ค้นหาชื่อยา / รหัสยา" value={q} onChange={(e) => setQ(e.target.value)} />
        <button className={btnGhost} onClick={onSettings}>⚙ ตั้งค่าเกณฑ์</button>
        <button className={btnPrimary} onClick={onAdd}>+ เพิ่มรายการเวชภัณฑ์</button>
        <div className="flex items-center gap-2.5 ml-2 pl-4 border-l border-line text-right text-[13px] leading-[1.3]">
          <span>{user.name}<br /><small>{user.role === 'admin' ? 'ผู้ดูแลระบบ' : 'ผู้ใช้งาน'}</small></span>
          <i className="w-[38px] h-[38px] rounded-full bg-accent text-white grid place-items-center not-italic font-semibold">{[...user.name][0]}</i>
        </div>
      </div>
    </header>
  )
}