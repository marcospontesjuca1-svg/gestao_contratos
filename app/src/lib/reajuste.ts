/**
 * Reajuste contratual — busca índices oficiais do Banco Central (Sistema
 * Gerenciador de Séries Temporais, SGS: https://api.bcb.gov.br) e calcula o
 * reajuste acumulado de 12 meses para aplicar sobre o valor do aluguel.
 *
 * Metodologia: acumula a variação mensal do índice nos 12 meses anteriores
 * ao mês de reajuste (mesma fonte oficial usada pela Calculadora do
 * Cidadão do BCB; não é uma cópia literal daquela ferramenta, que também
 * permite correção pró-rata por dia — aqui o cálculo é por meses cheios,
 * que é a prática usual em reajuste de contrato de locação).
 */

export const MESES: { chave: string; numero: number; nome: string }[] = [
  { chave: 'JAN', numero: 1, nome: 'Janeiro' },
  { chave: 'FEV', numero: 2, nome: 'Fevereiro' },
  { chave: 'MAR', numero: 3, nome: 'Março' },
  { chave: 'ABR', numero: 4, nome: 'Abril' },
  { chave: 'MAI', numero: 5, nome: 'Maio' },
  { chave: 'JUN', numero: 6, nome: 'Junho' },
  { chave: 'JUL', numero: 7, nome: 'Julho' },
  { chave: 'AGO', numero: 8, nome: 'Agosto' },
  { chave: 'SET', numero: 9, nome: 'Setembro' },
  { chave: 'OUT', numero: 10, nome: 'Outubro' },
  { chave: 'NOV', numero: 11, nome: 'Novembro' },
  { chave: 'DEZ', numero: 12, nome: 'Dezembro' },
]

export interface IndiceEconomico {
  codigo: string
  nome: string
  serieSgs: number
}

export const INDICES: IndiceEconomico[] = [
  { codigo: 'IPCA', nome: 'IPCA (IBGE)', serieSgs: 433 },
  { codigo: 'IGPM', nome: 'IGP-M (FGV)', serieSgs: 189 },
  { codigo: 'INPC', nome: 'INPC (IBGE)', serieSgs: 188 },
  { codigo: 'IGPDI', nome: 'IGP-DI (FGV)', serieSgs: 190 },
]

/** Interpreta o texto livre do campo "Reajuste" (ex.: "MAR / IPCA", "JAN") e sugere mês + índice. */
export function interpretarReajuste(raw: string | null): { mes: number | null; indice: string | null } {
  if (!raw) return { mes: null, indice: null }
  const partes = raw.toUpperCase().split('/').map((p) => p.trim())
  const mesEncontrado = MESES.find((m) => partes[0]?.startsWith(m.chave))
  const indiceEncontrado = partes.slice(1).flatMap((p) => INDICES.filter((i) => p.includes(i.codigo)))[0]
  return { mes: mesEncontrado?.numero ?? null, indice: indiceEncontrado?.codigo ?? null }
}

export interface PontoIndice {
  competencia: string // "MM/AAAA"
  valorPercentual: number
}

function formatarDataBcb(data: Date): string {
  const dia = String(data.getDate()).padStart(2, '0')
  const mes = String(data.getMonth() + 1).padStart(2, '0')
  return `${dia}/${mes}/${data.getFullYear()}`
}

/**
 * Busca os valores mensais de um índice do SGS/BCB no intervalo informado.
 * API pública, sem autenticação: https://api.bcb.gov.br
 */
export async function buscarSerieIndice(indice: IndiceEconomico, dataInicial: Date, dataFinal: Date): Promise<PontoIndice[]> {
  const url = `https://api.bcb.gov.br/dados/serie/bcdata.sgs.${indice.serieSgs}/dados?formato=json&dataInicial=${formatarDataBcb(dataInicial)}&dataFinal=${formatarDataBcb(dataFinal)}`
  const resposta = await fetch(url)
  if (!resposta.ok) throw new Error(`Banco Central respondeu ${resposta.status} ao buscar a série do ${indice.nome}`)
  const dados: { data: string; valor: string }[] = await resposta.json()
  return dados.map((d) => {
    const [, mes, ano] = d.data.split('/')
    return { competencia: `${mes}/${ano}`, valorPercentual: Number(d.valor) }
  })
}

/** Fator acumulado (ex.: 0.0523 = 5,23%) a partir dos valores mensais percentuais do índice. */
export function calcularFatorAcumulado(pontos: PontoIndice[]): number {
  const fator = pontos.reduce((acc, p) => acc * (1 + p.valorPercentual / 100), 1)
  return fator - 1
}

/**
 * Janela de 12 meses cheios terminando no mês anterior ao mês de reajuste
 * informado (ex.: reajuste em março/2026 -> mar/2025 a fev/2026).
 */
export function janelaDozeMeses(mesReajuste: number, anoReferencia: number): { inicio: Date; fim: Date } {
  const fim = new Date(anoReferencia, mesReajuste - 2, 1) // mês anterior ao reajuste
  const inicio = new Date(fim.getFullYear(), fim.getMonth() - 11, 1)
  return { inicio, fim }
}
