import type { Timestamp } from 'firebase/firestore'

export type FrequenciaBackup = 'DIARIO' | 'SEMANAL' | 'MENSAL'

export interface Configuracoes {
  backupAtivo: boolean
  backupFrequencia: FrequenciaBackup
  backupUltimaExecucao: Timestamp | null
  backupDestino: string | null
}
