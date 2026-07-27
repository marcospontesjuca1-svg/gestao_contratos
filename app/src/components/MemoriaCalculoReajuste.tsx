import { useState } from 'react'
import { atualizarImovel } from '../services/imoveisService'
import { useAuth } from '../lib/auth'
import {
  INDICES,
  MESES,
  buscarSerieIndice,
  calcularFatorAcumulado,
  interpretarReajuste,
  janelaDozeMeses,
  type PontoIndice,
} from '../lib/reajuste'
import type { Imovel } from '../types/imovel'

const formatadorMoeda = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
const formatadorPercentual = new Intl.NumberFormat('pt-BR', { style: 'percent', minimumFractionDigits: 2, maximumFractionDigits: 4 })

interface Resultado {
  pontos: PontoIndice[]
  fator: number
  valorAtual: number
  novoValor: number
  janela: { inicio: Date; fim: Date }
}

export function MemoriaCalculoReajuste({ imovel, onFechar, onSalvo }: { imovel: Imovel; onFechar: () => void; onSalvo: () => void }) {
  const { user } = useAuth()
  const sugestao = interpretarReajuste(imovel.locacao.reajuste)
  const [mes, setMes] = useState<number>(sugestao.mes ?? new Date().getMonth() + 1)
  const [ano, setAno] = useState<number>(new Date().getFullYear())
  const [indiceCodigo, setIndiceCodigo] = useState<string>(sugestao.indice ?? 'IPCA')
  const [carregando, setCarregando] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [resultado, setResultado] = useState<Resultado | null>(null)

  const indice = INDICES.find((i) => i.codigo === indiceCodigo) ?? INDICES[0]
  const valorAtual = imovel.locacao.valorAluguel ?? 0

  async function handleCalcular() {
    setErro(null)
    setResultado(null)
    setCarregando(true)
    try {
      const janela = janelaDozeMeses(mes, ano)
      const pontos = await buscarSerieIndice(indice, janela.inicio, janela.fim)
      if (pontos.length === 0) throw new Error('O Banco Central não retornou dados para esse período — confira mês/ano.')
      const fator = calcularFatorAcumulado(pontos)
      const novoValor = Number((valorAtual * (1 + fator)).toFixed(2))
      setResultado({ pontos, fator, valorAtual, novoValor, janela })
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Não foi possível calcular o reajuste. Tente novamente.')
    } finally {
      setCarregando(false)
    }
  }

  async function handleSalvar() {
    if (!user || !resultado) return
    setSalvando(true)
    try {
      await atualizarImovel(
        imovel.id,
        {
          locacao: {
            ...imovel.locacao,
            valorAluguel: resultado.novoValor,
            valorM2: imovel.areaConstruida ? Number((resultado.novoValor / imovel.areaConstruida).toFixed(2)) : imovel.locacao.valorM2,
          },
        },
        user.uid,
      )
      onSalvo()
    } finally {
      setSalvando(false)
    }
  }

  function handleImprimir() {
    window.print()
  }

  return (
    <div className="memoria-impressao fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 print:static print:bg-white print:p-0">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white p-6 shadow-xl print:max-h-none print:overflow-visible print:shadow-none">
        <div className="mb-4 flex items-start justify-between print:hidden">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Reajuste contratual</h3>
            <p className="text-sm text-slate-500">{imovel.endereco}</p>
          </div>
          <button onClick={onFechar} className="text-slate-400 hover:text-slate-700">
            ✕
          </button>
        </div>

        <div className="mb-4 grid grid-cols-3 gap-3 print:hidden">
          <label className="text-sm">
            <span className="mb-1 block text-xs uppercase tracking-wide text-slate-400">Mês do reajuste</span>
            <select className="input" value={mes} onChange={(e) => setMes(Number(e.target.value))}>
              {MESES.map((m) => (
                <option key={m.numero} value={m.numero}>
                  {m.nome}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-xs uppercase tracking-wide text-slate-400">Ano de referência</span>
            <input type="number" className="input" value={ano} onChange={(e) => setAno(Number(e.target.value))} />
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-xs uppercase tracking-wide text-slate-400">Índice</span>
            <select className="input" value={indiceCodigo} onChange={(e) => setIndiceCodigo(e.target.value)}>
              {INDICES.map((i) => (
                <option key={i.codigo} value={i.codigo}>
                  {i.nome}
                </option>
              ))}
            </select>
          </label>
        </div>

        <button
          onClick={handleCalcular}
          disabled={carregando}
          className="mb-4 rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50 print:hidden"
        >
          {carregando ? 'Buscando no Banco Central…' : 'Calcular reajuste'}
        </button>

        {erro && <p className="mb-4 text-sm text-red-600 print:hidden">{erro}</p>}

        {resultado && (
          <div className="space-y-4 border-t border-slate-200 pt-4">
            <div>
              <h4 className="text-base font-semibold text-slate-900">Memória de cálculo</h4>
              <p className="text-xs text-slate-500">
                {imovel.endereco} — Locatário: {imovel.locacao.locatario ?? '—'}
              </p>
            </div>

            <p className="text-sm text-slate-700">
              Índice: <strong>{indice.nome}</strong> · Período acumulado: <strong>{MESES.find((m) => m.numero === resultado.janela.inicio.getMonth() + 1)?.nome}/{resultado.janela.inicio.getFullYear()}</strong> a{' '}
              <strong>{MESES.find((m) => m.numero === resultado.janela.fim.getMonth() + 1)?.nome}/{resultado.janela.fim.getFullYear()}</strong> (12 meses)
            </p>

            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 text-slate-500">
                <tr>
                  <th className="py-1">Competência</th>
                  <th className="py-1 text-right">Variação mensal</th>
                </tr>
              </thead>
              <tbody>
                {resultado.pontos.map((p) => (
                  <tr key={p.competencia} className="border-b border-slate-100">
                    <td className="py-1">{p.competencia}</td>
                    <td className="py-1 text-right">{formatadorPercentual.format(p.valorPercentual / 100)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="rounded-lg bg-slate-50 p-3 text-sm">
              <p>
                Fator acumulado: <strong>{formatadorPercentual.format(resultado.fator)}</strong>
              </p>
              <p>
                Valor atual: <strong>{formatadorMoeda.format(resultado.valorAtual)}</strong>
              </p>
              <p className="text-base">
                Novo valor: <strong className="text-red-700">{formatadorMoeda.format(resultado.novoValor)}</strong>
              </p>
            </div>

            <p className="text-[11px] text-slate-400">
              Fonte: Banco Central do Brasil — Sistema Gerenciador de Séries Temporais (SGS), série {indice.serieSgs} ({indice.nome}).
              https://api.bcb.gov.br/dados/serie/bcdata.sgs.{indice.serieSgs}/dados. Cálculo por acumulação simples da variação mensal
              nos 12 meses cheios anteriores ao mês de reajuste. Gerado em {new Date().toLocaleString('pt-BR')}.
            </p>

            <div className="flex gap-2 print:hidden">
              <button onClick={handleImprimir} className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
                Imprimir memória de cálculo
              </button>
              <button
                onClick={handleSalvar}
                disabled={salvando}
                className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                {salvando ? 'Salvando…' : 'Salvar novo valor no cadastro'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
