import { Timestamp } from 'firebase/firestore'
import type { ImovelInput, Operacao, StatusImovel, TipoImovel } from '../types/imovel'

/**
 * Mapeamento de colunas -> campos, calibrado com a planilha real
 * "Lista_Geral_Imóveis" (301 linhas, 24 colunas). Ver docs/MODELO_DE_DADOS.md.
 */
export const COLUNAS_ESPERADAS = [
  'ENDEREÇO',
  'PASTA',
  'KMZ',
  'ESTADO',
  'MUNICÍPIO',
  'BAIRRO',
  'OPERAÇÃO',
  'SEGMENTO',
  'PROPRIETÁRIOS',
  'TIPO',
  'Valor Contábil',
  'Valor de Mercado',
  'STATUS',
  'MATRÍCULA / ZONA',
  'INSC. IPTU',
  'ÁREA TERRENO',
  'ÁREA CONSTRUÍDA',
  'NOME DE FANTASIA',
  'LOCATÁRIO',
  'VALOR',
  'INÍCIO',
  'FIM',
  'REAJUSTE',
  'R$ M² LOC',
] as const

export interface LinhaImportada {
  imovel: ImovelInput
  avisos: string[]
}

function textoOuNull(v: unknown): string | null {
  if (v == null) return null
  const s = String(v).trim()
  return s === '' ? null : s
}

function numeroOuNull(v: unknown): number | null {
  if (v == null || v === '') return null
  const n = typeof v === 'number' ? v : Number(String(v).replace(/\./g, '').replace(',', '.'))
  return Number.isFinite(n) ? n : null
}

function dataOuNull(v: unknown): Timestamp | null {
  if (v == null || v === '') return null
  if (v instanceof Date) return Timestamp.fromDate(v)
  const d = new Date(String(v))
  return Number.isNaN(d.getTime()) ? null : Timestamp.fromDate(d)
}

function normalizarStatus(raw: unknown): StatusImovel {
  const s = textoOuNull(raw)?.toUpperCase() ?? ''
  if (s.includes('LOCADO') && s.includes('VAGO')) return 'LOCADO_PARCIAL'
  if (s.includes('ATIVO INTERNO')) return 'ATIVO_INTERNO'
  if (s.includes('LOCADO')) return 'LOCADO'
  if (s.includes('VAGO')) return 'VAGO'
  return 'VAGO'
}

function normalizarTipo(raw: unknown): TipoImovel {
  const s = (textoOuNull(raw) ?? '').toUpperCase().replace(/\.$/, '').trim()
  if (s === 'PRÉDIO' || s === 'PREDIO') return 'PREDIO'
  if (s === 'APTO' || s === 'APARTAMENTO') return 'APTO'
  return (s || 'SALA') as TipoImovel
}

function normalizarOperacao(raw: unknown): Operacao {
  const s = textoOuNull(raw)?.toUpperCase() ?? ''
  if (s.includes('VENDA')) return 'VENDA'
  if (s.includes('DESENVOLVIMENTO')) return 'DESENVOLVIMENTO'
  return 'LOCACAO'
}

/**
 * Extração best-effort de município/bairro a partir do endereço livre.
 * Padrão observado: "LOGRADOURO, NÚMERO - CIDADE" (ex.: "AMERICO BUAIZ, 200 - VITORIA").
 * Quando não há esse padrão, município/bairro ficam null e o registro é
 * marcado como `enderecoRevisado: false` para revisão manual na UI.
 */
export function extrairLocalizacaoDoEndereco(endereco: string): { municipio: string | null; bairro: string | null; confiavel: boolean } {
  const partes = endereco.split(' - ')
  if (partes.length < 2) return { municipio: null, bairro: null, confiavel: false }

  const candidato = partes[partes.length - 1].trim()
  // Heurística: candidato parece nome de cidade se não tiver dígitos e tiver ao menos 3 letras.
  const pareceCidade = candidato.length >= 3 && !/\d/.test(candidato) && !/^(APTO|SALA|LOJA|BLOCO|QD|LT)\b/i.test(candidato)

  if (!pareceCidade) return { municipio: null, bairro: null, confiavel: false }
  return { municipio: candidato, bairro: null, confiavel: true }
}

/** Converte uma linha bruta da planilha (objeto com as chaves de COLUNAS_ESPERADAS) em um ImovelInput. */
export function mapearLinha(linha: Record<string, unknown>): LinhaImportada {
  const avisos: string[] = []

  const endereco = textoOuNull(linha['ENDEREÇO']) ?? ''
  if (!endereco) avisos.push('Endereço vazio')

  const status = normalizarStatus(linha['STATUS'])
  const tipo = normalizarTipo(linha['TIPO'])

  const estado = textoOuNull(linha['ESTADO'])
  let municipio = textoOuNull(linha['MUNICÍPIO'])
  let bairro = textoOuNull(linha['BAIRRO'])
  let enderecoRevisado = true

  if (!municipio && endereco) {
    const extraido = extrairLocalizacaoDoEndereco(endereco)
    municipio = extraido.municipio
    bairro = bairro ?? extraido.bairro
    if (extraido.confiavel) {
      avisos.push(`Município "${extraido.municipio}" inferido automaticamente do endereço — revisar`)
      enderecoRevisado = false
    } else {
      avisos.push('Não foi possível inferir município/bairro do endereço — preencher manualmente')
      enderecoRevisado = false
    }
  }

  const areaConstruida = numeroOuNull(linha['ÁREA CONSTRUÍDA'])
  const valorAluguel = numeroOuNull(linha['VALOR'])
  const valorM2Planilha = numeroOuNull(linha['R$ M² LOC'])
  const valorM2 = valorM2Planilha ?? (valorAluguel && areaConstruida ? Number((valorAluguel / areaConstruida).toFixed(2)) : null)

  const imovel: ImovelInput = {
    endereco,
    pastaFisica: textoOuNull(linha['PASTA'])?.toUpperCase() === 'S',
    kmzUrl: textoOuNull(linha['KMZ']),
    coordenadas: null,

    estado,
    municipio,
    bairro,
    enderecoRevisado,

    operacao: normalizarOperacao(linha['OPERAÇÃO']),
    segmento: textoOuNull(linha['SEGMENTO']),
    proprietario: textoOuNull(linha['PROPRIETÁRIOS']),
    tipo,

    valorContabil: numeroOuNull(linha['Valor Contábil']),
    valorMercadoImovel: numeroOuNull(linha['Valor de Mercado']),

    status,

    matriculaZona: textoOuNull(linha['MATRÍCULA / ZONA']),
    inscricaoIptu: textoOuNull(linha['INSC. IPTU']),
    areaTerreno: numeroOuNull(linha['ÁREA TERRENO']),
    areaConstruida,
    nomeFantasia: textoOuNull(linha['NOME DE FANTASIA']),

    fotos: [],
    anexos: [],

    locacao: {
      locatario: textoOuNull(linha['LOCATÁRIO']),
      valorAluguel,
      dataInicio: dataOuNull(linha['INÍCIO']),
      dataFim: dataOuNull(linha['FIM']),
      reajuste: textoOuNull(linha['REAJUSTE']),
      valorM2,
    },

    comparativoMercado: {
      valorM2Regiao: null,
      fonte: null,
      atualizadoEm: null,
      atualizadoPor: null,
    },

    importadoDe: null,
  }

  return { imovel, avisos }
}
