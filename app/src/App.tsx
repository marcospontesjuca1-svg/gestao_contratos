import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './lib/auth'
import { ProtectedRoute } from './components/ProtectedRoute'
import { Layout } from './components/Layout'
import { LoginPage } from './pages/LoginPage'
import { DashboardPage } from './pages/DashboardPage'
import { ImoveisListPage } from './pages/ImoveisListPage'
import { ImovelDetalhePage } from './pages/ImovelDetalhePage'
import { ImovelFormPage } from './pages/ImovelFormPage'
import { ImportacaoPage } from './pages/ImportacaoPage'
import { ConfiguracoesPage } from './pages/ConfiguracoesPage'
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
              path="/importacao"
              element={
                <ProtectedRoute perfisPermitidos={['admin']}>
                  <ImportacaoPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/usuarios"
              element={
                <ProtectedRoute perfisPermitidos={['admin']}>
                  <UsuariosPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/configuracoes"
              element={
                <ProtectedRoute perfisPermitidos={['admin']}>
                  <ConfiguracoesPage />
                </ProtectedRoute>
              }
            />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
