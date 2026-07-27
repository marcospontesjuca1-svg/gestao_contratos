import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './lib/auth'
import { ProtectedRoute } from './components/ProtectedRoute'
import { Layout } from './components/Layout'
import { LoginPage } from './pages/LoginPage'
import { DashboardPage } from './pages/DashboardPage'
import { ImoveisListPage } from './pages/ImoveisListPage'
import { ImovelDetalhePage } from './pages/ImovelDetalhePage'
import { ImovelFormPage } from './pages/ImovelFormPage'
import { ReajusteContratualPage } from './pages/ReajusteContratualPage'
import { ImportacaoPage } from './pages/ImportacaoPage'
import { ConfiguracoesLayout } from './pages/ConfiguracoesLayout'
import { ConfiguracoesBackupPage } from './pages/ConfiguracoesBackupPage'
import { UsuariosPage } from './pages/UsuariosPage'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route path="/" element={<DashboardPage />} />
            <Route path="/imoveis" element={<ImoveisListPage />} />
            <Route path="/imoveis/:id" element={<ImovelDetalhePage />} />
            <Route
              path="/imoveis/novo"
              element={
                <ProtectedRoute perfisPermitidos={['admin']}>
                  <ImovelFormPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/imoveis/:id/editar"
              element={
                <ProtectedRoute perfisPermitidos={['admin']}>
                  <ImovelFormPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/reajuste"
              element={
                <ProtectedRoute perfisPermitidos={['admin']}>
                  <ReajusteContratualPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/configuracoes"
              element={
                <ProtectedRoute perfisPermitidos={['admin']}>
                  <ConfiguracoesLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<ConfiguracoesBackupPage />} />
              <Route path="importacao" element={<ImportacaoPage />} />
              <Route path="usuarios" element={<UsuariosPage />} />
            </Route>
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
