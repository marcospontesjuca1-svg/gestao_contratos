import { useEffect, useState, type FormEvent } from 'react'
import { atualizarPerfilUsuario, criarPerfilUsuario, listarUsuarios } from '../services/usuariosService'
import type { Perfil, Usuario } from '../types/usuario'

export function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [carregando, setCarregando] = useState(true)
  const [novo, setNovo] = useState({ uid: '', nome: '', email: '', perfil: 'operador' as Perfil })
  const [criando, setCriando] = useState(false)

  async function recarregar() {
    setCarregando(true)
    setUsuarios(await listarUsuarios())
    setCarregando(false)
  }

  useEffect(() => {
    recarregar()
  }, [])

  async function handleCriar(e: FormEvent) {
    e.preventDefault()
    setCriando(true)
    try {
      await criarPerfilUsuario(novo.uid.trim(), { nome: novo.nome, email: novo.email, perfil: novo.perfil })
      setNovo({ uid: '', nome: '', email: '', perfil: 'operador' })
      await recarregar()
    } finally {
      setCriando(false)
    }
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-slate-900">Usuários</h2>
        <p className="text-sm text-slate-500">
          Perfis de acesso: <strong>admin</strong> (CRUD completo, importação, configurações e gestão de usuários) e{' '}
          <strong>operador</strong> (apenas consulta).
        </p>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white">
        {carregando ? (
          <p className="p-4 text-sm text-slate-400">Carregando…</p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-2">Nome</th>
                <th className="px-4 py-2">E-mail</th>
                <th className="px-4 py-2">Perfil</th>
                <th className="px-4 py-2">Ativo</th>
              </tr>
            </thead>
            <tbody>
              {usuarios.map((u) => (
                <tr key={u.uid} className="border-b border-slate-100 last:border-0">
                  <td className="px-4 py-2">{u.nome}</td>
                  <td className="px-4 py-2 text-slate-500">{u.email}</td>
                  <td className="px-4 py-2">
                    <select
                      className="rounded-md border border-slate-300 px-2 py-1 text-xs"
                      value={u.perfil}
                      onChange={(e) => atualizarPerfilUsuario(u.uid, { perfil: e.target.value as Perfil }).then(recarregar)}
                    >
                      <option value="admin">admin</option>
                      <option value="operador">operador</option>
                    </select>
                  </td>
                  <td className="px-4 py-2">
                    <input
                      type="checkbox"
                      checked={u.ativo}
                      onChange={(e) => atualizarPerfilUsuario(u.uid, { ativo: e.target.checked }).then(recarregar)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <form onSubmit={handleCriar} className="space-y-3 rounded-lg border border-slate-200 bg-white p-4">
        <h3 className="text-sm font-semibold text-slate-900">Vincular perfil a um usuário existente</h3>
        <p className="text-xs text-slate-500">
          Crie a credencial (e-mail/senha) no Console do Firebase Authentication primeiro, copie o UID gerado e informe abaixo para liberar o
          acesso ao sistema com o perfil desejado.
        </p>
        <div className="grid grid-cols-2 gap-3">
          <input required placeholder="UID (Firebase Auth)" className="input col-span-2" value={novo.uid} onChange={(e) => setNovo({ ...novo, uid: e.target.value })} />
          <input required placeholder="Nome" className="input" value={novo.nome} onChange={(e) => setNovo({ ...novo, nome: e.target.value })} />
          <input required type="email" placeholder="E-mail" className="input" value={novo.email} onChange={(e) => setNovo({ ...novo, email: e.target.value })} />
          <select className="input" value={novo.perfil} onChange={(e) => setNovo({ ...novo, perfil: e.target.value as Perfil })}>
            <option value="operador">operador</option>
            <option value="admin">admin</option>
          </select>
        </div>
        <button type="submit" disabled={criando} className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50">
          {criando ? 'Salvando…' : 'Vincular perfil'}
        </button>
      </form>
    </div>
  )
}
