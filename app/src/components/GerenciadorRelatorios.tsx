import { useState } from 'react'
import { baixarRelatorioXlsx, carregarColunasSalvas, CAMPOS_RELATORIO, GRUPOS_RELATORIO, salvarColunas } from '../lib/relatorio'
import type { Imovel } from '../types/imovel'

export function GerenciadorRelatorios({ imoveis, onFechar }: { imoveis: Imovel[]; onFechar: () => void }) {
  const [selecionadas, setSelecionadas] = useState<string[]>(carregarColunasSalvas)

  function alternar(chave: string) {
    setSelecionadas((atual) => (atual.includes(chave) ? atual.filter((c) => c !== chave) : [...atual, chave]))
  }

  function marcarTodas() {
    setSelecionadas(CAMPOS_RELATORIO.map((c) => c.chave))
  }

  function desmarcarTodas() {
    setSelecionadas([])
  }

  function handleGerar() {
    salvarColunas(selecionadas)
    baixarRelatorioXlsx(imoveis, selecionadas)
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">Gerenciador de relatórios</h3>
          <p className="text-xs text-slate-500">
            Escolha as colunas do Excel. Gera com os {imoveis.length} imóve{imoveis.length === 1 ? 'l' : 'is'} que estão na listagem agora
            (respeita os filtros aplicados).
          </p>
        </div>
        <button onClick={onFechar} className="text-sm text-slate-400 hover:text-slate-700">
          Fechar
        </button>
      </div>

      <div className="mb-3 flex gap-3 text-xs">
        <button onClick={marcarTodas} className="text-blue-600 hover:underline">
          Marcar todas
        </button>
        <button onClick={desmarcarTodas} className="text-blue-600 hover:underline">
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

      <div className="mt-4 flex items-center gap-3">
        <button
          onClick={handleGerar}
          disabled={selecionadas.length === 0}
          className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
        >
          Baixar relatório (.xlsx)
        </button>
        <span className="text-xs text-slate-400">{selecionadas.length} coluna(s) selecionada(s)</span>
      </div>
    </div>
  )
}
