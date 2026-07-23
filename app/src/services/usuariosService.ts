import { collection, doc, getDocs, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore'
import { db } from '../lib/firebase'
import type { Perfil, Usuario } from '../types/usuario'

const COLECAO = 'usuarios'

export async function listarUsuarios(): Promise<Usuario[]> {
  const snap = await getDocs(collection(db, COLECAO))
  return snap.docs.map((d) => ({ uid: d.id, ...d.data() }) as Usuario)
}

/**
 * Cria o registro de perfil em usuarios/{uid}. A criação da credencial em si
 * (Firebase Auth) precisa ser feita separadamente — ver README, seção
 * "Provisionamento de usuários" (Cloud Function admin recomendada para produção).
 */
export async function criarPerfilUsuario(uid: string, dados: { nome: string; email: string; perfil: Perfil }): Promise<void> {
  await setDoc(doc(db, COLECAO, uid), {
    ...dados,
    ativo: true,
    criadoEm: serverTimestamp(),
  })
}

export async function atualizarPerfilUsuario(uid: string, dados: Partial<Pick<Usuario, 'nome' | 'perfil' | 'ativo'>>): Promise<void> {
  await updateDoc(doc(db, COLECAO, uid), dados)
}
