import { Navigate } from 'react-router-dom'
import type { ReactNode } from 'react'
import { useAuth } from '../lib/auth'
import type { Perfil } from '../types/usuario'

export function ProtectedRoute({ children, perfisPermitidos }: { children: ReactNode; perfisPermitidos?: Perfil[] }) {
  const { user, perfil, carregando } = useAuth()

  if (carregando) {
    return <div className="flex h-full items-center justify-center p-8 text-slate-500">Carregando…</div>
  }

  if (!user) return <Navigate to="/login" replace />

  if (perfisPermitidos && (!perfil || !perfisPermitidos.includes(perfil))) {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}
