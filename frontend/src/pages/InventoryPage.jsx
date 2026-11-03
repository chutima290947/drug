import { useState } from 'react'
import { api } from '../api.js'
import { CLINICS } from '../data.js'
import { fmt, baht, thDate, dayTxt, short } from '../utils.js'
import { Pill, Flags, Chips, chipBase, SC, Th, Td } from '../components/ui.jsx'
import { card, ROW, noteCls, btnGhost, btnPrimary } from '../classes.js'

const dt = (t) => `${new Date(t).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })} ${new Date(t).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', hour12: false })} น.`

export default function InventoryPage({ d }) {
  const { cfg, lotRows, invRows, cnt, qty, val, fs, setFs, rowMap, notes, setNotes, setSel, del, picked, pickToggle, pickMany, clearPick, exportCsv, printReport, news, clinic, go, user, setClinic, reloadNews, notify, setEditing } = d
  const [showNews, setShowNews] = useState(false)
  // ข่าวสารที่เกี่ยวกับคลินิกที่เลือกอยู่ (ข่าวของคลินิกนั้น + ข่าวที่ส่งถึงทุกคลินิก) เลขข่าวตรงกับหน้าข่าวสาร
  const ordered = [...news].sort((a, b) => new Date(a.created_at) - new Date(b.created_at) || a.id - b.id)
  const numOf = Object.fromEntries(ordered.map((n, i) => [n.id, i + 1]))
  const mine = (n) => user.role === 'admin' || String(n.created_by) === String(user.id) // แก้/ลบได้เฉพาะเจ้าของข่าวหรือ admin
  const delNews = async (n) => {
    if (!confirm(`ลบข่าวที่ ${numOf[n.id]}: "${n.title}" ?\n(ข่าวที่เหลือจะเรียงเลขใหม่)`)) return
    try { await api.delNews(n.id); await reloadNews(); notify('ลบข่าวแล้ว') } catch (e) { notify('ลบไม่สำเร็จ: ' + e.message) }
  }
  const pick = (c) => setClinic(c === 'all' ? 'all' : CLINICS.find((n) => short(n) === c))
  const rel = ordered.filter((n) => clinic === 'all' || n.all_clinics || n.clinics.includes(short(clinic)))
  const noteCount = lotRows.filter((l) => (notes[`${l.clinic}|${l.lot}`] || '').trim()).length // Lot ที่มีหมายเหตุ
  const allPicked = invRows.length > 0 && invRows.every((l) => picked.has(l.id))
  return (
    <>
      {!showNews && <div className="grid grid-cols-[repeat(auto-fit,minmax(230px,1fr))] gap-4 mb-[22px]">
        <SC c="dk" t="หมดอายุห้ามใช้" n={cnt('expired')} u={`Lot (${fmt(qty('expired'))} หน่วย)`} sub={`รวมมูลค่า ${baht(val('expired'))}`} onClick={() => setFs(fs === 'expired' ? 'all' : 'expired')} />
        <SC c="rd" t={`ใกล้หมดอายุ (≤ ${cfg.redMonths} เดือน)`} n={cnt('red')} u="Lots" sub={`รวมมูลค่า ${baht(val('red'))}`} onClick={() => setFs(fs === 'red' ? 'all' : 'red')} />
        <SC c="or" t={`เฝ้าระวัง (≤ ${cfg.orangeMonths} เดือน)`} n={cnt('orange')} u={`Lot (${fmt(qty('orange'))} หน่วย)`} sub={`รวมมูลค่า ${baht(val('orange'))}`} onClick={() => setFs(fs === 'orange' ? 'all' : 'orange')} />
        <SC c="teal2" t="ปกติ (ระยะปลอดภัย)" n={cnt('ok')} u={`Lots (${fmt(qty('ok'))} หน่วย)`} sub={`รวมมูลค่า ${baht(val('ok'))}`} onClick={() => setFs(fs === 'ok' ? 'all' : 'ok')} />
      </div>}
      <Chips v={showNews ? null : fs} set={(k) => { setFs(k); setShowNews(false) }} items={[['all', `ทั้งหมด (${lotRows.length})`], ['expired', `หมดอายุห้ามใช้ (${cnt('expired')})`], ['red', `ใกล้หมดอายุ (${cnt('red')})`], ['orange', `เฝ้าระวัง (${cnt('orange')})`], ['soon', `ใกล้หมดอายุ ≤ ${cfg.orangeMonths} เดือน (${cnt('red') + cnt('orange')})`], ['ok', `ปกติ (${cnt('ok')})`], ['note', `📝 มีหมายเหตุ (${noteCount})`]]}
        extra={<button aria-pressed={showNews} onClick={() => setShowNews(!showNews)} className={`${chipBase} ${rel.length > 0 ? `bg-rd border-rd text-white ${showNews ? 'shadow-[0_0_0_3px_rgba(168,50,42,.3)]' : ''}` : `bg-white text-ink ${showNews ? 'border-accent shadow-[0_0_0_3px_var(--color-accent-soft)]' : 'border-line'}`}`}>📰 ข่าวสาร ({rel.length})</button>} />
      {showNews && (
        <div className={`${card} px-5 py-4 mb-3.5 print:hidden`}>
          <div className="flex items-center justify-between gap-3 flex-wrap mb-2">
            <h3 className="text-[15px] font-semibold">ข่าวสาร{clinic !== 'all' && ` — ${clinic}`}</h3>
            <button className={btnGhost} onClick={() => { setEditing(null); go('news') }}>+ โพสต์ข่าวใหม่</button>
          </div>
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className="mr-1 text-[13.5px] font-medium">ดูข่าวของคลินิก:</span>
            {['all', ...CLINICS.map(short)].map((c) => {
              const on = c === 'all' ? clinic === 'all' : clinic !== 'all' && short(clinic) === c
              return <button key={c} aria-pressed={on} onClick={() => pick(c)} className={`${chipBase} ${on ? 'bg-accent border-accent text-white' : 'bg-white border-line text-ink'}`}>{c === 'all' ? 'ทุกคลินิก' : c}</button>
            })}
          </div>
          {rel.length === 0
            ? <p className="text-[14px] text-mut">ยังไม่มีข่าวสาร</p>
            : (
              <div className="grid gap-3">
                {rel.map((n) => (
                  <article key={n.id} className="border-b border-line pb-3 last:border-0 last:pb-0">
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <b className="flex items-start gap-2 text-[14.5px]">
                        <span className="grid size-6 flex-none place-items-center rounded-full bg-accent-soft text-[12px] text-accent">{numOf[n.id]}</span>{n.title}
                      </b>
                      <span className="flex flex-wrap gap-1.5">
                        {!n.all_clinics && n.clinics.map((c) => <span key={c} className="rounded-full bg-accent-soft px-2.5 py-0.5 text-[12px] font-medium text-accent">{c}</span>)}
                      </span>
                    </div>
                    <p className="my-1.5 whitespace-pre-wrap break-words pl-8 text-[14px]">{n.body}</p>
                    <div className="flex flex-wrap items-center justify-between gap-2 pl-8">
                      <small className="text-mut">อัปเดตโดย <b className="font-medium text-ink">{n.updated_by_name}</b> · {dt(n.updated_at)}</small>
                      {mine(n) && (
                        <span className="flex gap-2">
                          <button className={btnGhost} onClick={() => { setEditing(n); go('news') }}>แก้ไข</button>
                          <button className={btnGhost} onClick={() => delNews(n)}>ลบ</button>
                        </span>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            )}
        </div>
      )}
      {!showNews && <>
      <div className="flex items-center gap-2.5 flex-wrap mb-3.5 print:hidden">
        <button className={btnPrimary} onClick={printReport}>🖨 พิมพ์รายงาน ({picked.size ? `เลือก ${picked.size}` : `ที่แสดง ${invRows.length}`})</button>
        {picked.size > 0 && <button className={btnGhost} onClick={clearPick}>ล้างการเลือก</button>}
        <span className="text-[13px] text-mut">ติ๊กเลือกแถวที่ต้องการ หรือไม่เลือกเลยเพื่อพิมพ์ทุกแถวที่แสดงอยู่</span>
      </div>
      <div className={card}>
        <div className="hscroll overflow-auto max-h-[calc(100vh-200px)]">
        <table className="w-full border-separate border-spacing-0">
          <thead><tr><Th><input type="checkbox" className="size-4 cursor-pointer" aria-label="เลือกทั้งหมดที่แสดง" checked={allPicked} onChange={(e) => pickMany(invRows.map((l) => l.id), e.target.checked)} /></Th><Th>รหัส</Th><Th>รายการ</Th><Th>คลินิก</Th><Th>Lot</Th><Th n>คงเหลือ</Th><Th n>มูลค่า</Th><Th>Exp</Th><Th n>เหลือ</Th><Th>สถานะ Exp</Th><Th>สถานะการใช้</Th><Th>หมายเหตุ</Th><Th /></tr></thead>
          <tbody className="[&>tr:last-child>td]:border-b-0">
            {invRows.map((l) => {
              const nk = `${l.clinic}|${l.lot}`, r = rowMap[l.key]
              return (
                <tr key={nk} className={`cursor-pointer ${ROW[l.status]}`} onClick={() => setSel(l.key)}>
                  <Td onClick={(e) => e.stopPropagation()}><input type="checkbox" className="size-4 cursor-pointer" aria-label="เลือก" checked={picked.has(l.id)} onChange={() => pickToggle(l.id)} /></Td><Td className="text-mut">{l.code}</Td><Td>{l.drug.name}{l.drug.type === 'supply' && <span className="ml-1.5 rounded border border-current px-1 text-[11px] opacity-80">เวชภัณฑ์</span>}</Td><Td>{l.clinic}</Td><Td>{l.lot}</Td>
                  <Td n>{fmt(l.qty)} {l.drug.unit}</Td><Td n>{baht(l.qty * l.drug.price)}</Td>
                  <Td className="font-bold text-[15.5px]">{thDate(l.exp)}</Td><Td n className="font-bold text-[15.5px]">{dayTxt(l.exp)}</Td><Td><Pill s={l.status} /></Td>
                  <Td>{r.noMove || r.overstock || r.low ? <Flags r={r} /> : <span className="text-mut">ปกติ</span>}</Td>
                  <Td onClick={(e) => e.stopPropagation()}><input className={noteCls(notes[nk])} placeholder="+ หมายเหตุ" value={notes[nk] || ''} onChange={(e) => setNotes({ ...notes, [nk]: e.target.value })} /></Td>
                  <Td onClick={(e) => e.stopPropagation()}><button className="border-0 bg-transparent px-2 py-1 text-inherit opacity-55 hover:opacity-100 cursor-pointer" onClick={() => del(l)} aria-label="ลบ">✕</button></Td>
                </tr>
              )
            })}
          </tbody>
        </table>
        </div>
        <div className="px-5 py-3 border-t border-line text-[13px] text-mut">แสดง <b className="text-ink">{invRows.length}</b> รายการ · มูลค่ารวม <b className="text-ink">{baht(invRows.reduce((a, l) => a + l.qty * l.drug.price, 0))}</b> · คลิกที่แถวเพื่อดูรายละเอียด</div>
      </div>
      </>}
    </>
  )
}