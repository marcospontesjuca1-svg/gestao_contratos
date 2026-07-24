import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { escutarImoveis } from '../services/imoveisService'
import { MapaOperacoes } from '../components/MapaOperacoes'
import type { Imovel, StatusImovel, TipoImovel } from '../types/imovel'

const formatadorMoeda = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })
const formatadorNumero = new Intl.NumberFormat('pt-BR')

const STATUS_LABEL: Record<StatusImovel, string> = {
  LOCADO: 'Locados',
  VAGO: 'Disponíveis',
  ATIVO_INTERNO: 'Uso interno',
  LOCADO_PARCIAL: 'Locado parcial',
}

function contarPor<T extends string>(imoveis: Imovel[], campo: (i: Imovel) => T): Record<string, number> {
  const contagem: Record<string, number> = {}
  for (const imovel of imoveis) {
    const chave = campo(imovel)
    contagem[chave] = (contagem[chave] ?? 0) + 1
  }
  return contagem
}

type Cor = 'esmeralda' | 'indigo' | 'ambar' | 'azul' | 'violeta' | 'rosa'

const BORDA_COR: Record<Cor, string> = {
  esmeralda: 'border-t-emerald-500',
  indigo: 'border-t-indigo-500',
  ambar: 'border-t-amber-500',
  azul: 'border-t-blue-500',
  violeta: 'border-t-violet-500',
  rosa: 'border-t-rose-500',
}

function StatCard({ titulo, valor, cor, destaque }: { titulo: string; valor: string; cor?: Cor; destaque?: boolean }) {
  if (destaque) {
    return (
      <div className="rounded-xl bg-gradient-to-br from-red-600 to-red-800 p-4 text-white shadow-sm">
        <p className="text-xs uppercase tracking-wide text-red-100">{titulo}</p>
        <p className="mt-1 text-2xl font-semibold">{valor}</p>
      </div>
    )
  }
  return (
    <div className={`rounded-xl border-t-4 ${cor ? BORDA_COR[cor] : 'border-t-slate-300'} border-x border-b border-slate-200 bg-white p-4 shadow-sm`}>
      <p className="text-xs uppercase tracking-wide text-slate-400">{titulo}</p>
      <p className="mt-1 text-2xl font-semibold text-slate-900">{valor}</p>
    </div>
  )
}

function Barra({ label, valor, total }: { label: string; valor: number; total: number }) {
  const pct = total > 0 ? Math.round((valor / total) * 100) : 0
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs text-slate-600">
        <span>{label}</span>
        <span>
          {valor} ({pct}%)
        </span>
      </div>
      <div className="h-2 rounded-full bg-slate-100">
        <div className="h-2 rounded-full bg-red-600" style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

export function DashboardPage() {
  const [imoveis, setImoveis] = useState<Imovel[]>([])
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    return escutarImoveis({}, (dados) => {
      setImoveis(dados)
      setCarregando(false)
    })
  }, [])

  const stats = useMemo(() => {
    const total = imoveis.length
    const porStatus = contarPor(imoveis, (i) => i.status as StatusImovel)
    const porTipo = contarPor(imoveis, (i) => i.tipo as TipoImovel)
    const porMunicipio = contarPor(imoveis, (i) => i.municipio ?? 'Não informado')

    const locados = imoveis.filter((i) => i.status === 'LOCADO' || i.status === 'LOCADO_PARCIAL')
    const disponiveisParaLocacao = imoveis.filter((i) => i.status !== 'ATIVO_INTERNO')
    const taxaOcupacao = disponiveisParaLocacao.length > 0 ? Math.round((locados.length / disponiveisParaLocacao.length) * 100) : 0

    const receitaMensal = locados.reduce((soma, i) => soma + (i.locacao.valorAluguel ?? 0), 0)
    const valorContabilTotal = imoveis.reduce((soma, i) => soma + (i.valorContabil ?? 0), 0)
    const valorMercadoTotal = imoveis.reduce((soma, i) => soma + (i.valorMercadoImovel ?? 0), 0)
    const areaConstruidaTotal = imoveis.reduce((soma, i) => soma + (i.areaConstruida ?? 0), 0)
    const areaTerrenoTotal = imoveis.reduce((soma, i) => soma + (i.areaTerreno ?? 0), 0)
    const pendentesRevisao = imoveis.filter((i) => !i.enderecoRevisado).length

    const topMunicipios = Object.entries(porMunicipio)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)

    const tiposOrdenados = Object.entries(porTipo).sort((a, b) => b[1] - a[1])

    return {
      total,
      porStatus,
      taxaOcupacao,
      receitaMensal,
      valorContabilTotal,
      valorMercadoTotal,
      areaConstruidaTotal,
      areaTerrenoTotal,
      pendentesRevisao,
      porMunicipio,
      topMunicipios,
      tiposOrdenados,
    }
  }, [imoveis])

  if (carregando) return <p className="text-sm text-slate-400">Carregando painel…</p>

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-slate-900">Painel Gerencial</h2>
        <p className="text-sm text-slate-500">Visão geral da carteira de imóveis</p>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard titulo="Total de imóveis" valor={formatadorNumero.format(stats.total)} destaque />
        <StatCard titulo="Taxa de ocupação" valor={`${stats.taxaOcupacao}%`} cor="esmeralda" />
        <StatCard titulo="Receita mensal (locação)" valor={formatadorMoeda.format(stats.receitaMensal)} cor="indigo" />
        <StatCard titulo="Área construída total" valor={`${formatadorNumero.format(Math.round(stats.areaConstruidaTotal))} m²`} cor="ambar" />
        <StatCard titulo="Área de terreno total" valor={`${formatadorNumero.format(Math.round(stats.areaTerrenoTotal))} m²`} cor="ambar" />
        <StatCard titulo="Valor contábil total" valor={formatadorMoeda.format(stats.valorContabilTotal)} cor="azul" />
        <StatCard titulo="Valor de mercado total" valor={formatadorMoeda.format(stats.valorMercadoTotal)} cor="violeta" />
        <StatCard titulo="Pendentes de revisão" valor={formatadorNumero.format(stats.pendentesRevisao)} cor="rosa" />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <h3 className="mb-3 text-sm font-semibold text-slate-900">Situação dos imóveis</h3>
          <div className="space-y-3">
            {(Object.keys(STATUS_LABEL) as StatusImovel[]).map((status) => (
              <Barra key={status} label={STATUS_LABEL[status]} valor={stats.porStatus[status] ?? 0} total={stats.total} />
            ))}
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <h3 className="mb-3 text-sm font-semibold text-slate-900">Por tipo de imóvel</h3>
          <div className="space-y-3">
            {stats.tiposOrdenados.map(([tipo, valor]) => (
              <Barra key={tipo} label={tipo} valor={valor} total={stats.total} />
            ))}
          </div>
        </section>

        <section className="grid grid-cols-1 gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm lg:col-span-2 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <h3 className="mb-3 text-sm font-semibold text-slate-900">Onde estão nossos imóveis</h3>
            <MapaOperacoes imoveis={imoveis} />
          </div>
          <div>
            <h3 className="mb-3 text-sm font-semibold text-slate-900">Municípios com mais imóveis</h3>
            <div className="space-y-3">
              {stats.topMunicipios.map(([municipio, valor]) => (
                <Barra key={municipio} label={municipio} valor={valor} total={stats.total} />
              ))}
            </div>
          </div>
        </section>
      </div>

      {stats.pendentesRevisao > 0 && (
        <p className="text-sm text-amber-700">
          {stats.pendentesRevisao} imóve{stats.pendentesRevisao === 1 ? 'l está' : 'is estão'} com localização pendente de revisão.{' '}
          <Link to="/imoveis" className="underline">
            Ver na listagem
          </Link>
          .
        </p>
      )}
    </div>
  )
}
