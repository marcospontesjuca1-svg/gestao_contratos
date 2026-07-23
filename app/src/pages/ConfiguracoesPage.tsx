import { useEffect, useState } from 'react'
import { buscarConfiguracoes, salvarConfiguracoes } from '../services/configuracoesService'
import type { Configuracoes, FrequenciaBackup } from '../types/configuracoes'

export function ConfiguracoesPage() {
  const [config, setConfig] = useState<Configuracoes | null>(null)
  const [salvando, setSalvando] = useState(false)
  const [salvo, setSalvo] = useState(false)

  useEffect(() => {
    buscarConfiguracoes().then(setConfig)
  }, [])

  if (!config) return <p className="text-sm text-slate-400">Carregando…</p>

  async function handleSalvar() {
    if (!config) return
    setSalvando(true)
    setSalvo(false)
    await salvarConfiguracoes(config)
    setSalvando(false)
    setSalvo(true)
  }

  return (
    <div className="max-w-lg space-y-4">
      <h2 className="text-xl font-semibold text-slate-900">Configurações gerais</h2>

      <fieldset className="space-y-3 rounded-lg border border-slate-200 bg-white p-4">
        <legend className="px-1 text-sm font-semibold text-slate-900">Backup</legend>

        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={config.backupAtivo} onChange={(e) => setConfig({ ...config, backupAtivo: e.target.checked })} />
          Rotina de backup ativa
        </label>

        <label className="block space-y-1 text-sm">
          <span className="text-xs uppercase tracking-wide text-slate-400">Frequência</span>
          <select
            className="input"
            value={config.backupFrequencia}
            onChange={(e) => setConfig({ ...config, backupFrequencia: e.target.value as FrequenciaBackup })}
          >
            <option value="DIARIO">Diário</option>
            <option value="SEMANAL">Semanal</option>
            <option value="MENSAL">Mensal</option>
          </select>
        </label>

        <label className="block space-y-1 text-sm">
          <span className="text-xs uppercase tracking-wide text-slate-400">Destino (bucket / URL)</span>
          <input className="input" value={config.backupDestino ?? ''} onChange={(e) => setConfig({ ...config, backupDestino: e.target.value || null })} />
        </label>

        <p className="text-xs text-slate-400">
          Última execução: {config.backupUltimaExecucao ? config.backupUltimaExecucao.toDate().toLocaleString('pt-BR') : 'nunca'}
        </p>
      </fieldset>

      <div className="flex items-center gap-3">
        <button
          onClick={handleSalvar}
          disabled={salvando}
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
        >
          {salvando ? 'Salvando…' : 'Salvar'}
        </button>
        {salvo && <span className="text-sm text-emerald-700">Salvo com sucesso.</span>}
      </div>
    </div>
  )
}
