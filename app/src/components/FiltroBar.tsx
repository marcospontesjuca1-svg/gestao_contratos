import type { FiltrosImoveis, StatusImovel } from '../types/imovel'

const STATUS_OPCOES: StatusImovel[] = ['LOCADO', 'VAGO', 'ATIVO_INTERNO', 'LOCADO_PARCIAL']

interface Props {
  filtros: FiltrosImoveis
  onChange: (filtros: FiltrosImoveis) => void
  opcoes: { estados: string[]; municipios: string[]; bairros: string[]; tipos: string[] }
}

export function FiltroBar({ filtros, onChange, opcoes }: Props) {
  function set<K extends keyof FiltrosImoveis>(campo: K, valor: FiltrosImoveis[K]) {
    onChange({ ...filtros, [campo]: valor || undefined })
  }

  return (
    <div className="grid grid-cols-2 gap-3 rounded-lg border border-slate-200 bg-white p-4 md:grid-cols-4 lg:grid-cols-7">
      <input
        className="col-span-2 rounded-md border border-slate-300 px-2 py-1.5 text-sm lg:col-span-2"
        placeholder="Buscar endereço, proprietário…"
        value={filtros.texto ?? ''}
        onChange={(e) => set('texto', e.target.value)}
      />
      <Select label="Estado" valor={filtros.estado} opcoes={opcoes.estados} onChange={(v) => set('estado', v)} />
      <Select label="Município" valor={filtros.municipio} opcoes={opcoes.municipios} onChange={(v) => set('municipio', v)} />
      <Select label="Bairro" valor={filtros.bairro} opcoes={opcoes.bairros} onChange={(v) => set('bairro', v)} />
      <Select label="Tipo" valor={filtros.tipo} opcoes={opcoes.tipos} onChange={(v) => set('tipo', v)} />
      <Select label="Situação" valor={filtros.status} opcoes={STATUS_OPCOES} onChange={(v) => set('status', v as StatusImovel)} />
      <div className="flex gap-1">
        <input
          type="number"
          className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
          placeholder="R$ min"
          value={filtros.valorMin ?? ''}
          onChange={(e) => set('valorMin', e.target.value ? Number(e.target.value) : undefined)}
        />
        <input
          type="number"
          className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
          placeholder="R$ max"
          value={filtros.valorMax ?? ''}
          onChange={(e) => set('valorMax', e.target.value ? Number(e.target.value) : undefined)}
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
