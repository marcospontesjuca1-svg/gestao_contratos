/**
 * Recriação estilizada da marca "ER Participações" (aprox. via CSS, sem o
 * arquivo de arte original). Trocar por <img src="/logo.svg" /> assim que o
 * arquivo oficial estiver disponível.
 */
export function Logo({ className }: { className?: string }) {
  return (
    <div className={`select-none leading-none ${className ?? ''}`}>
      <div className="flex items-baseline gap-1.5">
        <span className="text-2xl font-semibold tracking-tighter text-slate-900" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
          ER
        </span>
        <span className="text-[11px] font-medium tracking-[0.25em] text-slate-500">PARTICIPAÇÕES</span>
      </div>
      <div className="mt-1.5 h-[3px] w-full bg-red-600" />
    </div>
  )
}
