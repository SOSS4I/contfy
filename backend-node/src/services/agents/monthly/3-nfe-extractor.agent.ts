/**
 * AGENT 3: NFe Data Extractor
 *
 * Responsabilidade: Ler NFe (XML ou PDF) e extrair dados fiscais
 * Modelo XML: Parse nativo (rápido, gratuito, 100% preciso)
 * Modelo PDF: claude-opus-4-6 (máxima precisão para documentos complexos)
 * Temperature: 0 (determinístico)
 *
 * Input: XML ou PDF das NFe
 * Output: Dados estruturados (valor, impostos, CFOP, etc)
 */

import * as xml2js from 'xml2js'
import Anthropic from '@anthropic-ai/sdk'
import * as fs from 'fs'
import * as path from 'path'

interface NFeData {
  nfe_number: string
  nfe_series: string
  nfe_key: string
  nfe_date: string
  total_value: number
  base_calculo_icms: number
  valor_icms: number
  base_calculo_issqn: number
  valor_issqn: number
  valor_pis: number
  valor_cofins: number
  cfop: string
  partner_cnpj_cpf: string
  partner_name: string
}

export class NFeExtractorAgent {
  private parser: xml2js.Parser
  private client: Anthropic

  constructor() {
    this.parser = new xml2js.Parser({
      explicitArray: false,
      mergeAttrs: true,
      tagNameProcessors: [xml2js.processors.stripPrefix]
    })
    this.client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
    console.log('✅ NFeExtractorAgent inicializado')
  }

  /**
   * Detecta o tipo de arquivo pelo conteúdo e roteia para o extrator correto.
   * Aceita: XML (string), PDF (Buffer ou caminho de arquivo)
   */
  async extractFromFile(
    filePathOrContent: string,
    nfeType: 'EMITIDA' | 'RECEBIDA',
    isFilePath = false
  ): Promise<NFeData[]> {
    if (isFilePath) {
      const ext = path.extname(filePathOrContent).toLowerCase()
      if (ext === '.pdf') {
        return this.extractFromPDF(filePathOrContent, nfeType)
      }
      // XML ou ZIP: lê como texto
      const content = fs.readFileSync(filePathOrContent, 'utf-8')
      return this.extractFromXMLBatch(content, nfeType)
    }

    // Content string: verifica se é PDF pelo magic bytes ou XML pelo conteúdo
    const trimmed = filePathOrContent.trim()
    if (trimmed.startsWith('%PDF')) {
      // É um PDF passado como string — converte para Buffer
      const buf = Buffer.from(filePathOrContent, 'binary')
      return this.extractFromPDFBuffer(buf, nfeType)
    }

    return this.extractFromXMLBatch(filePathOrContent, nfeType)
  }

  /**
   * Extrai NFes de PDF usando Claude Opus (máxima precisão)
   * @param filePath Caminho absoluto do arquivo PDF
   */
  async extractFromPDF(filePath: string, nfeType: 'EMITIDA' | 'RECEBIDA'): Promise<NFeData[]> {
    console.log(`   📄 Extraindo NFe de PDF via Claude Opus: ${path.basename(filePath)}`)
    const buffer = fs.readFileSync(filePath)
    return this.extractFromPDFBuffer(buffer, nfeType)
  }

  /**
   * Extrai NFes de um Buffer PDF usando Claude Opus
   */
  async extractFromPDFBuffer(buffer: Buffer, nfeType: 'EMITIDA' | 'RECEBIDA'): Promise<NFeData[]> {
    const base64 = buffer.toString('base64')

    const prompt = `Você é um especialista em Notas Fiscais Eletrônicas (NFe) brasileiras.

Analise este documento PDF e extraia TODOS os dados de TODAS as Notas Fiscais presentes.

Para cada NFe encontrada, retorne um JSON com EXATAMENTE esta estrutura:
{
  "nfe_number": "número da nota (ex: 001234)",
  "nfe_series": "série da nota (ex: 1)",
  "nfe_key": "chave de acesso de 44 dígitos (se disponível, senão vazio)",
  "nfe_date": "data de emissão no formato YYYY-MM-DD",
  "total_value": valor total da nota em número decimal,
  "base_calculo_icms": base de cálculo ICMS em número decimal (0 se não aplicável),
  "valor_icms": valor do ICMS em número decimal (0 se não aplicável),
  "base_calculo_issqn": base de cálculo ISSQN em número decimal (0 se não aplicável),
  "valor_issqn": valor do ISS/ISSQN em número decimal (0 se não aplicável),
  "valor_pis": valor do PIS em número decimal (0 se não aplicável),
  "valor_cofins": valor do COFINS em número decimal (0 se não aplicável),
  "cfop": "código CFOP principal (ex: 5102)",
  "partner_cnpj_cpf": "CNPJ ou CPF do ${nfeType === 'EMITIDA' ? 'destinatário' : 'emitente'} (somente números)",
  "partner_name": "razão social do ${nfeType === 'EMITIDA' ? 'destinatário' : 'emitente'}"
}

IMPORTANTE:
- Se houver múltiplas notas, retorne um ARRAY de objetos JSON
- Se houver apenas uma nota, retorne um ARRAY com um objeto
- Use 0 para campos numéricos não encontrados, nunca null ou undefined
- Extraia TODOS os valores com máxima precisão
- Retorne APENAS o JSON, sem texto adicional, sem markdown, sem explicações

JSON:`

    try {
      const response = await this.client.messages.create({
        model: 'claude-opus-4-6',
        max_tokens: 8192,
        temperature: 0,
        messages: [{
          role: 'user',
          content: [
            {
              type: 'document',
              source: {
                type: 'base64',
                media_type: 'application/pdf',
                data: base64
              }
            } as any,
            {
              type: 'text',
              text: prompt
            }
          ]
        }]
      })

      const rawText = response.content[0].type === 'text' ? response.content[0].text.trim() : ''

      // Remove possíveis markdown code blocks
      const jsonText = rawText.replace(/^```json?\s*/i, '').replace(/\s*```$/i, '').trim()

      let parsed: any
      try {
        parsed = JSON.parse(jsonText)
      } catch {
        // Tenta extrair JSON do texto
        const match = jsonText.match(/\[[\s\S]*\]|\{[\s\S]*\}/)
        if (!match) throw new Error('Resposta do Claude não contém JSON válido')
        parsed = JSON.parse(match[0])
      }

      const nfes: any[] = Array.isArray(parsed) ? parsed : [parsed]

      return nfes.map((nfe, idx) => this.normalizePDFExtraction(nfe, nfeType, idx))

    } catch (error: any) {
      console.error('❌ Erro ao extrair NFe de PDF via Claude:', error?.message)
      throw new Error(`Falha na extração de PDF: ${error?.message}`)
    }
  }

  /**
   * Normaliza e valida os dados extraídos do PDF pelo Claude
   */
  private normalizePDFExtraction(nfe: any, nfeType: 'EMITIDA' | 'RECEBIDA', idx: number): NFeData {
    const toNum = (v: any) => typeof v === 'number' ? v : parseFloat(String(v || '0').replace(',', '.')) || 0
    const toStr = (v: any) => String(v || '').trim()

    // Chave determinística se não encontrada
    const nfeKey = toStr(nfe.nfe_key).replace(/\D/g, '') ||
      `PDF_${toStr(nfe.nfe_number)}_${toStr(nfe.partner_cnpj_cpf).replace(/\D/g, '').slice(0, 8)}_${idx}`

    return {
      nfe_number: toStr(nfe.nfe_number),
      nfe_series: toStr(nfe.nfe_series) || '1',
      nfe_key: nfeKey,
      nfe_date: this.formatDate(toStr(nfe.nfe_date)),
      total_value: toNum(nfe.total_value),
      base_calculo_icms: toNum(nfe.base_calculo_icms),
      valor_icms: toNum(nfe.valor_icms),
      base_calculo_issqn: toNum(nfe.base_calculo_issqn),
      valor_issqn: toNum(nfe.valor_issqn),
      valor_pis: toNum(nfe.valor_pis),
      valor_cofins: toNum(nfe.valor_cofins),
      cfop: toStr(nfe.cfop) || '5102',
      partner_cnpj_cpf: toStr(nfe.partner_cnpj_cpf).replace(/\D/g, ''),
      partner_name: toStr(nfe.partner_name)
    }
  }

  /**
   * Extrai dados de uma NFe (XML)
   */
  async extractFromXML(xmlContent: string, nfeType: 'EMITIDA' | 'RECEBIDA'): Promise<NFeData> {
    try {
      const result = await this.parser.parseStringPromise(xmlContent)
      const nfe = result.nfeProc?.NFe || result.NFe
      if (!nfe) throw new Error('XML não é uma NFe válida (padrão)')
      return this.extractStandardNFe(nfe, nfeType)
    } catch (error) {
      console.error('❌ Erro ao extrair dados da NFe:', error)
      throw new Error(`Erro ao processar XML da NFe: ${error}`)
    }
  }

  /**
   * Extrai múltiplas NFes de um único arquivo XML
   */
  async extractFromXMLBatch(xmlContent: string, nfeType: 'EMITIDA' | 'RECEBIDA'): Promise<NFeData[]> {
    try {
      const result = await this.parser.parseStringPromise(xmlContent)

      // Formato batch simplificado
      if (result.nfes?.nfe) {
        const nfes = Array.isArray(result.nfes.nfe) ? result.nfes.nfe : [result.nfes.nfe]
        return nfes.map((nfe: any) => this.extractSimplifiedNFe(nfe, nfeType))
      }

      // Formato padrão SEFAZ
      const nfeContent = result.nfeProc?.NFe || result.NFe
      if (nfeContent) {
        if (Array.isArray(nfeContent)) {
          console.log(`   📦 Encontradas ${nfeContent.length} NFes no arquivo`)
          return nfeContent.map((nfe: any) => this.extractStandardNFe(nfe, nfeType))
        }
        return [this.extractStandardNFe(nfeContent, nfeType)]
      }

      console.warn('⚠️ XML sem NFes reconhecíveis')
      return []
    } catch (error) {
      console.error('❌ Erro ao extrair batch de NFes:', error)
      return []
    }
  }

  private extractStandardNFe(nfe: any, nfeType: 'EMITIDA' | 'RECEBIDA'): NFeData {
    const infNFe = nfe.infNFe || nfe
    const ide = infNFe.ide || {}
    const total = infNFe.total?.ICMSTot || {}
    const partner = nfeType === 'EMITIDA' ? infNFe?.dest : infNFe?.emit

    const rawKey = infNFe.Id || infNFe.id || ''
    const nfeKey = String(rawKey).replace('NFe', '')

    return {
      nfe_number: String(ide.nNF || ''),
      nfe_series: String(ide.serie || '1'),
      nfe_key: nfeKey,
      nfe_date: this.formatDate(ide.dhEmi || ide.dEmi),
      total_value: parseFloat(total?.vNF ?? '0') || 0,
      base_calculo_icms: parseFloat(total?.vBC ?? '0') || 0,
      valor_icms: parseFloat(total?.vICMS ?? '0') || 0,
      base_calculo_issqn: parseFloat(total?.vBCST ?? '0') || 0,
      valor_issqn: parseFloat(total?.vISS ?? '0') || 0,
      valor_pis: parseFloat(total?.vPIS ?? '0') || 0,
      valor_cofins: parseFloat(total?.vCOFINS ?? '0') || 0,
      cfop: this.extractCFOP(infNFe.det),
      partner_cnpj_cpf: String(partner?.CNPJ ?? partner?.CPF ?? ''),
      partner_name: String(partner?.xNome ?? partner?.xFant ?? '')
    }
  }

  private extractSimplifiedNFe(nfe: any, nfeType: 'EMITIDA' | 'RECEBIDA'): NFeData {
    return {
      nfe_number: String(nfe.numero || nfe.nNF || ''),
      nfe_series: String(nfe.serie || '1'),
      nfe_key: String(nfe.chave || nfe.key ||
        `SIMPLIFIED_${(nfe.nNF || nfe.numero || '0')}_${(nfe.CNPJ || nfe.cnpj || '0')}_${(nfe.dhEmi || nfe.data || '').replace(/\D/g, '').slice(0, 8)}`),
      nfe_date: this.formatDate(nfe.data || nfe.dhEmi || nfe.dEmi || new Date().toISOString()),
      total_value: parseFloat(nfe.valor || nfe.total_value || nfe.vNF || '0') || 0,
      base_calculo_icms: parseFloat(nfe.base_icms || '0') || 0,
      valor_icms: parseFloat(nfe.icms || nfe.valor_icms || '0') || 0,
      base_calculo_issqn: 0,
      valor_issqn: 0,
      valor_pis: parseFloat(nfe.pis || nfe.valor_pis || '0') || 0,
      valor_cofins: parseFloat(nfe.cofins || nfe.valor_cofins || '0') || 0,
      cfop: String(nfe.cfop || '5102'),
      partner_cnpj_cpf: String(nfe.cnpj_destinatario || nfe.cnpj_emitente || nfe.cnpj || ''),
      partner_name: String(nfe.destinatario || nfe.emitente || nfe.partner || '')
    }
  }

  async extractMultiple(xmlContents: string[], nfeType: 'EMITIDA' | 'RECEBIDA'): Promise<NFeData[]> {
    const results: NFeData[] = []
    for (const xml of xmlContents) {
      try {
        const data = await this.extractFromXML(xml, nfeType)
        results.push(data)
      } catch (error) {
        console.error('Erro ao processar uma NFe:', error)
      }
    }
    return results
  }

  calculateTotals(nfes: NFeData[]): {
    total_receita: number
    total_icms: number
    total_pis: number
    total_cofins: number
    quantidade_nfes: number
  } {
    return {
      total_receita: nfes.reduce((sum, nfe) => sum + nfe.total_value, 0),
      total_icms: nfes.reduce((sum, nfe) => sum + nfe.valor_icms, 0),
      total_pis: nfes.reduce((sum, nfe) => sum + nfe.valor_pis, 0),
      total_cofins: nfes.reduce((sum, nfe) => sum + nfe.valor_cofins, 0),
      quantidade_nfes: nfes.length
    }
  }

  private formatDate(dateString: any): string {
    if (!dateString) return new Date().toISOString().split('T')[0]
    return String(dateString).split('T')[0]
  }

  private extractCFOP(det: any): string {
    if (Array.isArray(det)) {
      // Coleta todos os CFOPs únicos do documento
      const cfops = det.map((item: any) => item?.prod?.CFOP).filter(Boolean)
      return cfops[0] || ''
    }
    return det?.prod?.CFOP || ''
  }

  /**
   * Detecta se o arquivo é PDF pelo magic bytes ou extensão
   */
  static isPDF(filePathOrBuffer: string | Buffer): boolean {
    if (Buffer.isBuffer(filePathOrBuffer)) {
      return filePathOrBuffer.slice(0, 4).toString() === '%PDF'
    }
    return path.extname(filePathOrBuffer).toLowerCase() === '.pdf'
  }
}
