import { CAMPOS_RELATORIO } from '../lib/relatorio'
import type { FiltrosImoveis } from '../types/imovel'

interface Props {
  filtros: FiltrosImoveis
  onChange: (filtros: FiltrosImoveis) => void
  opcoes: Record<string, string[]>
  /** Chaves das colunas atualmente ativas na tela (padrão salvo no Gerador de Relatórios) — define quais filtros aparecem. */
  colunas: string[]
}

export function FiltroBar({ filtros, onChange, opcoes, colunas }: Props) {
  function setCampo(chave: string, valor: string) {
    const campos = { ...filtros.campos }
    if (valor) campos[chave] = valor
    else delete campos[chave]
    onChange({ ...filtros, campos })
  }

  function setTexto(valor: string) {
    onChange({ ...filtros, texto: valor || undefined })
  }

  function setValor(campo: 'valorMin' | 'valorMax', valor: string) {
    onChange({ ...filtros, [campo]: valor ? Number(valor) : undefined })
  }

  const camposFiltraveis = CAMPOS_RELATORIO.filter((c) => c.filtravel && colunas.includes(c.chave))

  return (
    <div className="grid grid-cols-2 gap-3 rounded-xl border border-slate-200 bg-white shadow-sm p-4 md:grid-cols-4 lg:grid-cols-7">
      <input
        className="col-span-2 rounded-md border border-slate-300 px-2 py-1.5 text-sm lg:col-span-2"
        placeholder="Buscar endereço, proprietário…"
        value={filtros.texto ?? ''}
        onChange={(e) => setTexto(e.target.value)}
      />
      {camposFiltraveis.map((campo) => (
        <Select
          key={campo.chave}
          label={campo.rotulo}
          valor={filtros.campos[campo.chave]}
          opcoes={opcoes[campo.chave] ?? []}
          onChange={(v) => setCampo(campo.chave, v)}
        />
      ))}
      <div className="flex gap-1">
        <input
          type="number"
          className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
          placeholder="R$ min"
          value={filtros.valorMin ?? ''}
          onChange={(e) => setValor('valorMin', e.target.value)}
        />
        <input
          type="number"
          className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
          placeholder="R$ max"
          value={filtros.valorMax ?? ''}
          onChange={(e) => setValor('valorMax', e.target.value)}
        />
      </div>
    </div>
  )
}

function Select({ label, valor, opcoes, onChange }: { label: string; valor?: string; opcoes: string[]; onChange: (v: string) => void }) {
  return (
    <select
      className="rounded-md border border-slate-300 px-2 py-1.5 text-sm text-slate-700"
      value={valor ?? ''}
      onChange={(e) => onChange(e.target.value)}
    >
      <option value="">{label}</option>
      {opcoes.map((o) => (
        <option key={o} value={o}>
          {o}
        </option>
      ))}
    </select>
  )
}
