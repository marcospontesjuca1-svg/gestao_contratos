import { Link } from 'react-router-dom'
import { CAMPOS_RELATORIO, COLUNAS_PADRAO_TABELA } from '../lib/relatorio'
import type { Imovel } from '../types/imovel'

const STATUS_ESTILO: Record<Imovel['status'], string> = {
  LOCADO: 'bg-emerald-100 text-emerald-800',
  VAGO: 'bg-slate-100 text-slate-700',
  ATIVO_INTERNO: 'bg-blue-100 text-blue-800',
  LOCADO_PARCIAL: 'bg-amber-100 text-amber-800',
}

function CelulaEndereco({ imovel }: { imovel: Imovel }) {
  return (
    <>
      <Link to={`/imoveis/${imovel.id}`} className="font-medium text-slate-900 hover:underline">
        {imovel.endereco}
      </Link>
      {!imovel.enderecoRevisado && (
        <span className="ml-2 rounded bg-amber-50 px-1.5 py-0.5 text-[10px] font-medium text-amber-700">revisar endereço</span>
      )}
    </>
  )
}

function CelulaStatus({ imovel }: { imovel: Imovel }) {
  return <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_ESTILO[imovel.status]}`}>{imovel.status.replace('_', ' ')}</span>
}

export function ImoveisTable({ imoveis, colunas = COLUNAS_PADRAO_TABELA }: { imoveis: Imovel[]; colunas?: string[] }) {
  if (imoveis.length === 0) {
    return <p className="p-8 text-center text-sm text-slate-400">Nenhum imóvel encontrado com os filtros atuais.</p>
  }

  const campos = CAMPOS_RELATORIO.filter((c) => colunas.includes(c.chave))

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
          <tr>
            {campos.map((campo) => (
              <th key={campo.chave} className="whitespace-nowrap px-4 py-2">
                {campo.rotulo}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {imoveis.map((imovel) => (
            <tr key={imovel.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
              {campos.map((campo) => (
                <td key={campo.chave} className="whitespace-nowrap px-4 py-2 text-slate-600">
                  {campo.chave === 'endereco' ? (
                    <CelulaEndereco imovel={imovel} />
                  ) : campo.chave === 'status' ? (
                    <CelulaStatus imovel={imovel} />
                  ) : (
                    campo.obter(imovel) || '—'
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
