import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../lib/auth'

const linkClasse = ({ isActive }: { isActive: boolean }) =>
  `block rounded-md px-3 py-2 text-sm font-medium ${
    isActive ? 'bg-slate-900 text-white' : 'text-slate-700 hover:bg-slate-100'
  }`

export function Layout() {
  const { usuario, perfil, logout } = useAuth()
  const isAdmin = perfil === 'admin'

  return (
    <div className="flex min-h-screen bg-slate-50">
      <aside className="w-60 shrink-0 border-r border-slate-200 bg-white p-4">
        <h1 className="mb-6 text-lg font-semibold text-slate-900">Gestão de Ativos</h1>
        <nav className="space-y-1">
          <NavLink to="/" end className={linkClasse}>
            Imóveis
          </NavLink>
          {isAdmin && (
            <NavLink to="/importacao" className={linkClasse}>
              Importação
            </NavLink>
          )}
          {isAdmin && (
            <NavLink to="/usuarios" className={linkClasse}>
              Usuários
            </NavLink>
          )}
          {isAdmin && (
            <NavLink to="/configuracoes" className={linkClasse}>
              Configurações
            </NavLink>
          )}
        </nav>
      </aside>
      <div className="flex flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-3">
          <div className="text-sm text-slate-500">
            {usuario?.nome} <span className="text-slate-300">·</span> {perfil}
          </div>
          <button onClick={() => logout()} className="text-sm text-slate-500 hover:text-slate-900">
            Sair
          </button>
        </header>
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
