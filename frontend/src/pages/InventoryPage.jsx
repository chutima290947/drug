import { fmt, baht, thDate, dayTxt } from '../utils.js'
import { Pill, Flags, Chips, SC, Th, Td } from '../components/ui.jsx'
import { card, ROW, noteCls, btnGhost, btnPrimary } from '../classes.js'

export default function InventoryPage({ d }) {
  const { cfg, lotRows, invRows, cnt, qty, val, fs, setFs, rowMap, notes, setNotes, setSel, del, picked, pickToggle, pickMany, clearPick, exportCsv, printReport } = d
  const noteCount = lotRows.filter((l) => (notes[`${l.clinic}|${l.lot}`] || '').trim()).length // Lot ที่มีหมายเหตุ
  const allPicked = invRows.length > 0 && invRows.every((l) => picked.has(l.id))
  return (
    <>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(230px,1fr))] gap-4 mb-[22px]">
        <SC c="dk" t="หมดอายุห้ามใช้" n={cnt('expired')} u={`Lot (${fmt(qty('expired'))} หน่วย)`} sub={`รวมมูลค่า ${baht(val('expired'))}`} onClick={() => setFs(fs === 'expired' ? 'all' : 'expired')} />
        <SC c="rd" t={`ใกล้หมดอายุ (≤ ${cfg.redMonths} เดือน)`} n={cnt('red')} u="Lots" sub={`รวมมูลค่า ${baht(val('red'))}`} onClick={() => setFs(fs === 'red' ? 'all' : 'red')} />
        <SC c="or" t={`เฝ้าระวัง (≤ ${cfg.orangeMonths} เดือน)`} n={cnt('orange')} u={`Lot (${fmt(qty('orange'))} หน่วย)`} sub={`รวมมูลค่า ${baht(val('orange'))}`} onClick={() => setFs(fs === 'orange' ? 'all' : 'orange')} />
        <SC c="teal2" t="ปกติ (ระยะปลอดภัย)" n={cnt('ok')} u={`Lots (${fmt(qty('ok'))} หน่วย)`} sub={`รวมมูลค่า ${baht(val('ok'))}`} onClick={() => setFs(fs === 'ok' ? 'all' : 'ok')} />
      </div>
      <Chips v={fs} set={setFs} items={[['all', `ทั้งหมด (${lotRows.length})`], ['expired', `หมดอายุห้ามใช้ (${cnt('expired')})`], ['red', `ใกล้หมดอายุ (${cnt('red')})`], ['orange', `เฝ้าระวัง (${cnt('orange')})`], ['soon', `ใกล้หมดอายุ ≤ ${cfg.orangeMonths} เดือน (${cnt('red') + cnt('orange')})`], ['ok', `ปกติ (${cnt('ok')})`], ['note', `📝 มีหมายเหตุ (${noteCount})`]]} />
      <div className="flex items-center gap-2.5 flex-wrap mb-3.5 print:hidden">
        <button className={btnPrimary} onClick={printReport}>🖨 พิมพ์รายงาน ({picked.size ? `เลือก ${picked.size}` : `ที่แสดง ${invRows.length}`})</button>
        {picked.size > 0 && <button className={btnGhost} onClick={clearPick}>ล้างการเลือก</button>}
        <span className="text-[13px] text-mut">ติ๊กเลือกแถวที่ต้องการ หรือไม่เลือกเลยเพื่อพิมพ์ทุกแถวที่แสดงอยู่</span>
      </div>
      <div className={`${card} overflow-auto`}>
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
        <div className="px-5 py-3 border-t border-line text-[13px] text-mut">แสดง <b className="text-ink">{invRows.length}</b> รายการ · มูลค่ารวม <b className="text-ink">{baht(invRows.reduce((a, l) => a + l.qty * l.drug.price, 0))}</b> · คลิกที่แถวเพื่อดูรายละเอียด</div>
      </div>
    </>
  )
}