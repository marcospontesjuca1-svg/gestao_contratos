import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { escutarImoveis } from '../services/imoveisService'
import { MemoriaCalculoReajuste } from '../components/MemoriaCalculoReajuste'
import { MESES, interpretarReajuste } from '../lib/reajuste'
import type { Imovel } from '../types/imovel'

const formatadorMoeda = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

export function ReajusteContratualPage() {
  const [imoveis, setImoveis] = useState<Imovel[]>([])
  const [carregando, setCarregando] = useState(true)
  const [mesFiltro, setMesFiltro] = useState<number>(new Date().getMonth() + 1)
  const [selecionado, setSelecionado] = useState<Imovel | null>(null)

  useEffect(() => {
    return escutarImoveis({ campos: {} }, (dados) => {
      setImoveis(dados)
      setCarregando(false)
    })
  }, [])

  const contratosDoMes = useMemo(() => {
    return imoveis
      .filter((i) => i.status === 'LOCADO' || i.status === 'LOCADO_PARCIAL')
      .map((i) => ({ imovel: i, ...interpretarReajuste(i.locacao.reajuste) }))
      .filter((r) => r.mes === mesFiltro)
  }, [imoveis, mesFiltro])

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold text-slate-900">Reajuste Contratual</h2>
        <p className="text-sm text-slate-500">
          Selecione o mês de reajuste (campo "Reajuste" do contrato, ex.: "MAR / IPCA") para ver os contratos elegíveis, calcular o
          reajuste com base nos índices oficiais do Banco Central e salvar o novo valor.
        </p>
      </div>

      <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <label className="text-sm">
          <span className="mb-1 block text-xs uppercase tracking-wide text-slate-400">Mês de reajuste</span>
          <select className="input" value={mesFiltro} onChange={(e) => setMesFiltro(Number(e.target.value))}>
            {MESES.map((m) => (
              <option key={m.numero} value={m.numero}>
                {m.nome}
              </option>
            ))}
          </select>
        </label>
        <p className="text-sm text-slate-500">
          {contratosDoMes.length} contrato{contratosDoMes.length === 1 ? '' : 's'} com reajuste em {MESES.find((m) => m.numero === mesFiltro)?.nome}
        </p>
      </div>

      {carregando ? (
        <p className="p-8 text-center text-sm text-slate-400">Carregando…</p>
      ) : contratosDoMes.length === 0 ? (
        <p className="p-8 text-center text-sm text-slate-400">Nenhum contrato locado com reajuste marcado para esse mês.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-2">Endereço</th>
                <th className="px-4 py-2">Locatário</th>
                <th className="px-4 py-2">Reajuste (planilha)</th>
                <th className="px-4 py-2">Índice sugerido</th>
                <th className="px-4 py-2">Valor atual</th>
                <th className="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {contratosDoMes.map(({ imovel, indice }) => (
                <tr key={imovel.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                  <td className="px-4 py-2">
                    <Link to={`/imoveis/${imovel.id}`} className="font-medium text-slate-900 hover:underline">
                      {imovel.endereco}
                    </Link>
                  </td>
                  <td className="px-4 py-2 text-slate-600">{imovel.locacao.locatario ?? '—'}</td>
                  <td className="px-4 py-2 text-slate-600">{imovel.locacao.reajuste ?? '—'}</td>
                  <td className="px-4 py-2 text-slate-600">{indice ?? 'IPCA (padrão)'}</td>
                  <td className="px-4 py-2 text-slate-600">
                    {imovel.locacao.valorAluguel != null ? formatadorMoeda.format(imovel.locacao.valorAluguel) : '—'}
                  </td>
                  <td className="px-4 py-2">
                    <button onClick={() => setSelecionado(imovel)} className="rounded-md border border-slate-300 px-3 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50">
                      Atualizar contrato
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selecionado && (
        <MemoriaCalculoReajuste
          imovel={selecionado}
          onFechar={() => setSelecionado(null)}
          onSalvo={() => setSelecionado(null)}
        />
      )}
    </div>
  )
}
