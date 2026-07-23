import * as XLSX from 'xlsx'

/** Lê a primeira planilha de um arquivo .xls/.xlsx e retorna linhas como objetos {cabeçalho: valor}. */
export async function lerPrimeiraAba(arquivo: File): Promise<Record<string, unknown>[]> {
  const buffer = await arquivo.arrayBuffer()
  const workbook = XLSX.read(buffer, { cellDates: true })
  const primeiraAba = workbook.SheetNames[0]
  const sheet = workbook.Sheets[primeiraAba]
  return XLSX.utils.sheet_to_json(sheet, { defval: null })
}
