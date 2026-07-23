import { useEffect, useState } from 'react'
import { Timestamp } from 'firebase/firestore'
import { buscarConfiguracoes, salvarConfiguracoes } from '../services/configuracoesService'
import { listarImoveis } from '../services/imoveisService'
import { baixarBackupXlsx } from '../lib/backup'
import { useAuth } from '../lib/auth'
import type { Configuracoes } from '../types/configuracoes'

export function ConfiguracoesPage() {
  const { user, usuario } = useAuth()
  const [config, setConfig] = useState<Configuracoes | null>(null)
  const [gerando, setGerando] = useState(false)

  useEffect(() => {
    buscarConfiguracoes().then(setConfig)
  }, [])

  if (!config) return <p className="text-sm text-slate-400">Carregando…</p>

  async function handleBackup() {
    if (!user) return
    setGerando(true)
    try {
      const imoveis = await listarImoveis()
      baixarBackupXlsx(imoveis)
      const novaConfig: Configuracoes = { backupUltimoEm: Timestamp.now(), backupUltimoPor: usuario?.nome ?? user.email }
      await salvarConfiguracoes(novaConfig)
      setConfig(novaConfig)
    } finally {
      setGerando(false)
    }
  }

  return (
    <div className="max-w-lg space-y-4">
      <h2 className="text-xl font-semibold text-slate-900">Configurações gerais</h2>

      <fieldset className="space-y-3 rounded-lg border border-slate-200 bg-white p-4">
        <legend className="px-1 text-sm font-semibold text-slate-900">Backup</legend>

        <p className="text-sm text-slate-600">
          Gera um arquivo Excel com todos os imóveis cadastrados e baixa direto para a pasta de Downloads do seu computador. Você decide
          onde guardar o arquivo depois.
        </p>

        <button
          onClick={handleBackup}
          disabled={gerando}
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
        >
          {gerando ? 'Gerando arquivo…' : 'Baixar backup agora'}
        </button>

        <p className="text-xs text-slate-400">
          Último backup: {config.backupUltimoEm ? `${config.backupUltimoEm.toDate().toLocaleString('pt-BR')} por ${config.backupUltimoPor}` : 'nunca'}
        </p>
      </fieldset>
    </div>
  )
}
