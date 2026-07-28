import { Timestamp } from 'firebase/firestore'
import { gerarRelatorioExcel } from './excelReport'
import type { Imovel } from '../types/imovel'
import type { Usuario } from '../types/usuario'
import type { Configuracoes } from '../types/configuracoes'

const COLUNAS_BACKUP = [
  'ENDEREÇO',
  'ESTADO',
  'CIDADE',
  'BAIRRO',
  'PROPRIETÁRIOS',
  'TIPO',
  'SEGMENTO',
  'STATUS',
  'OPERAÇÃO',
  'MATRÍCULA / ZONA',
  'INSC. IPTU',
  'ÁREA TERRENO',
  'ÁREA CONSTRUÍDA',
  'VALOR CONTÁBIL',
  'VALOR DE MERCADO',
  'LOCATÁRIO',
  'VALOR',
  'INÍCIO',
  'FIM',
  'REAJUSTE',
  'R$ M² LOC',
  'R$ M² REGIÃO (MERCADO)',
  'KMZ',
]

function linhaDoImovel(imovel: Imovel): (string | number)[] {
  return [
    imovel.endereco,
    imovel.estado ?? '',
    imovel.municipio ?? '',
    imovel.bairro ?? '',
    imovel.proprietario ?? '',
    imovel.tipo,
    imovel.segmento ?? '',
    imovel.status,
    imovel.operacao,
    imovel.matriculaZona ?? '',
    imovel.inscricaoIptu ?? '',
    imovel.areaTerreno ?? '',
    imovel.areaConstruida ?? '',
    imovel.valorContabil ?? '',
    imovel.valorMercadoImovel ?? '',
    imovel.locacao.locatario ?? '',
    imovel.locacao.valorAluguel ?? '',
    imovel.locacao.dataInicio ? imovel.locacao.dataInicio.toDate().toLocaleDateString('pt-BR') : '',
    imovel.locacao.dataFim ? imovel.locacao.dataFim.toDate().toLocaleDateString('pt-BR') : '',
    imovel.locacao.reajuste ?? '',
    imovel.locacao.valorM2 ?? '',
    imovel.comparativoMercado.valorM2Regiao ?? '',
    imovel.kmzUrl ?? '',
  ]
}

/** Gera um .xlsx com todos os imóveis e dispara o download no navegador (pasta padrão de Downloads). */
export async function baixarBackupXlsx(imoveis: Imovel[]): Promise<void> {
  const dataHoje = new Date().toLocaleDateString('pt-BR')
  await gerarRelatorioExcel({
    nomeArquivo: `backup-gestao-contratos-${new Date().toISOString().slice(0, 10)}`,
    aba: 'Imóveis',
    titulo: 'GESTÃO DE ATIVOS',
    subtitulo: `Backup de imóveis — gerado em ${dataHoje} — ${imoveis.length} imóve${imoveis.length === 1 ? 'l' : 'is'}`,
    colunas: COLUNAS_BACKUP,
    linhas: imoveis.map(linhaDoImovel),
  })
}

function serializarTimestamps(valor: unknown): unknown {
  if (valor instanceof Timestamp) return valor.toDate().toISOString()
  if (Array.isArray(valor)) return valor.map(serializarTimestamps)
  if (valor && typeof valor === 'object') {
    return Object.fromEntries(Object.entries(valor).map(([chave, v]) => [chave, serializarTimestamps(v)]))
  }
  return valor
}

/** Gera um .json com o dump completo dos dados do sistema (imóveis, usuários e configurações) e dispara o download. */
export function baixarBackupJson(dados: { imoveis: Imovel[]; usuarios: Usuario[]; configuracoes: Configuracoes }) {
  const payload = {
    geradoEm: new Date().toISOString(),
    imoveis: serializarTimestamps(dados.imoveis),
    usuarios: serializarTimestamps(dados.usuarios),
    configuracoes: serializarTimestamps(dados.configuracoes),
  }

  const conteudo = JSON.stringify(payload, null, 2)
  const blob = new Blob([conteudo], { type: 'application/json' })
  const url = URL.createObjectURL(blob)

  const link = document.createElement('a')
  link.href = url
  link.download = `backup-gestao-contratos-${new Date().toISOString().slice(0, 10)}.json`
  link.click()

  URL.revokeObjectURL(url)
}
