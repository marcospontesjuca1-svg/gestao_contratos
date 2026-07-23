import { useState, type ChangeEvent } from 'react'
import { lerPrimeiraAba } from '../lib/xlsxReader'
import { mapearLinha, type LinhaImportada } from '../lib/importMapping'
import { criarImovel } from '../services/imoveisService'
import { useAuth } from '../lib/auth'

export function ImportacaoPage() {
  const { user } = useAuth()
  const [linhas, setLinhas] = useState<LinhaImportada[]>([])
  const [nomeArquivo, setNomeArquivo] = useState('')
  const [processando, setProcessando] = useState(false)
  const [resultado, setResultado] = useState<{ importados: number; erros: number } | null>(null)

  async function handleArquivo(e: ChangeEvent<HTMLInputElement>) {
    const arquivo = e.target.files?.[0]
    if (!arquivo) return
    setNomeArquivo(arquivo.name)
    setResultado(null)
    const linhasBrutas = await lerPrimeiraAba(arquivo)
    setLinhas(linhasBrutas.map(mapearLinha))
  }

  async function handleImportar() {
    if (!user || linhas.length === 0) return
    setProcessando(true)
    let importados = 0
    let erros = 0
    for (const linha of linhas) {
      if (!linha.imovel.endereco) {
        erros++
        continue
      }
      try {
        await criarImovel(linha.imovel, user.uid)
        importados++
      } catch {
        erros++
      }
    }
    setProcessando(false)
    setResultado({ importados, erros })
    setLinhas([])
  }

  const comAvisos = linhas.filter((l) => l.avisos.length > 0).length

  return (
    <div className="max-w-4xl space-y-4">
      <div>
        <h2 className="text-xl font-semibold text-slate-900">Importação de planilha</h2>
        <p className="text-sm text-slate-500">
          Envie a planilha no formato "Lista Geral de Imóveis" (colunas: ENDEREÇO, PASTA, KMZ, ESTADO, MUNICÍPIO, BAIRRO, OPERAÇÃO, SEGMENTO,
          PROPRIETÁRIOS, TIPO, Valor Contábil, Valor de Mercado, STATUS, MATRÍCULA / ZONA, INSC. IPTU, ÁREA TERRENO, ÁREA CONSTRUÍDA, NOME DE
          FANTASIA, LOCATÁRIO, VALOR, INÍCIO, FIM, REAJUSTE, R$ M² LOC).
        </p>
      </div>

      <input type="file" accept=".xls,.xlsx,.csv" onChange={handleArquivo} className="text-sm" />

      {resultado && (
        <p className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          Importação concluída: {resultado.importados} imóveis criados, {resultado.erros} com erro.
        </p>
      )}

      {linhas.length > 0 && (
        <div className="space-y-3">
          <p className="text-sm text-slate-700">
            {nomeArquivo}: <strong>{linhas.length}</strong> linhas lidas, <strong>{comAvisos}</strong> com avisos (revisar após importar).
          </p>
          <div className="max-h-96 overflow-auto rounded-lg border border-slate-200 bg-white">
            <table className="w-full text-left text-xs">
              <thead className="sticky top-0 border-b border-slate-200 bg-slate-50 uppercase text-slate-500">
                <tr>
                  <th className="px-3 py-2">Endereço</th>
                  <th className="px-3 py-2">Município (inferido)</th>
                  <th className="px-3 py-2">Tipo</th>
                  <th className="px-3 py-2">Situação</th>
                  <th className="px-3 py-2">Avisos</th>
                </tr>
              </thead>
              <tbody>
                {linhas.map((l, i) => (
                  <tr key={i} className="border-b border-slate-100 last:border-0">
                    <td className="px-3 py-1.5">{l.imovel.endereco || '(vazio)'}</td>
                    <td className="px-3 py-1.5">{l.imovel.municipio ?? '—'}</td>
                    <td className="px-3 py-1.5">{l.imovel.tipo}</td>
                    <td className="px-3 py-1.5">{l.imovel.status}</td>
                    <td className="px-3 py-1.5 text-amber-700">{l.avisos.join('; ')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button
            onClick={handleImportar}
            disabled={processando}
            className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
          >
            {processando ? 'Importando…' : `Confirmar importação de ${linhas.length} imóveis`}
          </button>
        </div>
      )}
    </div>
  )
}
