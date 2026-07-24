import { NavLink, Outlet } from 'react-router-dom'

const abaClasse = ({ isActive }: { isActive: boolean }) =>
  `border-b-2 px-3 py-2 text-sm font-medium ${
    isActive ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-500 hover:text-slate-800'
  }`

export function ConfiguracoesLayout() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-slate-900">Configurações</h2>
        <p className="text-sm text-slate-500">Backup, importação de planilha e gestão de usuários</p>
      </div>

      <nav className="flex gap-4 border-b border-slate-200">
        <NavLink to="/configuracoes" end className={abaClasse}>
          Backup
        </NavLink>
        <NavLink to="/configuracoes/importacao" className={abaClasse}>
          Importação
        </NavLink>
        <NavLink to="/configuracoes/usuarios" className={abaClasse}>
          Usuários
        </NavLink>
      </nav>

      <Outlet />
    </div>
  )
}
