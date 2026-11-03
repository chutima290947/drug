import { useState } from 'react'
import { fmt, thDate, dayTxt, cov, EXP_LABEL } from '../utils.js'
import { Flags, Chips, Th, Td } from '../components/ui.jsx'
import { USAGE } from '../data.js'
import { card, ROW, noteCls, pillCls } from '../classes.js'

export default function UsagePage({ d }) {
  const { rows, clinic, uf, setUf, notes, setNotes, setSel } = d
  const [top, setTop] = useState(30)
  const agg = {}
  rows.forEach((r) => { const t = (agg[r.drug.code] ??= { drug: r.drug, used: 0 }); t.used += USAGE[r.key][`out${top}`] })
  const top5 = Object.values(agg).sort((x, y) => y.used - x.used).slice(0, 5)
  const max = top5[0]?.used || 1
  // คอลัมน์ในตารางตามช่วงเวลาที่เลือกด้านบน (30/90/180 วัน)
  const u = (r) => { const used = USAGE[r.key][`out${top}`], avg = used / top; return { used, avg, cv: avg > 0 ? r.stock / avg : Infinity } }
  const useAll = [...rows].sort((a, b) => a.stock - b.stock)
  const ufn = { all: () => true, exp: (r) => r.worst !== 'ok', nm: (r) => r.noMove, os: (r) => r.overstock && !r.noMove, note: (r) => !!(notes[r.key] || '').trim() }
  const useRows = useAll.filter(ufn[uf])
  const uc = (k) => useAll.filter(ufn[k]).length
  const segBtn = 'border-0 px-3 py-[3px] rounded-lg text-[12.5px] cursor-pointer'
  return (
    <>
      <div className={`${card} bg-white mb-3.5`}>
        <div className="px-4 pt-2.5 pb-1 flex justify-between items-center flex-wrap gap-2.5">
          <h3 className="text-[15px] font-semibold">ยาที่ใช้มากที่สุด 5 อันดับ <small className="text-mut">· {clinic === 'all' ? 'ทุกคลินิก' : clinic}</small></h3>
          <div className="inline-flex bg-[#e9edf1] rounded-[10px] p-[3px]">
            {[30, 90, 180].map((n) => (
              <button key={n} onClick={() => setTop(n)}
                className={`${segBtn} ${top === n ? 'bg-white text-accent font-semibold shadow-[0_1px_3px_rgba(20,35,50,.1)]' : 'bg-transparent text-mut'}`}>{n} วัน</button>
            ))}
          </div>
        </div>
        <div className="px-4 pt-0.5 pb-3 grid gap-[7px]">
          {top5.map((t, i) => (
            <div key={t.drug.code} className="grid grid-cols-[22px_minmax(140px,240px)_1fr_minmax(130px,190px)] items-center gap-2.5 max-[700px]:grid-cols-[26px_1fr_100px]">
              <span className={`w-[22px] h-[22px] rounded-md grid place-items-center font-semibold text-xs ${i === 0 ? 'bg-accent text-white' : 'bg-accent-soft text-accent'}`}>{i + 1}</span>
              <div className="block whitespace-nowrap overflow-hidden text-ellipsis text-sm"><b>{t.drug.name}</b> <small className="text-mut text-xs">{t.drug.code}</small></div>
              <div className="h-[9px] bg-[#eef2f5] rounded-full overflow-hidden max-[700px]:col-span-full max-[700px]:order-5">
                <i className="block h-full bg-linear-to-r from-[#4a6fd1] to-accent rounded-full min-w-[3px]" style={{ width: `${(t.used / max) * 100}%` }} />
              </div>
              <div className="block whitespace-nowrap text-right"><b className="text-[14.5px]">{fmt(t.used)}</b> <small className="text-mut text-xs">{t.drug.unit} · {fmt(t.used / top, 1)}/วัน</small></div>
            </div>
          ))}
          {top5.length === 0 && <p className="text-mut">ไม่พบข้อมูล</p>}
        </div>
      </div>
      <Chips v={uf} set={setUf} items={[['all', `ทั้งหมด (${useAll.length})`], ['exp', `เตือนหมดอายุ (${uc('exp')})`], ['nm', `ไม่เคลื่อนไหว (${uc('nm')})`], ['os', `Overstock (${uc('os')})`], ['note', `📝 มีหมายเหตุ (${uc('note')})`]]} />
      <div className={card}>
        <div className="hscroll overflow-auto max-h-[calc(100vh-200px)]">
        <table className="w-full border-separate border-spacing-0">
          <thead><tr><Th>ยา / รหัสยา</Th>{clinic === 'all' && <Th>คลินิก</Th>}<Th n>คงเหลือ</Th><Th n>เฉลี่ยอัตราการใช้ {top} วัน</Th><Th n>เฉลี่ย/วัน</Th><Th n>ใช้ได้อีก</Th><Th>Exp ใกล้สุด</Th><Th>สถานะการใช้</Th><Th>หมายเหตุ</Th></tr></thead>
          <tbody className="[&>tr:last-child>td]:border-b-0">
            {useRows.map((r) => (
              <tr key={r.key} className={`cursor-pointer ${ROW[r.worst]}`} onClick={() => setSel(r.key)}>
                <Td>{r.drug.name}<div className="text-xs text-mut leading-[1.3]">{r.drug.code}</div></Td>{clinic === 'all' && <Td>{r.clinic}</Td>}
                <Td n>{fmt(r.stock)}</Td><Td n>{fmt(u(r).used)}</Td>
                <Td n>{u(r).avg ? fmt(u(r).avg, 2) : '—'}</Td><Td n>{r.tracked === false ? <span className="text-mut">ไม่ติดตาม</span> : u(r).cv === Infinity ? <span className="text-mut">ไม่มีการใช้</span> : cov(u(r).cv)}</Td>
                <Td className="font-bold text-[15.5px]"><div>{thDate(r.nearest.exp)}{r.worst === 'expired' && <span className={pillCls('expired', { small: true })}>{EXP_LABEL.expired}</span>}</div><div className="text-xs text-mut leading-[1.3] font-normal">{r.nearest.lot} · เหลือ {dayTxt(r.nearest.exp)}</div></Td>
                <Td>{r.noMove || r.overstock || r.low ? <Flags r={r} /> : <span className="text-mut">ปกติ</span>}</Td>
                <Td onClick={(e) => e.stopPropagation()}><input className={noteCls(notes[r.key])} placeholder="+ หมายเหตุ" value={notes[r.key] || ''} onChange={(e) => setNotes({ ...notes, [r.key]: e.target.value })} /></Td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
        <div className="px-5 py-3 border-t border-line text-[13px] text-mut">รวมรายการในมุมมองนี้: <b className="text-ink">{useRows.length} รายการ</b> · ปริมาณคงเหลือรวม <b className="text-ink">{fmt(useRows.reduce((a, r) => a + r.stock, 0))}</b> หน่วย</div>
      </div>
    </>
  )
}