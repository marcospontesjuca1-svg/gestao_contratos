import type { Timestamp } from 'firebase/firestore'

export type Perfil = 'admin' | 'operador'

export interface Usuario {
  uid: string
  nome: string
  email: string
  perfil: Perfil
  ativo: boolean
  criadoEm: Timestamp | null
}
