import { gerarRelatorioExcel } from './excelReport'
import type { Imovel } from '../types/imovel'

const formatadorData = (ts: Imovel['locacao']['dataInicio']) => (ts ? ts.toDate().toLocaleDateString('pt-BR') : '')
const formatadorMoeda = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
const formatarMoeda = (v: number | null) => (v != null ? formatadorMoeda.format(v) : '')
const formatarArea = (v: number | null) => (v != null ? `${v} m²` : '')

export interface CampoRelatorio {
  chave: string
  rotulo: string
  grupo: string
  obter: (imovel: Imovel) => string | number
  /** Campos adequados a um select de filtro (poucos valores distintos esperados) na tela de Imóveis. */
  filtravel?: boolean
}

export const CAMPOS_RELATORIO: CampoRelatorio[] = [
  { chave: 'endereco', rotulo: 'Endereço', grupo: 'Identificação', obter: (i) => i.endereco },
  { chave: 'estado', rotulo: 'Estado', grupo: 'Identificação', obter: (i) => i.estado ?? '', filtravel: true },
  { chave: 'municipio', rotulo: 'Município', grupo: 'Identificação', obter: (i) => i.municipio ?? '', filtravel: true },
  { chave: 'bairro', rotulo: 'Bairro', grupo: 'Identificação', obter: (i) => i.bairro ?? '', filtravel: true },
  { chave: 'proprietario', rotulo: 'Proprietário', grupo: 'Identificação', obter: (i) => i.proprietario ?? '', filtravel: true },
  { chave: 'nomeFantasia', rotulo: 'Nome fantasia', grupo: 'Identificação', obter: (i) => i.nomeFantasia ?? '', filtravel: true },

  { chave: 'tipo', rotulo: 'Tipo', grupo: 'Classificação', obter: (i) => i.tipo, filtravel: true },
  { chave: 'segmento', rotulo: 'Segmento', grupo: 'Classificação', obter: (i) => i.segmento ?? '', filtravel: true },
  { chave: 'status', rotulo: 'Situação', grupo: 'Classificação', obter: (i) => i.status, filtravel: true },
  { chave: 'operacao', rotulo: 'Operação', grupo: 'Classificação', obter: (i) => i.operacao, filtravel: true },

  { chave: 'matriculaZona', rotulo: 'Matrícula / Zona', grupo: 'Documentação', obter: (i) => i.matriculaZona ?? '' },
  { chave: 'inscricaoIptu', rotulo: 'Inscrição IPTU', grupo: 'Documentação', obter: (i) => i.inscricaoIptu ?? '' },
  { chave: 'pastaFisica', rotulo: 'Pasta física', grupo: 'Documentação', obter: (i) => (i.pastaFisica ? 'Sim' : 'Não') },
  { chave: 'kmzUrl', rotulo: 'KMZ', grupo: 'Documentação', obter: (i) => i.kmzUrl ?? '' },

  { chave: 'areaTerreno', rotulo: 'Área terreno (m²)', grupo: 'Áreas e valores', obter: (i) => formatarArea(i.areaTerreno) },
  { chave: 'areaConstruida', rotulo: 'Área construída (m²)', grupo: 'Áreas e valores', obter: (i) => formatarArea(i.areaConstruida) },
  { chave: 'valorContabil', rotulo: 'Valor contábil', grupo: 'Áreas e valores', obter: (i) => formatarMoeda(i.valorContabil) },
  { chave: 'valorMercadoImovel', rotulo: 'Valor de mercado (imóvel)', grupo: 'Áreas e valores', obter: (i) => formatarMoeda(i.valorMercadoImovel) },

  { chave: 'locatario', rotulo: 'Locatário', grupo: 'Locação', obter: (i) => i.locacao.locatario ?? '', filtravel: true },
  { chave: 'valorAluguel', rotulo: 'Valor do aluguel', grupo: 'Locação', obter: (i) => formatarMoeda(i.locacao.valorAluguel) },
  { chave: 'dataInicio', rotulo: 'Início do contrato', grupo: 'Locação', obter: (i) => formatadorData(i.locacao.dataInicio) },
  { chave: 'dataFim', rotulo: 'Fim do contrato', grupo: 'Locação', obter: (i) => formatadorData(i.locacao.dataFim) },
  { chave: 'reajuste', rotulo: 'Reajuste', grupo: 'Locação', obter: (i) => i.locacao.reajuste ?? '', filtravel: true },
  { chave: 'valorM2', rotulo: 'R$/m² do imóvel', grupo: 'Locação', obter: (i) => formatarMoeda(i.locacao.valorM2) },

  { chave: 'valorM2Regiao', rotulo: 'R$/m² de mercado (região)', grupo: 'Comparativo de mercado', obter: (i) => formatarMoeda(i.comparativoMercado.valorM2Regiao) },
  { chave: 'fonteMercado', rotulo: 'Fonte do comparativo', grupo: 'Comparativo de mercado', obter: (i) => i.comparativoMercado.fonte ?? '' },
]

export const GRUPOS_RELATORIO = Array.from(new Set(CAMPOS_RELATORIO.map((c) => c.grupo)))

/** Colunas iniciais da tabela de imóveis, antes de qualquer configuração salva no Gerador de Relatórios. */
export const COLUNAS_PADRAO_TABELA = ['endereco', 'municipio', 'tipo', 'status', 'areaConstruida', 'valorAluguel']

const CHAVE_ARMAZENAMENTO = 'relatorio-colunas-selecionadas'

export function carregarColunasSalvas(): string[] {
  try {
    const bruto = localStorage.getItem(CHAVE_ARMAZENAMENTO)
    if (!bruto) return COLUNAS_PADRAO_TABELA
    const salvas: unknown = JSON.parse(bruto)
    return Array.isArray(salvas) && salvas.length > 0 ? salvas.filter((c): c is string => typeof c === 'string') : COLUNAS_PADRAO_TABELA
  } catch {
    return COLUNAS_PADRAO_TABELA
  }
}

export function salvarColunas(colunas: string[]): void {
  localStorage.setItem(CHAVE_ARMAZENAMENTO, JSON.stringify(colunas))
}

/** Gera um .xlsx só com as colunas selecionadas, para os imóveis informados (já filtrados na tela), e dispara o download. */
export async function baixarRelatorioXlsx(imoveis: Imovel[], colunasSelecionadas: string[]): Promise<void> {
  const campos = CAMPOS_RELATORIO.filter((c) => colunasSelecionadas.includes(c.chave))
  const dataHoje = new Date().toLocaleDateString('pt-BR')

  await gerarRelatorioExcel({
    nomeArquivo: `relatorio-imoveis-${new Date().toISOString().slice(0, 10)}`,
    aba: 'Relatório',
    titulo: 'GESTÃO DE ATIVOS',
    subtitulo: `Relatório de imóveis — gerado em ${dataHoje} — ${imoveis.length} imóve${imoveis.length === 1 ? 'l' : 'is'}`,
    colunas: campos.map((c) => c.rotulo),
    linhas: imoveis.map((imovel) => campos.map((c) => c.obter(imovel))),
  })
}
