import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { buscarImovel, removerImovel } from '../services/imoveisService'
import { ComparativoMercado } from '../components/ComparativoMercado'
import { useAuth } from '../lib/auth'
import type { Imovel } from '../types/imovel'

const formatadorMoeda = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
const formatadorData = new Intl.DateTimeFormat('pt-BR')

function Campo({ label, valor }: { label: string; valor: string | number | null | undefined }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-slate-400">{label}</dt>
      <dd className="text-sm text-slate-800">{valor ?? '—'}</dd>
    </div>
  )
}

export function ImovelDetalhePage() {
  const { id } = useParams<{ id: string }>()
  const { perfil } = useAuth()
  const navigate = useNavigate()
  const [imovel, setImovel] = useState<Imovel | null | undefined>(undefined)

  useEffect(() => {
    if (!id) return
    buscarImovel(id).then(setImovel)
  }, [id])

  if (imovel === undefined) return <p className="text-sm text-slate-400">Carregando…</p>
  if (imovel === null) return <p className="text-sm text-red-600">Imóvel não encontrado.</p>

  async function handleExcluir() {
    if (!id) return
    if (!confirm('Excluir este imóvel? Esta ação não pode ser desfeita.')) return
    await removerImovel(id)
    navigate('/imoveis')
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <Link to="/imoveis" className="text-sm text-slate-500 hover:underline">
            ← Voltar
          </Link>
          <h2 className="text-xl font-semibold text-slate-900">{imovel.endereco}</h2>
          {!imovel.enderecoRevisado && (
            <p className="text-xs font-medium text-amber-700">Endereço/localização inferidos automaticamente na importação — revisar.</p>
          )}
        </div>
        {perfil === 'admin' && (
          <div className="flex gap-2">
            <Link to={`/imoveis/${id}/editar`} className="rounded-md border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-50">
              Editar
            </Link>
            <button onClick={handleExcluir} className="rounded-md border border-red-200 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50">
              Excluir
            </button>
          </div>
        )}
      </div>

      <section className="grid grid-cols-2 gap-4 rounded-lg border border-slate-200 bg-white p-4 md:grid-cols-4">
        <Campo label="Estado" valor={imovel.estado} />
        <Campo label="Município" valor={imovel.municipio} />
        <Campo label="Bairro" valor={imovel.bairro} />
        <Campo label="Proprietário" valor={imovel.proprietario} />
        <Campo label="Tipo" valor={imovel.tipo} />
        <Campo label="Segmento" valor={imovel.segmento} />
        <Campo label="Situação" valor={imovel.status.replace('_', ' ')} />
        <Campo label="Operação" valor={imovel.operacao} />
        <Campo label="Área terreno (m²)" valor={imovel.areaTerreno} />
        <Campo label="Área construída (m²)" valor={imovel.areaConstruida} />
        <Campo label="Matrícula / Zona" valor={imovel.matriculaZona} />
        <Campo label="Inscrição IPTU" valor={imovel.inscricaoIptu} />
        <Campo label="Nome fantasia" valor={imovel.nomeFantasia} />
        <Campo label="Pasta física" valor={imovel.pastaFisica ? 'Sim' : 'Não'} />
        <Campo label="Valor contábil" valor={imovel.valorContabil != null ? formatadorMoeda.format(imovel.valorContabil) : null} />
        <Campo label="Valor de mercado (avaliação)" valor={imovel.valorMercadoImovel != null ? formatadorMoeda.format(imovel.valorMercadoImovel) : null} />
        <div>
          <dt className="text-xs uppercase tracking-wide text-slate-400">KMZ / Google Earth</dt>
          <dd className="text-sm">
            {imovel.kmzUrl ? (
              <a href={imovel.kmzUrl} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">
                Abrir no Google Earth
              </a>
            ) : (
              '—'
            )}
          </dd>
        </div>
      </section>

      {(imovel.status === 'LOCADO' || imovel.status === 'LOCADO_PARCIAL') && (
        <section className="rounded-lg border border-slate-200 bg-white p-4">
          <h3 className="mb-3 text-sm font-semibold text-slate-900">Locação vigente</h3>
          <dl className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <Campo label="Locatário" valor={imovel.locacao.locatario} />
            <Campo label="Valor do aluguel" valor={imovel.locacao.valorAluguel != null ? formatadorMoeda.format(imovel.locacao.valorAluguel) : null} />
            <Campo label="R$/m²" valor={imovel.locacao.valorM2 != null ? formatadorMoeda.format(imovel.locacao.valorM2) : null} />
            <Campo label="Reajuste" valor={imovel.locacao.reajuste} />
            <Campo label="Início" valor={imovel.locacao.dataInicio ? formatadorData.format(imovel.locacao.dataInicio.toDate()) : null} />
            <Campo label="Fim" valor={imovel.locacao.dataFim ? formatadorData.format(imovel.locacao.dataFim.toDate()) : null} />
          </dl>
        </section>
      )}

      <section className="rounded-lg border border-slate-200 bg-white p-4">
        <h3 className="mb-3 text-sm font-semibold text-slate-900">Comparativo de mercado (R$/m²)</h3>
        <ComparativoMercado valorM2Imovel={imovel.locacao.valorM2} comparativo={imovel.comparativoMercado} />
        {imovel.comparativoMercado.fonte && <p className="mt-2 text-xs text-slate-400">Fonte: {imovel.comparativoMercado.fonte}</p>}
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-4">
        <h3 className="mb-3 text-sm font-semibold text-slate-900">Fotos e anexos</h3>
        {imovel.fotos.length === 0 && imovel.anexos.length === 0 ? (
          <p className="text-sm text-slate-400">Nenhuma foto ou anexo cadastrado.</p>
        ) : (
          <div className="space-y-3">
            {imovel.fotos.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {imovel.fotos.map((url) => (
                  <img key={url} src={url} alt={imovel.endereco} className="h-24 w-24 rounded-md object-cover" />
                ))}
              </div>
            )}
            {imovel.anexos.length > 0 && (
              <ul className="list-inside list-disc text-sm text-blue-600">
                {imovel.anexos.map((a) => (
                  <li key={a.url}>
                    <a href={a.url} target="_blank" rel="noreferrer" className="hover:underline">
                      {a.nome}
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </section>
    </div>
  )
}
