import { useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { Logo } from './Logo'

const linkClasse = ({ isActive }: { isActive: boolean }) =>
  `flex items-center gap-2.5 rounded-md border-l-4 px-3 py-2 text-sm font-medium transition-colors ${
    isActive ? 'border-red-600 bg-red-50 text-red-700' : 'border-transparent text-slate-600 hover:bg-slate-50 hover:text-slate-900'
  }`

function IconPainel() {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.75} stroke="currentColor" className="h-4 w-4 shrink-0">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 13h4v8H3zM10 8h4v13h-4zM17 3h4v18h-4z" />
    </svg>
  )
}

function IconImoveis() {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.75} stroke="currentColor" className="h-4 w-4 shrink-0">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 10.5 12 4l9 6.5M5 9v10h14V9M9.5 19v-5h5v5" />
    </svg>
  )
}

function IconReajuste() {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.75} stroke="currentColor" className="h-4 w-4 shrink-0">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 7h11M4 7l3-3M4 7l3 3M20 17H9M20 17l-3-3M20 17l-3 3" />
    </svg>
  )
}

function IconConfig() {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.75} stroke="currentColor" className="h-4 w-4 shrink-0">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M10.5 3.5h3l.5 2.3a6.9 6.9 0 0 1 1.9 1.1l2.3-.7 1.5 2.6-1.8 1.6a7 7 0 0 1 0 2.2l1.8 1.6-1.5 2.6-2.3-.7a6.9 6.9 0 0 1-1.9 1.1l-.5 2.3h-3l-.5-2.3a6.9 6.9 0 0 1-1.9-1.1l-2.3.7-1.5-2.6 1.8-1.6a7 7 0 0 1 0-2.2L4.3 8.8l1.5-2.6 2.3.7a6.9 6.9 0 0 1 1.9-1.1z"
      />
      <circle cx="12" cy="12" r="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function IconMenu() {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth={2} stroke="currentColor" className="h-6 w-6">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  )
}

function IconFechar() {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth={2} stroke="currentColor" className="h-5 w-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 6l12 12M18 6L6 18" />
    </svg>
  )
}

export function Layout() {
  const { usuario, perfil, logout } = useAuth()
  const isAdmin = perfil === 'admin'
  const [menuAberto, setMenuAberto] = useState(false)
  const fecharMenu = () => setMenuAberto(false)

  return (
    <div className="flex min-h-screen bg-slate-50">
      {menuAberto && <div className="fixed inset-0 z-40 bg-slate-900/50 md:hidden" onClick={fecharMenu} />}

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 overflow-y-auto border-r border-slate-200 bg-white p-4 transition-transform duration-200 md:static md:z-auto md:w-60 md:shrink-0 md:translate-x-0 ${
          menuAberto ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="mb-6 flex items-center justify-between">
          <Logo />
          <button onClick={fecharMenu} className="text-slate-400 hover:text-slate-700 md:hidden">
            <IconFechar />
          </button>
        </div>
        <p className="mb-4 text-xs font-medium uppercase tracking-wide text-slate-400">Gestão de Ativos</p>
        <nav className="space-y-1">
          <NavLink to="/" end className={linkClasse} onClick={fecharMenu}>
            <IconPainel />
            Painel Gerencial
          </NavLink>
          <NavLink to="/imoveis" className={linkClasse} onClick={fecharMenu}>
            <IconImoveis />
            Imóveis
          </NavLink>
          {isAdmin && (
            <NavLink to="/reajuste" className={linkClasse} onClick={fecharMenu}>
              <IconReajuste />
              Reajuste Contratual
            </NavLink>
          )}
          {isAdmin && (
            <NavLink to="/configuracoes" className={linkClasse} onClick={fecharMenu}>
              <IconConfig />
              Configurações
            </NavLink>
          )}
        </nav>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between gap-2 border-b border-slate-200 bg-white px-4 py-3 shadow-sm md:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <button onClick={() => setMenuAberto(true)} className="text-slate-500 hover:text-slate-900 md:hidden">
              <IconMenu />
            </button>
            <div className="flex min-w-0 items-center gap-2 text-sm text-slate-600">
              <span className="truncate font-medium text-slate-900">{usuario?.nome}</span>
              <span
                className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                  perfil === 'admin' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-600'
                }`}
              >
                {perfil}
              </span>
            </div>
          </div>
          <button onClick={() => logout()} className="shrink-0 text-sm font-medium text-slate-500 hover:text-red-600">
            Sair
          </button>
        </header>
        <main className="min-w-0 flex-1 overflow-x-auto p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
