import { useEffect, useState, type FormEvent } from 'react'
import { atualizarPerfilUsuario, criarPerfilUsuario, listarUsuarios } from '../services/usuariosService'
import { criarUsuarioAuth } from '../lib/criarUsuarioAuth'
import type { Perfil, Usuario } from '../types/usuario'

function mensagemDeErro(erro: unknown): string {
  const codigo = (erro as { code?: string })?.code
  if (codigo === 'auth/email-already-in-use') return 'Já existe uma conta com esse e-mail.'
  if (codigo === 'auth/weak-password') return 'A senha precisa ter pelo menos 6 caracteres.'
  if (codigo === 'auth/invalid-email') return 'E-mail inválido.'
  return 'Não foi possível criar o usuário. Tente novamente.'
}

export function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [carregando, setCarregando] = useState(true)
  const [novo, setNovo] = useState({ nome: '', email: '', senha: '', perfil: 'operador' as Perfil })
  const [criando, setCriando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

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
    setErro(null)
    setCriando(true)
    try {
      const uid = await criarUsuarioAuth(novo.email, novo.senha)
      await criarPerfilUsuario(uid, { nome: novo.nome, email: novo.email, perfil: novo.perfil })
      setNovo({ nome: '', email: '', senha: '', perfil: 'operador' })
      await recarregar()
    } catch (e) {
      setErro(mensagemDeErro(e))
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

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
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

      <form onSubmit={handleCriar} className="space-y-3 rounded-xl border border-slate-200 bg-white shadow-sm p-4">
        <h3 className="text-sm font-semibold text-slate-900">Criar novo usuário</h3>
        <p className="text-xs text-slate-500">Cria o login e o perfil de acesso de uma vez, direto por aqui.</p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <input required placeholder="Nome" className="input" value={novo.nome} onChange={(e) => setNovo({ ...novo, nome: e.target.value })} />
          <input required type="email" placeholder="E-mail" className="input" value={novo.email} onChange={(e) => setNovo({ ...novo, email: e.target.value })} />
          <input
            required
            type="password"
            minLength={6}
            placeholder="Senha (mín. 6 caracteres)"
            className="input"
            value={novo.senha}
            onChange={(e) => setNovo({ ...novo, senha: e.target.value })}
          />
          <select className="input" value={novo.perfil} onChange={(e) => setNovo({ ...novo, perfil: e.target.value as Perfil })}>
            <option value="operador">operador</option>
            <option value="admin">admin</option>
          </select>
        </div>
        {erro && <p className="text-sm text-red-600">{erro}</p>}
        <button type="submit" disabled={criando} className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50">
          {criando ? 'Criando…' : 'Criar usuário'}
        </button>
      </form>
    </div>
  )
}
