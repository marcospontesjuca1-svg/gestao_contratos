import type { ComparativoMercado as ComparativoMercadoType } from '../types/imovel'

const formatador = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

export function ComparativoMercado({ valorM2Imovel, comparativo }: { valorM2Imovel: number | null; comparativo: ComparativoMercadoType }) {
  const { valorM2Regiao } = comparativo

  if (valorM2Regiao == null) {
    return <p className="text-sm text-slate-400">Sem valor de mercado da região cadastrado.</p>
  }

  if (valorM2Imovel == null) {
    return <p className="text-sm text-slate-400">Imóvel sem R$/m² próprio calculado para comparar.</p>
  }

  const diferenca = (valorM2Imovel - valorM2Regiao) / valorM2Regiao
  const percentual = (diferenca * 100).toFixed(1)
  const cor = diferenca > 0.02 ? 'bg-emerald-100 text-emerald-800' : diferenca < -0.02 ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-700'
  const rotulo = diferenca > 0.02 ? 'Acima da média de mercado' : diferenca < -0.02 ? 'Abaixo da média de mercado' : 'Na média de mercado'

  return (
    <div className="space-y-1">
      <div className="flex gap-4 text-sm">
        <span>
          Imóvel: <strong>{formatador.format(valorM2Imovel)}/m²</strong>
        </span>
        <span>
          Região: <strong>{formatador.format(valorM2Regiao)}/m²</strong>
        </span>
      </div>
      <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${cor}`}>
        {rotulo} ({diferenca > 0 ? '+' : ''}
        {percentual}%)
      </span>
    </div>
  )
}
