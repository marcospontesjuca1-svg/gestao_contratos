import { useMemo, useState, type ChangeEvent } from 'react'
import { lerPrimeiraAba } from '../lib/xlsxReader'
import { mapearLinha, mesclarComExistente, normalizarEndereco, type LinhaImportada } from '../lib/importMapping'
import { atualizarImovel, criarImovel, listarImoveis } from '../services/imoveisService'
import { useAuth } from '../lib/auth'
import type { Imovel } from '../types/imovel'

export function ImportacaoPage() {
  const { user } = useAuth()
  const [linhas, setLinhas] = useState<LinhaImportada[]>([])
  const [existentes, setExistentes] = useState<Map<string, Imovel>>(new Map())
  const [nomeArquivo, setNomeArquivo] = useState('')
  const [processando, setProcessando] = useState(false)
  const [resultado, setResultado] = useState<{ criados: number; atualizados: number; erros: number } | null>(null)

  async function handleArquivo(e: ChangeEvent<HTMLInputElement>) {
    const arquivo = e.target.files?.[0]
    if (!arquivo) return
    setNomeArquivo(arquivo.name)
    setResultado(null)
    const [linhasBrutas, imoveisAtuais] = await Promise.all([lerPrimeiraAba(arquivo), listarImoveis()])
    setLinhas(linhasBrutas.map(mapearLinha))
    setExistentes(new Map(imoveisAtuais.map((i) => [normalizarEndereco(i.endereco), i])))
  }

  const linhasComAcao = useMemo(
    () => linhas.map((l) => ({ ...l, existente: l.imovel.endereco ? existentes.get(normalizarEndereco(l.imovel.endereco)) : undefined })),
    [linhas, existentes],
  )

  async function handleImportar() {
    if (!user || linhasComAcao.length === 0) return
    setProcessando(true)
    let criados = 0
    let atualizados = 0
    let erros = 0
    for (const linha of linhasComAcao) {
      if (!linha.imovel.endereco) {
        erros++
        continue
      }
      try {
        if (linha.existente) {
          await atualizarImovel(linha.existente.id, mesclarComExistente(linha.existente, linha.imovel), user.uid)
          atualizados++
        } else {
          await criarImovel(linha.imovel, user.uid)
          criados++
        }
      } catch {
        erros++
      }
    }
    setProcessando(false)
    setResultado({ criados, atualizados, erros })
    setLinhas([])
    setExistentes(new Map())
  }

  const comAvisos = linhas.filter((l) => l.avisos.length > 0).length

  return (
    <div className="max-w-4xl space-y-4">
      <div>
        <h2 className="text-xl font-semibold text-slate-900">Importação de planilha</h2>
        <p className="text-sm text-slate-500">
          Envie a planilha no formato "Lista Geral de Imóveis" (colunas: ENDEREÇO, PASTA, KMZ, ESTADO, MUNICÍPIO, BAIRRO, OPERAÇÃO, SEGMENTO,
          PROPRIETÁRIOS, TIPO, Valor Contábil, Valor de Mercado, STATUS, MATRÍCULA / ZONA, INSC. IPTU, ÁREA TERRENO, ÁREA CONSTRUÍDA, NOME DE
          FANTASIA, LOCATÁRIO, VALOR, INÍCIO, FIM, REAJUSTE, R$ M² LOC). Imóveis com o mesmo endereço de um já cadastrado são{' '}
          <strong>atualizados</strong>, não duplicados — KMZ, fotos, anexos e comparativo de mercado que você já cadastrou ficam preservados.
        </p>
      </div>

      <input type="file" accept=".xls,.xlsx,.csv" onChange={handleArquivo} className="text-sm" />

      {resultado && (
        <p className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          Importação concluída: {resultado.criados} imóveis novos, {resultado.atualizados} atualizados, {resultado.erros} com erro.
        </p>
      )}

      {linhasComAcao.length > 0 && (
        <div className="space-y-3">
          <p className="text-sm text-slate-700">
            {nomeArquivo}: <strong>{linhas.length}</strong> linhas lidas, <strong>{comAvisos}</strong> com avisos,{' '}
            <strong>{linhasComAcao.filter((l) => l.existente).length}</strong> vão atualizar imóveis existentes.
          </p>
          <div className="max-h-96 overflow-auto rounded-xl border border-slate-200 bg-white shadow-sm">
            <table className="w-full text-left text-xs">
              <thead className="sticky top-0 border-b border-slate-200 bg-slate-50 uppercase text-slate-500">
                <tr>
                  <th className="px-3 py-2">Endereço</th>
                  <th className="px-3 py-2">Ação</th>
                  <th className="px-3 py-2">Município (inferido)</th>
                  <th className="px-3 py-2">Tipo</th>
                  <th className="px-3 py-2">Situação</th>
                  <th className="px-3 py-2">Avisos</th>
                </tr>
              </thead>
              <tbody>
                {linhasComAcao.map((l, i) => (
                  <tr key={i} className="border-b border-slate-100 last:border-0">
                    <td className="px-3 py-1.5">{l.imovel.endereco || '(vazio)'}</td>
                    <td className="px-3 py-1.5">
                      {l.existente ? (
                        <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[11px] font-medium text-blue-800">Atualiza</span>
                      ) : (
                        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-medium text-emerald-800">Novo</span>
                      )}
                    </td>
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
            className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
          >
            {processando ? 'Importando…' : `Confirmar importação de ${linhas.length} imóveis`}
          </button>
        </div>
      )}
    </div>
  )
}
