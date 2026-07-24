import { Link } from 'react-router-dom'
import type { Imovel } from '../types/imovel'

const formatador = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

const STATUS_ESTILO: Record<Imovel['status'], string> = {
  LOCADO: 'bg-emerald-100 text-emerald-800',
  VAGO: 'bg-slate-100 text-slate-700',
  ATIVO_INTERNO: 'bg-blue-100 text-blue-800',
  LOCADO_PARCIAL: 'bg-amber-100 text-amber-800',
}

export function ImoveisTable({ imoveis }: { imoveis: Imovel[] }) {
  if (imoveis.length === 0) {
    return <p className="p-8 text-center text-sm text-slate-400">Nenhum imóvel encontrado com os filtros atuais.</p>
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
          <tr>
            <th className="px-4 py-2">Endereço</th>
            <th className="px-4 py-2">Município</th>
            <th className="px-4 py-2">Tipo</th>
            <th className="px-4 py-2">Situação</th>
            <th className="px-4 py-2">Área (m²)</th>
            <th className="px-4 py-2">Aluguel</th>
          </tr>
        </thead>
        <tbody>
          {imoveis.map((imovel) => (
            <tr key={imovel.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
              <td className="px-4 py-2">
                <Link to={`/imoveis/${imovel.id}`} className="font-medium text-slate-900 hover:underline">
                  {imovel.endereco}
                </Link>
                {!imovel.enderecoRevisado && (
                  <span className="ml-2 rounded bg-amber-50 px-1.5 py-0.5 text-[10px] font-medium text-amber-700">revisar endereço</span>
                )}
              </td>
              <td className="px-4 py-2 text-slate-600">{imovel.municipio ?? '—'}</td>
              <td className="px-4 py-2 text-slate-600">{imovel.tipo}</td>
              <td className="px-4 py-2">
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_ESTILO[imovel.status]}`}>{imovel.status.replace('_', ' ')}</span>
              </td>
              <td className="px-4 py-2 text-slate-600">{imovel.areaConstruida ?? imovel.areaTerreno ?? '—'}</td>
              <td className="px-4 py-2 text-slate-600">{imovel.locacao.valorAluguel != null ? formatador.format(imovel.locacao.valorAluguel) : '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
