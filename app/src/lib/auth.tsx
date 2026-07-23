import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  type User,
} from 'firebase/auth'
import { doc, onSnapshot } from 'firebase/firestore'
import { auth, db } from './firebase'
import type { Perfil, Usuario } from '../types/usuario'

interface AuthContextValue {
  /** Usuário autenticado no Firebase Auth (null enquanto carrega ou deslogado). */
  user: User | null
  /** Perfil do usuário lido de usuarios/{uid} no Firestore. */
  usuario: Usuario | null
  perfil: Perfil | null
  carregando: boolean
  login: (email: string, senha: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [usuario, setUsuario] = useState<Usuario | null>(null)
  const [carregandoAuth, setCarregandoAuth] = useState(true)
  const [carregandoPerfil, setCarregandoPerfil] = useState(true)

  useEffect(() => {
    return onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser)
      setCarregandoAuth(false)
      if (!firebaseUser) {
        setUsuario(null)
        setCarregandoPerfil(false)
      }
    })
  }, [])

  useEffect(() => {
    if (!user) return
    setCarregandoPerfil(true)
    return onSnapshot(doc(db, 'usuarios', user.uid), (snap) => {
      setUsuario(snap.exists() ? ({ uid: snap.id, ...snap.data() } as Usuario) : null)
      setCarregandoPerfil(false)
    })
  }, [user])

  const value: AuthContextValue = {
    user,
    usuario,
    perfil: usuario?.perfil ?? null,
    carregando: carregandoAuth || (!!user && carregandoPerfil),
    login: async (email, senha) => {
      await signInWithEmailAndPassword(auth, email, senha)
    },
    logout: async () => {
      await firebaseSignOut(auth)
    },
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth deve ser usado dentro de <AuthProvider>')
  return ctx
}
