import logoUrl from '../assets/logo-er-participacoes.png'

export function Logo({ className }: { className?: string }) {
  return <img src={logoUrl} alt="ER Participações" className={`h-auto w-40 select-none ${className ?? ''}`} />
}
