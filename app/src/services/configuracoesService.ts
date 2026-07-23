import { doc, getDoc, setDoc } from 'firebase/firestore'
import { db } from '../lib/firebase'
import type { Configuracoes } from '../types/configuracoes'

const REF = doc(db, 'configuracoes', 'geral')

const PADRAO: Configuracoes = {
  backupUltimoEm: null,
  backupUltimoPor: null,
}

export async function buscarConfiguracoes(): Promise<Configuracoes> {
  const snap = await getDoc(REF)
  return snap.exists() ? (snap.data() as Configuracoes) : PADRAO
}

export async function salvarConfiguracoes(config: Configuracoes): Promise<void> {
  await setDoc(REF, config, { merge: true })
}
