import { deleteApp, initializeApp } from 'firebase/app'
import { createUserWithEmailAndPassword, getAuth, signOut } from 'firebase/auth'
import { firebaseApp } from './firebase'

/**
 * Cria uma credencial (e-mail/senha) no Firebase Authentication a partir do
 * app já logado como admin, sem trocar a sessão atual. O SDK do Firebase
 * loga automaticamente como o usuário recém-criado na instância em que a
 * criação acontece — por isso usamos aqui uma instância secundária
 * (mesmo projeto, app isolado), que é descartada logo em seguida.
 */
export async function criarUsuarioAuth(email: string, senha: string): Promise<string> {
  const appSecundario = initializeApp(firebaseApp.options, `secundario-${Date.now()}`)
  const authSecundario = getAuth(appSecundario)
  try {
    const credencial = await createUserWithEmailAndPassword(authSecundario, email, senha)
    return credencial.user.uid
  } finally {
    await signOut(authSecundario).catch(() => {})
    await deleteApp(appSecundario)
  }
}
