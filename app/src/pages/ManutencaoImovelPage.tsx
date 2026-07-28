import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Timestamp } from 'firebase/firestore'
import { buscarImovel } from '../services/imoveisService'
import { criarManutencao, listarManutencoes, removerManutencao } from '../services/manutencaoService'
import { useAuth } from '../lib/auth'
import type { Imovel, RegistroManutencao } from '../types/imovel'

const formatadorMoeda = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
const formatadorData = new Intl.DateTimeFormat('pt-BR')

interface FormState {
  data: string
  tempoExecucao: string
  valor: string
  detalhamento: string
}

const FORM_VAZIO: FormState = { data: new Date().toISOString().slice(0, 10), tempoExecucao: '', valor: '', detalhamento: '' }

export function ManutencaoImovelPage() {
  const { id } = useParams<{ id: string }>()
  const { perfil, user } = useAuth()
  const [imovel, setImovel] = useState<Imovel | null | undefined>(undefined)
  const [registros, setRegistros] = useState<RegistroManutencao[]>([])
  const [carregando, setCarregando] = useState(true)
  const [form, setForm] = useState<FormState>(FORM_VAZIO)
  const [salvando, setSalvando] = useState(false)

  const carregar = useCallback(async () => {
    if (!id) return
    setCarregando(true)
    const [imovelCarregado, manutencoes] = await Promise.all([buscarImovel(id), listarManutencoes(id)])
    setImovel(imovelCarregado)
    setRegistros(manutencoes)
    setCarregando(false)
  }, [id])

  useEffect(() => {
    carregar()
  }, [carregar])

  async function handleSalvar() {
    if (!id || !user || !form.data || !form.detalhamento) return
    setSalvando(true)
    try {
      await criarManutencao(
        id,
        {
          data: Timestamp.fromDate(new Date(`${form.data}T00:00:00`)),
          tempoExecucao: form.tempoExecucao || null,
          valor: form.valor ? Number(form.valor) : null,
          detalhamento: form.detalhamento,
        },
        user.uid,
      )
      setForm(FORM_VAZIO)
      await carregar()
    } finally {
      setSalvando(false)
    }
  }

  async function handleExcluir(manutencaoId: string) {
    if (!id) return
    if (!confirm('Excluir este registro de manutenção?')) return
    await removerManutencao(id, manutencaoId)
    await carregar()
  }

  function handleImprimir() {
    window.print()
  }

  if (imovel === undefined || carregando) return <p className="text-sm text-slate-400">Carregando…</p>
  if (imovel === null) return <p className="text-sm text-red-600">Imóvel não encontrado.</p>

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between print:hidden">
        <div>
          <Link to={`/imoveis/${id}`} className="text-sm text-slate-500 hover:underline">
            ← Voltar
          </Link>
          <h2 className="text-xl font-semibold text-slate-900">Diário de manutenção</h2>
          <p className="text-sm text-slate-500">{imovel.endereco}</p>
        </div>
        <button onClick={handleImprimir} className="shrink-0 rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
          Imprimir diário
        </button>
      </div>

      {perfil === 'admin' && (
        <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm print:hidden">
          <h3 className="mb-3 text-sm font-semibold text-slate-900">Novo registro</h3>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <label className="text-sm">
              <span className="mb-1 block text-xs uppercase tracking-wide text-slate-400">Data</span>
              <input type="date" className="input" value={form.data} onChange={(e) => setForm({ ...form, data: e.target.value })} />
            </label>
            <label className="text-sm">
              <span className="mb-1 block text-xs uppercase tracking-wide text-slate-400">Tempo de execução</span>
              <input
                className="input"
                placeholder="Ex.: 3 dias, 4h"
                value={form.tempoExecucao}
                onChange={(e) => setForm({ ...form, tempoExecucao: e.target.value })}
              />
            </label>
            <label className="text-sm">
              <span className="mb-1 block text-xs uppercase tracking-wide text-slate-400">Valor (R$)</span>
              <input
                type="number"
                className="input"
                value={form.valor}
                onChange={(e) => setForm({ ...form, valor: e.target.value })}
              />
            </label>
            <div className="flex items-end">
              <button
                onClick={handleSalvar}
                disabled={salvando || !form.data || !form.detalhamento}
                className="w-full rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                {salvando ? 'Salvando…' : 'Adicionar registro'}
              </button>
            </div>
            <label className="text-sm sm:col-span-2 lg:col-span-4">
              <span className="mb-1 block text-xs uppercase tracking-wide text-slate-400">Detalhamento da obra/serviço</span>
              <textarea
                className="input"
                rows={3}
                value={form.detalhamento}
                onChange={(e) => setForm({ ...form, detalhamento: e.target.value })}
              />
            </label>
          </div>
        </section>
      )}

      <section className="memoria-impressao rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-3 hidden print:block">
          <h3 className="text-base font-semibold text-slate-900">Diário de manutenção — {imovel.endereco}</h3>
          <p className="text-xs text-slate-500">Impresso em {new Date().toLocaleString('pt-BR')}</p>
        </div>
        {registros.length === 0 ? (
          <p className="text-sm text-slate-400">Nenhum registro de manutenção cadastrado.</p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-400">
              <tr>
                <th className="py-2 pr-3">Data</th>
                <th className="py-2 pr-3">Tempo de execução</th>
                <th className="py-2 pr-3">Valor</th>
                <th className="py-2 pr-3">Detalhamento</th>
                {perfil === 'admin' && <th className="py-2 pr-3 print:hidden"></th>}
              </tr>
            </thead>
            <tbody>
              {registros.map((r) => (
                <tr key={r.id} className="border-b border-slate-100 align-top">
                  <td className="py-2 pr-3 whitespace-nowrap">{formatadorData.format(r.data.toDate())}</td>
                  <td className="py-2 pr-3">{r.tempoExecucao ?? '—'}</td>
                  <td className="py-2 pr-3 whitespace-nowrap">{r.valor != null ? formatadorMoeda.format(r.valor) : '—'}</td>
                  <td className="py-2 pr-3">{r.detalhamento}</td>
                  {perfil === 'admin' && (
                    <td className="py-2 pr-3 print:hidden">
                      <button onClick={() => handleExcluir(r.id)} className="text-xs text-red-600 hover:underline">
                        Excluir
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  )
}
