import { addDoc, collection, deleteDoc, doc, getDocs, orderBy, query, serverTimestamp } from 'firebase/firestore'
import { db } from '../lib/firebase'
import type { RegistroManutencao, RegistroManutencaoInput } from '../types/imovel'

function colecaoManutencoes(imovelId: string) {
  return collection(db, 'imoveis', imovelId, 'manutencoes')
}

export async function listarManutencoes(imovelId: string): Promise<RegistroManutencao[]> {
  const snap = await getDocs(query(colecaoManutencoes(imovelId), orderBy('data', 'desc')))
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as RegistroManutencao)
}

export async function criarManutencao(imovelId: string, input: RegistroManutencaoInput, uid: string): Promise<string> {
  const ref = await addDoc(colecaoManutencoes(imovelId), {
    ...input,
    criadoEm: serverTimestamp(),
    criadoPor: uid,
  })
  return ref.id
}

export async function removerManutencao(imovelId: string, manutencaoId: string): Promise<void> {
  await deleteDoc(doc(db, 'imoveis', imovelId, 'manutencoes', manutencaoId))
}
