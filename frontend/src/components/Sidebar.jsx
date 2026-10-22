const Ico = ({ children }) => (
  <svg className="flex-none text-[#6b7691] group-aria-[current=page]:text-[#1b2559]" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor"
       strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{children}</svg>
)

const icons = {
  dash: <Ico><rect x="3" y="3" width="7" height="9" rx="1.5" /><rect x="14" y="3" width="7" height="5" rx="1.5" /><rect x="14" y="12" width="7" height="9" rx="1.5" /><rect x="3" y="16" width="7" height="5" rx="1.5" /></Ico>,
  inv: <Ico><rect x="3" y="4" width="18" height="4.5" rx="1" /><path d="M5 8.5V19a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8.5" /><path d="M10 12.5h4" /></Ico>,
  use: <Ico><rect x="3.5" y="4" width="17" height="17" rx="3" /><path d="M9 4V3h6v1" /><path d="M12 9v8M8 13h8" /></Ico>,
  news: <Ico><path d="M4 5h13a1 1 0 0 1 1 1v13H6a2 2 0 0 1-2-2z" /><path d="M18 9h2v9a1 1 0 0 1-2 0" /><path d="M8 9h6M8 13h6" /></Ico>,
  alert: <Ico><path d="M6 8a6 6 0 1 1 12 0c0 7 3 8.5 3 8.5H3S6 15 6 8" /><path d="M10.3 20a1.9 1.9 0 0 0 3.4 0" /><path d="M4 3.5 2.5 5M20 3.5 21.5 5" /></Ico>,
}

const nav = [
  ['dash', 'Dashboard'],
  ['inv', 'คลังยา / Lot'],
  ['use', 'การใช้ยา'],
  ['alert', 'แจ้งเตือน'],
  ['news', 'ข่าวสาร'],
]

const navBase = 'group relative flex gap-3 items-center w-full border-0 px-3 py-[13px] rounded-xl text-sm font-medium text-left mb-1 cursor-pointer max-[1000px]:w-auto max-[1000px]:whitespace-nowrap max-[1000px]:m-0'
const navOn = 'bg-[#eef1fc] text-[#1b2559] font-semibold before:content-[\'\'] before:absolute before:-left-3.5 before:top-1.5 before:bottom-1.5 before:w-1 before:rounded-r-[4px] before:bg-[#1b2559] max-[1000px]:before:hidden'
const navOff = 'bg-transparent text-[#4a5568] hover:bg-head'

const legend = [
  ['bg-dk', 'หมดอายุห้ามใช้'],
  ['bg-rd', 'ใกล้หมดอายุ แลกเปลี่ยน'],
  ['bg-or', 'เฝ้าระวัง'],
  ['bg-[#7a68d6]', 'Overstock'],
  ['bg-[#8a96a3]', 'ไม่เคลื่อนไหว'],
]

export default function Sidebar({ tab, setTab, badge, newsCount = 0, onLogout }) {
  return (
    <aside className="w-[260px] flex-none bg-white border-r border-line px-3.5 py-[18px] flex flex-col sticky top-0 h-screen
                      max-[1000px]:w-full max-[1000px]:h-auto max-[1000px]:static max-[1000px]:border-r-0 max-[1000px]:border-b max-[1000px]:flex-row max-[1000px]:overflow-x-auto max-[1000px]:px-2.5 max-[1000px]:py-2 max-[1000px]:items-center max-[1000px]:gap-1 print:hidden">
      <img className="w-full max-w-[190px] mt-1 mx-1.5 mb-[26px] max-[1000px]:hidden" src="/logo.png" alt="Bangkok Hospital Siriroj" />
      <div className="text-[12.5px] font-semibold text-[#8d97b0] mt-0.5 mx-3.5 mb-2.5 max-[1000px]:hidden"></div>
      {nav.map(([k, label]) => (
        <button key={k} className={`${navBase} ${tab === k ? navOn : navOff}`} onClick={() => setTab(k)}
                aria-current={tab === k ? 'page' : undefined}>
          {icons[k]}
          <span className="whitespace-nowrap">{label}</span>
          {k === 'dash' && badge > 0 && <i className="ml-auto w-2 h-2 rounded-full bg-rd flex-none" aria-label="มีรายการแจ้งเตือน" />}
          {k === 'alert' && badge > 0 && <i className="ml-auto bg-rd text-white rounded-full text-xs font-semibold not-italic px-[9px] py-px">{badge}</i>}
          {k === 'news' && newsCount > 0 && <i className="ml-auto bg-accent text-white rounded-full text-xs font-semibold not-italic px-[9px] py-px" aria-label={`มี ${newsCount} ข่าว`}>{newsCount}</i>}
        </button>
      ))}
      <div className="mt-auto border border-line rounded-[14px] p-3.5 text-[13.5px] max-[1000px]:hidden">
        <h4 className="text-[11.5px] font-bold tracking-[.08em] text-mut mb-2">STATUS LEGEND</h4>
        {legend.map(([bg, label]) => (
          <p key={label} className="flex items-center gap-[9px] my-[5px]"><i className={`inline-block w-2.5 h-2.5 rounded-full flex-none ${bg}`} />{label}</p>
        ))}
      </div>
      <button onClick={onLogout}
        className="w-full mt-3 flex items-center justify-center gap-2 border border-line rounded-xl bg-white px-3 py-2.5 text-sm font-medium text-[#4a5568] cursor-pointer hover:bg-head max-[1000px]:w-auto max-[1000px]:mt-0 max-[1000px]:ml-auto max-[1000px]:whitespace-nowrap">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><path d="M16 17l5-5-5-5" /><path d="M21 12H9" /></svg>
        ออกจากระบบ
      </button>
    </aside>
  )
}