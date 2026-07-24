import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { aplicarFiltros, escutarImoveis, opcoesDeFiltro } from '../services/imoveisService'
import { FiltroBar } from '../components/FiltroBar'
import { ImoveisTable } from '../components/ImoveisTable'
import { useAuth } from '../lib/auth'
import type { FiltrosImoveis, Imovel } from '../types/imovel'

export function ImoveisListPage() {
  const { perfil } = useAuth()
  const [todos, setTodos] = useState<Imovel[]>([])
  const [filtros, setFiltros] = useState<FiltrosImoveis>({})
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    return escutarImoveis({}, (todosImoveis) => {
      setTodos(todosImoveis)
      setCarregando(false)
    })
  }, [])

  const imoveis = useMemo(() => aplicarFiltros(todos, filtros), [todos, filtros])
  const opcoes = useMemo(() => opcoesDeFiltro(todos), [todos])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Imóveis</h2>
          <p className="text-sm text-slate-500">{imoveis.length} de {todos.length} imóveis</p>
        </div>
        {perfil === 'admin' && (
          <Link to="/imoveis/novo" className="rounded-md bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700">
            + Novo imóvel
          </Link>
        )}
      </div>

      <FiltroBar filtros={filtros} onChange={setFiltros} opcoes={opcoes} />

      {carregando ? <p className="p-8 text-center text-sm text-slate-400">Carregando imóveis…</p> : <ImoveisTable imoveis={imoveis} />}
    </div>
  )
}
