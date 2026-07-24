import { useEffect, useState } from 'react'
import { Timestamp } from 'firebase/firestore'
import { buscarConfiguracoes, salvarConfiguracoes } from '../services/configuracoesService'
import { listarImoveis } from '../services/imoveisService'
import { listarUsuarios } from '../services/usuariosService'
import { baixarBackupJson, baixarBackupXlsx } from '../lib/backup'
import { useAuth } from '../lib/auth'
import type { Configuracoes } from '../types/configuracoes'

export function ConfiguracoesBackupPage() {
  const { user, usuario } = useAuth()
  const [config, setConfig] = useState<Configuracoes | null>(null)
  const [gerando, setGerando] = useState<'xlsx' | 'json' | null>(null)

  useEffect(() => {
    buscarConfiguracoes().then(setConfig)
  }, [])

  if (!config) return <p className="text-sm text-slate-400">Carregando…</p>

  async function registrarExecucao() {
    if (!user) return
    const novaConfig: Configuracoes = { backupUltimoEm: Timestamp.now(), backupUltimoPor: usuario?.nome ?? user.email }
    await salvarConfiguracoes(novaConfig)
    setConfig(novaConfig)
  }

  async function handleBackupXlsx() {
    setGerando('xlsx')
    try {
      const imoveis = await listarImoveis()
      baixarBackupXlsx(imoveis)
      await registrarExecucao()
    } finally {
      setGerando(null)
    }
  }

  async function handleBackupJson() {
    if (!config) return
    setGerando('json')
    try {
      const [imoveis, usuarios] = await Promise.all([listarImoveis(), listarUsuarios()])
      baixarBackupJson({ imoveis, usuarios, configuracoes: config })
      await registrarExecucao()
    } finally {
      setGerando(null)
    }
  }

  return (
    <div className="max-w-lg space-y-4">
      <fieldset className="space-y-3 rounded-lg border border-slate-200 bg-white p-4">
        <legend className="px-1 text-sm font-semibold text-slate-900">Backup</legend>

        <p className="text-sm text-slate-600">
          Gera um arquivo com os dados do sistema e baixa direto para a pasta de Downloads do seu computador. Você decide onde guardar
          depois.
        </p>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleBackupXlsx}
            disabled={gerando !== null}
            className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
          >
            {gerando === 'xlsx' ? 'Gerando…' : 'Baixar backup (.xlsx)'}
          </button>
          <button
            onClick={handleBackupJson}
            disabled={gerando !== null}
            className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            {gerando === 'json' ? 'Gerando…' : 'Baixar backup completo (.json)'}
          </button>
        </div>

        <p className="text-xs text-slate-400">
          .xlsx: só os imóveis, em planilha (fácil de abrir no Excel). .json: dump completo — imóveis, usuários e configurações — útil
          como backup técnico ou para restaurar os dados depois.
        </p>

        <p className="text-xs text-slate-400">
          Último backup: {config.backupUltimoEm ? `${config.backupUltimoEm.toDate().toLocaleString('pt-BR')} por ${config.backupUltimoPor}` : 'nunca'}
        </p>
      </fieldset>
    </div>
  )
}
