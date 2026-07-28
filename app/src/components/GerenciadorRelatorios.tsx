import { useState } from 'react'
import { CAMPOS_RELATORIO, GRUPOS_RELATORIO } from '../lib/relatorio'
import type { Imovel } from '../types/imovel'

interface Props {
  imoveis: Imovel[]
  selecionadas: string[]
  onChange: (colunas: string[]) => void
  onSalvar: () => void
  onVoltar: () => void
}

export function GerenciadorRelatorios({ imoveis, selecionadas, onChange, onSalvar, onVoltar }: Props) {
  const [salvo, setSalvo] = useState(false)

  function alternar(chave: string) {
    setSalvo(false)
    onChange(selecionadas.includes(chave) ? selecionadas.filter((c) => c !== chave) : [...selecionadas, chave])
  }

  function handleSalvar() {
    onSalvar()
    setSalvo(true)
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">Gerador de Relatórios</h3>
          <p className="text-xs text-slate-500">
            Escolha as colunas — a tabela abaixo muda junto. "Salvar" define essas colunas como padrão da tela de Imóveis; o Excel sai com os{' '}
            {imoveis.length} imóve{imoveis.length === 1 ? 'l' : 'is'} que estão na listagem agora (respeita os filtros aplicados).
          </p>
        </div>
        <button onClick={onVoltar} className="shrink-0 rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50">
          ← Voltar para Imóveis
        </button>
      </div>

      <div className="mb-3 flex gap-3 text-xs">
        <button onClick={() => onChange(CAMPOS_RELATORIO.map((c) => c.chave))} className="text-blue-600 hover:underline">
          Marcar todas
        </button>
        <button onClick={() => onChange([])} className="text-blue-600 hover:underline">
          Desmarcar todas
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {GRUPOS_RELATORIO.map((grupo) => (
          <div key={grupo}>
            <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">{grupo}</p>
            <div className="space-y-1">
              {CAMPOS_RELATORIO.filter((c) => c.grupo === grupo).map((campo) => (
                <label key={campo.chave} className="flex items-center gap-2 text-sm text-slate-700">
                  <input type="checkbox" checked={selecionadas.includes(campo.chave)} onChange={() => alternar(campo.chave)} />
                  {campo.rotulo}
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          onClick={handleSalvar}
          disabled={selecionadas.length === 0}
          className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
        >
          Salvar como padrão
        </button>
        <span className="text-xs text-slate-400">{selecionadas.length} coluna(s) selecionada(s)</span>
        {salvo && <span className="text-xs font-medium text-emerald-700">Salvo — essa é agora a visão padrão de Imóveis.</span>}
      </div>
    </div>
  )
}
