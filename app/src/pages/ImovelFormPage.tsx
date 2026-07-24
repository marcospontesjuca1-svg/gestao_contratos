import { useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Timestamp } from 'firebase/firestore'
import { atualizarImovel, buscarImovel, criarImovel } from '../services/imoveisService'
import { useAuth } from '../lib/auth'
import type { Anexo, ImovelInput, Operacao, StatusImovel } from '../types/imovel'

const VAZIO: ImovelInput = {
  endereco: '',
  pastaFisica: false,
  kmzUrl: null,
  coordenadas: null,
  estado: null,
  municipio: null,
  bairro: null,
  enderecoRevisado: true,
  operacao: 'LOCACAO',
  segmento: null,
  proprietario: null,
  tipo: 'SALA',
  valorContabil: null,
  valorMercadoImovel: null,
  status: 'VAGO',
  matriculaZona: null,
  inscricaoIptu: null,
  areaTerreno: null,
  areaConstruida: null,
  nomeFantasia: null,
  fotos: [],
  anexos: [],
  locacao: { locatario: null, valorAluguel: null, dataInicio: null, dataFim: null, reajuste: null, valorM2: null },
  comparativoMercado: { valorM2Regiao: null, fonte: null, atualizadoEm: null, atualizadoPor: null },
  importadoDe: null,
}

function dataParaInput(ts: Timestamp | null): string {
  return ts ? ts.toDate().toISOString().slice(0, 10) : ''
}

export function ImovelFormPage() {
  const { id } = useParams<{ id: string }>()
  const editando = !!id
  const navigate = useNavigate()
  const { user } = useAuth()
  const [form, setForm] = useState<ImovelInput>(VAZIO)
  const [carregando, setCarregando] = useState(editando)
  const [salvando, setSalvando] = useState(false)

  useEffect(() => {
    if (!id) return
    buscarImovel(id).then((imovel) => {
      if (imovel) setForm(imovel)
      setCarregando(false)
    })
  }, [id])

  function set<K extends keyof ImovelInput>(campo: K, valor: ImovelInput[K]) {
    setForm((f) => ({ ...f, [campo]: valor }))
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!user) return
    setSalvando(true)
    try {
      if (editando && id) {
        await atualizarImovel(id, form, user.uid)
        navigate(`/imoveis/${id}`)
      } else {
        const novoId = await criarImovel(form, user.uid)
        navigate(`/imoveis/${novoId}`)
      }
    } finally {
      setSalvando(false)
    }
  }

  if (carregando) return <p className="text-sm text-slate-400">Carregando…</p>

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <Link to="/imoveis" className="text-sm text-slate-500 hover:underline">
          ← Voltar
        </Link>
        <h2 className="text-xl font-semibold text-slate-900">{editando ? 'Editar imóvel' : 'Novo imóvel'}</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Secao titulo="Identificação">
          <Campo label="Endereço" className="col-span-2">
            <input required className="input" value={form.endereco} onChange={(e) => set('endereco', e.target.value)} />
          </Campo>
          <Campo label="Estado (UF)">
            <input className="input" value={form.estado ?? ''} onChange={(e) => set('estado', e.target.value || null)} />
          </Campo>
          <Campo label="Município">
            <input className="input" value={form.municipio ?? ''} onChange={(e) => set('municipio', e.target.value || null)} />
          </Campo>
          <Campo label="Bairro">
            <input className="input" value={form.bairro ?? ''} onChange={(e) => set('bairro', e.target.value || null)} />
          </Campo>
          <Campo label="Proprietário">
            <input className="input" value={form.proprietario ?? ''} onChange={(e) => set('proprietario', e.target.value || null)} />
          </Campo>
          <Campo label="Nome fantasia">
            <input className="input" value={form.nomeFantasia ?? ''} onChange={(e) => set('nomeFantasia', e.target.value || null)} />
          </Campo>
        </Secao>

        <Secao titulo="Classificação">
          <Campo label="Tipo">
            <input className="input" value={form.tipo} onChange={(e) => set('tipo', e.target.value)} />
          </Campo>
          <Campo label="Segmento (natureza de uso)">
            <input
              className="input"
              list="segmentos-sugeridos"
              placeholder="Ex.: Varejo, Shopping, Galpão, Depósito, Construção civil…"
              value={form.segmento ?? ''}
              onChange={(e) => set('segmento', e.target.value || null)}
            />
            <datalist id="segmentos-sugeridos">
              <option value="Varejo" />
              <option value="Shopping" />
              <option value="Galpão" />
              <option value="Depósito" />
              <option value="Escritório" />
              <option value="Construção civil" />
              <option value="Residencial" />
              <option value="Institucional" />
            </datalist>
          </Campo>
          <Campo label="Situação">
            <select className="input" value={form.status} onChange={(e) => set('status', e.target.value as StatusImovel)}>
              <option value="LOCADO">Locado</option>
              <option value="VAGO">Disponível</option>
              <option value="ATIVO_INTERNO">Ativo interno</option>
              <option value="LOCADO_PARCIAL">Locado / vago (parcial)</option>
            </select>
          </Campo>
          <Campo label="Operação">
            <select className="input" value={form.operacao} onChange={(e) => set('operacao', e.target.value as Operacao)}>
              <option value="VENDA">Venda</option>
              <option value="LOCACAO">Locação</option>
              <option value="DESENVOLVIMENTO">Desenvolvimento</option>
            </select>
          </Campo>
        </Secao>

        <Secao titulo="Áreas e documentação">
          <Campo label="Área terreno (m²)">
            <input type="number" className="input" value={form.areaTerreno ?? ''} onChange={(e) => set('areaTerreno', e.target.value ? Number(e.target.value) : null)} />
          </Campo>
          <Campo label="Área construída (m²)">
            <input type="number" className="input" value={form.areaConstruida ?? ''} onChange={(e) => set('areaConstruida', e.target.value ? Number(e.target.value) : null)} />
          </Campo>
          <Campo label="Matrícula / Zona">
            <input className="input" value={form.matriculaZona ?? ''} onChange={(e) => set('matriculaZona', e.target.value || null)} />
          </Campo>
          <Campo label="Inscrição IPTU">
            <input className="input" value={form.inscricaoIptu ?? ''} onChange={(e) => set('inscricaoIptu', e.target.value || null)} />
          </Campo>
          <Campo label="KMZ / Google Earth (URL)" className="col-span-2">
            <input className="input" value={form.kmzUrl ?? ''} onChange={(e) => set('kmzUrl', e.target.value || null)} />
          </Campo>
          <Campo label="Pasta física">
            <label className="flex items-center gap-2 pt-1.5 text-sm text-slate-700">
              <input type="checkbox" checked={form.pastaFisica} onChange={(e) => set('pastaFisica', e.target.checked)} />
              Existe pasta física com a documentação
            </label>
            <p className="text-xs text-slate-400">Marque se a matrícula, contrato, IPTU etc. desse imóvel estão arquivados fisicamente no escritório.</p>
          </Campo>
        </Secao>

        <Secao titulo="Valores do ativo">
          <Campo label="Valor contábil (R$)">
            <input
              type="number"
              className="input"
              value={form.valorContabil ?? ''}
              onChange={(e) => set('valorContabil', e.target.value ? Number(e.target.value) : null)}
            />
          </Campo>
          <Campo label="Valor de mercado do imóvel (R$)">
            <input
              type="number"
              className="input"
              value={form.valorMercadoImovel ?? ''}
              onChange={(e) => set('valorMercadoImovel', e.target.value ? Number(e.target.value) : null)}
            />
            <p className="text-xs text-slate-400">Avaliação do imóvel inteiro — diferente do R$/m² de mercado da região, usado no comparativo.</p>
          </Campo>
        </Secao>

        <Secao titulo="Fotos e anexos">
          <Campo label="Fotos (link direto da imagem)" className="col-span-2">
            <ListaFotos fotos={form.fotos} onChange={(fotos) => set('fotos', fotos)} />
          </Campo>
          <Campo label="Documentos anexos (link do arquivo)" className="col-span-2">
            <ListaAnexos anexos={form.anexos} onChange={(anexos) => set('anexos', anexos)} />
          </Campo>
        </Secao>

        <Secao titulo="Locação vigente">
          <Campo label="Locatário">
            <input className="input" value={form.locacao.locatario ?? ''} onChange={(e) => set('locacao', { ...form.locacao, locatario: e.target.value || null })} />
          </Campo>
          <Campo label="Valor do aluguel (R$)">
            <input
              type="number"
              className="input"
              value={form.locacao.valorAluguel ?? ''}
              onChange={(e) => set('locacao', { ...form.locacao, valorAluguel: e.target.value ? Number(e.target.value) : null })}
            />
          </Campo>
          <Campo label="Início">
            <input
              type="date"
              className="input"
              value={dataParaInput(form.locacao.dataInicio)}
              onChange={(e) => set('locacao', { ...form.locacao, dataInicio: e.target.value ? Timestamp.fromDate(new Date(e.target.value)) : null })}
            />
          </Campo>
          <Campo label="Fim">
            <input
              type="date"
              className="input"
              value={dataParaInput(form.locacao.dataFim)}
              onChange={(e) => set('locacao', { ...form.locacao, dataFim: e.target.value ? Timestamp.fromDate(new Date(e.target.value)) : null })}
            />
          </Campo>
          <Campo label="Reajuste">
            <input className="input" value={form.locacao.reajuste ?? ''} onChange={(e) => set('locacao', { ...form.locacao, reajuste: e.target.value || null })} />
          </Campo>
        </Secao>

        <Secao titulo="Comparativo de mercado (manual)">
          <Campo label="R$/m² médio de mercado na região">
            <input
              type="number"
              className="input"
              value={form.comparativoMercado.valorM2Regiao ?? ''}
              onChange={(e) =>
                set('comparativoMercado', {
                  ...form.comparativoMercado,
                  valorM2Regiao: e.target.value ? Number(e.target.value) : null,
                  atualizadoEm: e.target.value ? Timestamp.now() : form.comparativoMercado.atualizadoEm,
                  atualizadoPor: user?.uid ?? null,
                })
              }
            />
          </Campo>
          <Campo label="Fonte">
            <input
              className="input"
              placeholder="Ex.: FipeZAP, corretor local…"
              value={form.comparativoMercado.fonte ?? ''}
              onChange={(e) => set('comparativoMercado', { ...form.comparativoMercado, fonte: e.target.value || null })}
            />
          </Campo>
        </Secao>

        <div className="flex gap-2">
          <button type="submit" disabled={salvando} className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50">
            {salvando ? 'Salvando…' : 'Salvar'}
          </button>
          <Link to="/imoveis" className="rounded-md border border-slate-300 px-4 py-2 text-sm hover:bg-slate-50">
            Cancelar
          </Link>
        </div>
      </form>
    </div>
  )
}

function Secao({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <fieldset className="rounded-xl border border-slate-200 bg-white shadow-sm p-4">
      <legend className="px-1 text-sm font-semibold text-slate-900">{titulo}</legend>
      <div className="mt-2 grid grid-cols-2 gap-4">{children}</div>
    </fieldset>
  )
}

function Campo({ label, children, className }: { label: string; children: ReactNode; className?: string }) {
  return (
    <label className={`block space-y-1 text-sm ${className ?? ''}`}>
      <span className="text-xs uppercase tracking-wide text-slate-400">{label}</span>
      {children}
    </label>
  )
}

/**
 * Sem upload de arquivo (exigiria Firebase Storage no plano pago) — o admin
 * hospeda a foto em algum lugar (Drive, OneDrive, etc.) e cola aqui o link
 * direto da imagem, no mesmo esquema já usado para o KMZ.
 */
function ListaFotos({ fotos, onChange }: { fotos: string[]; onChange: (fotos: string[]) => void }) {
  const [novaUrl, setNovaUrl] = useState('')

  function adicionar() {
    const url = novaUrl.trim()
    if (!url) return
    onChange([...fotos, url])
    setNovaUrl('')
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <input
          className="input"
          placeholder="URL direta da imagem"
          value={novaUrl}
          onChange={(e) => setNovaUrl(e.target.value)}
        />
        <button type="button" onClick={adicionar} className="shrink-0 rounded-md border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-50">
          Adicionar
        </button>
      </div>
      {fotos.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {fotos.map((url, i) => (
            <div key={i} className="group relative">
              <img src={url} alt="" className="h-20 w-20 rounded-md border border-slate-200 object-cover" />
              <button
                type="button"
                onClick={() => onChange(fotos.filter((_, idx) => idx !== i))}
                className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-xs leading-none text-white"
                title="Remover"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function ListaAnexos({ anexos, onChange }: { anexos: Anexo[]; onChange: (anexos: Anexo[]) => void }) {
  const [nome, setNome] = useState('')
  const [url, setUrl] = useState('')

  function adicionar() {
    if (!nome.trim() || !url.trim()) return
    const tipo = url.split('.').pop()?.split(/[?#]/)[0]?.toLowerCase() || 'arquivo'
    onChange([...anexos, { nome: nome.trim(), url: url.trim(), tipo }])
    setNome('')
    setUrl('')
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <input className="input" placeholder="Nome do documento" value={nome} onChange={(e) => setNome(e.target.value)} />
        <input className="input" placeholder="URL do arquivo" value={url} onChange={(e) => setUrl(e.target.value)} />
        <button type="button" onClick={adicionar} className="shrink-0 rounded-md border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-50">
          Adicionar
        </button>
      </div>
      {anexos.length > 0 && (
        <ul className="space-y-1">
          {anexos.map((a, i) => (
            <li key={i} className="flex items-center justify-between rounded-md border border-slate-200 px-2 py-1.5 text-sm">
              <a href={a.url} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">
                {a.nome}
              </a>
              <button type="button" onClick={() => onChange(anexos.filter((_, idx) => idx !== i))} className="text-xs text-red-600 hover:underline">
                remover
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
