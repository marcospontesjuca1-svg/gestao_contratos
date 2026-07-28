import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { aplicarFiltros, escutarImoveis, opcoesDeFiltro } from '../services/imoveisService'
import { FiltroBar } from '../components/FiltroBar'
import { ImoveisTable } from '../components/ImoveisTable'
import { GerenciadorRelatorios } from '../components/GerenciadorRelatorios'
import { baixarRelatorioXlsx, carregarColunasSalvas, salvarColunas } from '../lib/relatorio'
import { useAuth } from '../lib/auth'
import type { FiltrosImoveis, Imovel } from '../types/imovel'

export function ImoveisListPage() {
  const { perfil } = useAuth()
  const [todos, setTodos] = useState<Imovel[]>([])
  const [filtros, setFiltros] = useState<FiltrosImoveis>({ campos: {} })
  const [carregando, setCarregando] = useState(true)
  const [mostrarRelatorio, setMostrarRelatorio] = useState(false)
  const [colunasSalvas, setColunasSalvas] = useState<string[]>(carregarColunasSalvas)
  const [colunasEdicao, setColunasEdicao] = useState<string[]>(colunasSalvas)
  const [gerandoRelatorio, setGerandoRelatorio] = useState(false)

  useEffect(() => {
    return escutarImoveis({ campos: {} }, (todosImoveis) => {
      setTodos(todosImoveis)
      setCarregando(false)
    })
  }, [])

  const imoveis = useMemo(() => aplicarFiltros(todos, filtros), [todos, filtros])
  const opcoes = useMemo(() => opcoesDeFiltro(todos), [todos])

  function abrirRelatorio() {
    setColunasEdicao(colunasSalvas)
    setMostrarRelatorio(true)
  }

  function salvarComoPadrao() {
    salvarColunas(colunasEdicao)
    setColunasSalvas(colunasEdicao)
  }

  async function handleBaixarRelatorio() {
    setGerandoRelatorio(true)
    try {
      await baixarRelatorioXlsx(imoveis, colunasSalvas)
    } finally {
      setGerandoRelatorio(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Imóveis</h2>
          <p className="text-sm text-slate-500">{imoveis.length} de {todos.length} imóveis</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {!mostrarRelatorio && (
            <>
              <button
                onClick={handleBaixarRelatorio}
                disabled={gerandoRelatorio}
                className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                {gerandoRelatorio ? 'Gerando…' : 'Baixar relatório (.xlsx)'}
              </button>
              <button onClick={abrirRelatorio} className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
                Gerador de Relatórios
              </button>
            </>
          )}
          {perfil === 'admin' && (
            <Link to="/imoveis/novo" className="rounded-md bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700">
              + Novo imóvel
            </Link>
          )}
        </div>
      </div>

      {!mostrarRelatorio && <FiltroBar filtros={filtros} onChange={setFiltros} opcoes={opcoes} colunas={colunasSalvas} />}

      {mostrarRelatorio && (
        <GerenciadorRelatorios
          imoveis={imoveis}
          selecionadas={colunasEdicao}
          onChange={setColunasEdicao}
          onSalvar={salvarComoPadrao}
          onVoltar={() => setMostrarRelatorio(false)}
        />
      )}

      {carregando ? (
        <p className="p-8 text-center text-sm text-slate-400">Carregando imóveis…</p>
      ) : (
        <ImoveisTable imoveis={imoveis} colunas={mostrarRelatorio ? colunasEdicao : colunasSalvas} />
      )}
    </div>
  )
}
