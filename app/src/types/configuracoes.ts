import type { Timestamp } from 'firebase/firestore'

export interface Configuracoes {
  backupUltimoEm: Timestamp | null
  backupUltimoPor: string | null
}
