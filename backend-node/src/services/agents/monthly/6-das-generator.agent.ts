/**
 * AGENT 6: DAS Generator
 *
 * Responsabilidade: Gerar guia DAS em PDF para pagamento
 * Modelo: NÃO USA IA - Geração de PDF
 *
 * Input: Cálculo do imposto
 * Output: PDF da guia DAS (formato oficial da Receita Federal)
 */

import PDFDocument from 'pdfkit'
import * as fs from 'fs'
import * as path from 'path'

interface DASData {
  client_name: string
  cnpj: string
  reference_month: number
  reference_year: number
  regime: string
  anexo?: string
  valor_total: number
  vencimento: string
  breakdown?: any
}

export class DASGeneratorAgent {

  constructor() {
    console.log('✅ DASGeneratorAgent inicializado')

    // Criar pasta de uploads se não existir
    const uploadsDir = path.join(__dirname, '../../../../uploads/das')
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true })
    }
  }

  /**
   * Gera PDF da guia DAS
   */
  async generateDAS(data: DASData): Promise<string> {
    const fileName = `DAS_${data.cnpj.replace(/\D/g, '')}_${data.reference_year}_${String(data.reference_month).padStart(2, '0')}.pdf`
    const filePath = path.join(__dirname, '../../../../uploads/das', fileName)

    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ size: 'A4', margin: 50 })
        const stream = fs.createWriteStream(filePath)

        doc.pipe(stream)

        // Header
        doc.fontSize(20).text('DOCUMENTO DE ARRECADAÇÃO DO SIMPLES NACIONAL', { align: 'center' })
        doc.fontSize(12).text('DAS - Simples Nacional', { align: 'center' })
        doc.moveDown()

        // Dados do contribuinte
        doc.fontSize(10).text('DADOS DO CONTRIBUINTE', { underline: true })
        doc.moveDown(0.5)
        doc.fontSize(9)
        doc.text(`Razão Social: ${data.client_name}`)
        doc.text(`CNPJ: ${this.formatCNPJ(data.cnpj)}`)
        doc.text(`Período de Apuração: ${this.getMonthName(data.reference_month)}/${data.reference_year}`)
        doc.moveDown()

        // Dados do tributo
        doc.fontSize(10).text('DADOS DO TRIBUTO', { underline: true })
        doc.moveDown(0.5)
        doc.fontSize(9)
        doc.text(`Regime: ${data.regime}`)
        if (data.anexo) {
          doc.text(`Anexo: ${data.anexo}`)
        }
        doc.moveDown()

        // Breakdown dos impostos
        if (data.breakdown) {
          doc.fontSize(10).text('COMPOSIÇÃO DO VALOR', { underline: true })
          doc.moveDown(0.5)
          doc.fontSize(9)

          Object.entries(data.breakdown).forEach(([key, value]) => {
            if (typeof value === 'number' && value > 0) {
              doc.text(`${key}: R$ ${this.formatCurrency(value)}`, { indent: 20 })
            }
          })
          doc.moveDown()
        }

        // Valor total (destaque)
        doc.fontSize(14)
        doc.fillColor('red')
        doc.text(`VALOR TOTAL: R$ ${this.formatCurrency(data.valor_total)}`, { align: 'center' })
        doc.fillColor('black')
        doc.moveDown()

        // Vencimento
        doc.fontSize(12)
        doc.text(`Vencimento: ${this.formatDate(data.vencimento)}`, { align: 'center' })
        doc.moveDown(2)

        // Código de barras (simulado)
        doc.fontSize(8)
        doc.text('CÓDIGO DE BARRAS', { align: 'center' })
        doc.fontSize(10)
        doc.font('Courier')
        doc.text(this.generateBarcode(data), { align: 'center' })
        doc.font('Helvetica')
        doc.moveDown(2)

        // Instruções
        doc.fontSize(8)
        doc.fillColor('gray')
        doc.text('INSTRUÇÕES DE PAGAMENTO:', { underline: true })
        doc.text('• Este documento pode ser pago em qualquer banco até a data de vencimento')
        doc.text('• Após o vencimento, haverá incidência de multa e juros')
        doc.text('• Guarde este comprovante para fins fiscais e contábeis')
        doc.text('• Em caso de dúvidas, consulte seu contador')
        doc.moveDown(2)

        // Footer
        doc.fontSize(7)
        doc.fillColor('black')
        doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, { align: 'center' })
        doc.text('Sistema de Contabilidade AI', { align: 'center' })

        doc.end()

        stream.on('finish', () => {
          console.log(`✅ DAS gerado: ${filePath}`)
          resolve(filePath)
        })

        stream.on('error', (err) => {
          console.error('❌ Erro ao gerar DAS:', err)
          reject(err)
        })

      } catch (error) {
        console.error('❌ Erro ao criar PDF:', error)
        reject(error)
      }
    })
  }

  /**
   * Gera DARF (Lucro Presumido)
   */
  async generateDARF(data: any, tipo: 'IRPJ' | 'CSLL' | 'PIS' | 'COFINS'): Promise<string> {
    const fileName = `DARF_${tipo}_${data.cnpj.replace(/\D/g, '')}_${data.reference_year}_${String(data.reference_month).padStart(2, '0')}.pdf`
    const filePath = path.join(__dirname, '../../../../uploads/das', fileName)

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ size: 'A4', margin: 50 })
      const stream = fs.createWriteStream(filePath)

      doc.pipe(stream)

      doc.fontSize(18).text(`DARF - ${tipo}`, { align: 'center' })
      doc.fontSize(10).text('Documento de Arrecadação de Receitas Federais', { align: 'center' })
      doc.moveDown(2)

      // Dados do contribuinte
      doc.fontSize(9)
      doc.text(`CNPJ: ${this.formatCNPJ(data.cnpj)}`)
      doc.text(`Razão Social: ${data.client_name}`)
      doc.text(`Período: ${this.getMonthName(data.reference_month)}/${data.reference_year}`)
      doc.moveDown()

      // Código da receita (exemplos)
      const codigos: Record<string, string> = {
        'IRPJ': '2089 - IRPJ - Pessoa Jurídica - Lucro Presumido',
        'CSLL': '2372 - CSLL - Pessoa Jurídica',
        'PIS': '8109 - PIS/PASEP',
        'COFINS': '2172 - COFINS'
      }

      doc.text(`Código da Receita: ${codigos[tipo]}`)
      doc.moveDown()

      // Valor
      const valor = data[tipo.toLowerCase()] || data.valor_total
      doc.fontSize(16).fillColor('red')
      doc.text(`Valor: R$ ${this.formatCurrency(valor)}`, { align: 'center' })
      doc.fillColor('black')
      doc.moveDown()

      doc.fontSize(10)
      doc.text(`Vencimento: ${this.formatDate(data.vencimento)}`, { align: 'center' })

      doc.end()

      stream.on('finish', () => resolve(filePath))
      stream.on('error', reject)
    })
  }

  // Helper functions
  private formatCNPJ(cnpj: string): string {
    const cleaned = cnpj.replace(/\D/g, '')
    return cleaned.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5')
  }

  private formatCurrency(value: number): string {
    return value.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  }

  private formatDate(dateString: string): string {
    const date = new Date(dateString)
    return date.toLocaleDateString('pt-BR')
  }

  private getMonthName(month: number): string {
    const months = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
                    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']
    return months[month - 1]
  }

  private generateBarcode(data: DASData): string {
    // Simulação de código de barras (na prática seria gerado conforme padrão Febraban)
    const cnpj = data.cnpj.replace(/\D/g, '')
    const valor = Math.round(data.valor_total * 100).toString().padStart(10, '0')
    const vencimento = data.vencimento.replace(/-/g, '')
    return `${cnpj}${valor}${vencimento}`.substring(0, 47).padEnd(47, '0')
  }
}
