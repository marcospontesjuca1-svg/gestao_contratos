import ExcelJS from 'exceljs'
import logoUrl from '../assets/logo-er-participacoes.png'

const VERMELHO_MARCA = 'FFDC2626'
const CINZA_CLARO = 'FFF1F5F9'
const CINZA_TEXTO = 'FF64748B'

export interface RelatorioExcel {
  /** Nome do arquivo baixado, sem extensão. */
  nomeArquivo: string
  /** Nome da aba (máx. 31 caracteres, o Excel corta o resto). */
  aba: string
  titulo: string
  subtitulo?: string
  colunas: string[]
  linhas: (string | number)[][]
}

async function carregarLogoBase64(): Promise<string | null> {
  try {
    const resposta = await fetch(logoUrl)
    const buffer = await resposta.arrayBuffer()
    const bytes = new Uint8Array(buffer)
    let binario = ''
    for (let i = 0; i < bytes.length; i++) binario += String.fromCharCode(bytes[i])
    return btoa(binario)
  } catch {
    return null
  }
}

function larguraColuna(cabecalho: string, valores: (string | number)[]): number {
  const maiorConteudo = valores.reduce<number>((max, v) => Math.max(max, String(v ?? '').length), cabecalho.length)
  return Math.min(42, Math.max(10, maiorConteudo + 2))
}

/**
 * Gera um .xlsx com identidade visual (logo, título, cabeçalho repetido em
 * cada página impressa, rodapé com numeração de página) e dispara o download.
 */
export async function gerarRelatorioExcel(dados: RelatorioExcel): Promise<void> {
  const workbook = new ExcelJS.Workbook()
  workbook.creator = 'ER Participações — Gestão de Ativos'
  workbook.created = new Date()

  const LINHA_CABECALHOS = 8
  const sheet = workbook.addWorksheet(dados.aba.slice(0, 31), {
    views: [{ showGridLines: false, state: 'frozen', ySplit: LINHA_CABECALHOS }],
    pageSetup: {
      orientation: 'landscape',
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0,
      printTitlesRow: `${LINHA_CABECALHOS}:${LINHA_CABECALHOS}`,
      margins: { left: 0.4, right: 0.4, top: 0.6, bottom: 0.6, header: 0.2, footer: 0.2 },
    },
    headerFooter: {
      oddFooter: `&LGerado em &D &T&CPágina &P de &N&RER Participações — Gestão de Ativos`,
      evenFooter: `&LGerado em &D &T&CPágina &P de &N&RER Participações — Gestão de Ativos`,
    },
  })

  for (let r = 1; r <= 4; r++) sheet.getRow(r).height = 15
  const logoBase64 = await carregarLogoBase64()
  if (logoBase64) {
    const imagemId = workbook.addImage({ base64: `data:image/png;base64,${logoBase64}`, extension: 'png' })
    sheet.addImage(imagemId, { tl: { col: 0, row: 0 }, ext: { width: 150, height: 47 } })
  }

  sheet.mergeCells(5, 1, 5, dados.colunas.length)
  const celulaTitulo = sheet.getCell(5, 1)
  celulaTitulo.value = dados.titulo
  celulaTitulo.font = { name: 'Calibri', size: 14, bold: true, color: { argb: 'FF0F172A' } }

  if (dados.subtitulo) {
    sheet.mergeCells(6, 1, 6, dados.colunas.length)
    const celulaSubtitulo = sheet.getCell(6, 1)
    celulaSubtitulo.value = dados.subtitulo
    celulaSubtitulo.font = { name: 'Calibri', size: 10, color: { argb: CINZA_TEXTO } }
  }

  const linhaCabecalho = sheet.getRow(LINHA_CABECALHOS)
  dados.colunas.forEach((cabecalho, i) => {
    const celula = linhaCabecalho.getCell(i + 1)
    celula.value = cabecalho
    celula.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FFFFFFFF' } }
    celula.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: VERMELHO_MARCA } }
    celula.alignment = { vertical: 'middle' }
    celula.border = { bottom: { style: 'thin', color: { argb: 'FFCBD5E1' } } }
  })
  linhaCabecalho.height = 20

  dados.linhas.forEach((linha, indice) => {
    const row = sheet.getRow(LINHA_CABECALHOS + 1 + indice)
    linha.forEach((valor, i) => {
      const celula = row.getCell(i + 1)
      celula.value = valor
      celula.font = { name: 'Calibri', size: 10 }
      celula.border = { bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } } }
      if (indice % 2 === 1) celula.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: CINZA_CLARO } }
    })
  })

  dados.colunas.forEach((cabecalho, i) => {
    const valoresColuna = dados.linhas.map((linha) => linha[i])
    sheet.getColumn(i + 1).width = larguraColuna(cabecalho, valoresColuna)
  })

  const buffer = await workbook.xlsx.writeBuffer()
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${dados.nomeArquivo}.xlsx`
  link.click()
  URL.revokeObjectURL(url)
}
