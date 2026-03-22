/**
 * AGENT 3: NFe Data Extractor
 *
 * Responsabilidade: Ler XML das NFe e extrair dados fiscais
 * Modelo: NÃO USA IA - apenas parse XML
 * Temperature: N/A
 *
 * Input: XMLs das NFe
 * Output: Dados estruturados (valor, impostos, CFOP, etc)
 */

import * as xml2js from 'xml2js'

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

  constructor() {
    this.parser = new xml2js.Parser({
      explicitArray: false,
      mergeAttrs: true,
      tagNameProcessors: [xml2js.processors.stripPrefix]
    })
    console.log('✅ NFeExtractorAgent inicializado')
  }

  /**
   * Extrai dados de uma NFe (XML)
   * @param xmlContent Conteúdo do XML da NFe
   * @param nfeType 'EMITIDA' ou 'RECEBIDA'
   */
  async extractFromXML(xmlContent: string, nfeType: 'EMITIDA' | 'RECEBIDA'): Promise<NFeData> {
    try {
      const result = await this.parser.parseStringPromise(xmlContent)

      // Estrutura padrão da NFe brasileira
      const nfe = result.nfeProc?.NFe || result.NFe

      if (!nfe) {
        throw new Error('XML não é uma NFe válida (padrão)')
      }

      return this.extractStandardNFe(nfe, nfeType)

    } catch (error) {
      console.error('❌ Erro ao extrair dados da NFe:', error)
      throw new Error(`Erro ao processar XML da NFe: ${error}`)
    }
  }

  /**
   * Extrai múltiplas NFes de um único arquivo XML (suporte a lote/batch)
   * Aceita: padrão nfeProc/NFe individual, ou formato batch <nfes><nfe>...</nfe></nfes>
   */
  async extractFromXMLBatch(xmlContent: string, nfeType: 'EMITIDA' | 'RECEBIDA'): Promise<NFeData[]> {
    try {
      const result = await this.parser.parseStringPromise(xmlContent)

      console.log('   🔍 XML root keys:', Object.keys(result))

      // Formato batch simplificado: <nfes><nfe>...</nfe></nfes>
      if (result.nfes?.nfe) {
        const nfes = Array.isArray(result.nfes.nfe) ? result.nfes.nfe : [result.nfes.nfe]
        return nfes.map((nfe: any) => this.extractSimplifiedNFe(nfe, nfeType))
      }

      // Formato padrão SEFAZ: <nfeProc><NFe>...</NFe></nfeProc>
      // Com stripPrefix, namespace é removido. Pode ter múltiplas <NFe> num só arquivo.
      const nfeContent = result.nfeProc?.NFe || result.NFe
      if (nfeContent) {
        // Se é um array (múltiplas NFes no mesmo arquivo)
        if (Array.isArray(nfeContent)) {
          console.log(`   📦 Encontradas ${nfeContent.length} NFes no arquivo`)
          return nfeContent.map((nfe: any) => this.extractStandardNFe(nfe, nfeType))
        }
        // NFe única
        return [this.extractStandardNFe(nfeContent, nfeType)]
      }

      console.warn('⚠️ XML sem NFes reconhecíveis. Root keys:', Object.keys(result))
      return []
    } catch (error) {
      console.error('❌ Erro ao extrair batch de NFes:', error)
      return []
    }
  }

  /**
   * Extrai dados do formato padrão SEFAZ (nfeProc/NFe)
   */
  private extractStandardNFe(nfe: any, nfeType: 'EMITIDA' | 'RECEBIDA'): NFeData {
    const infNFe = nfe.infNFe || nfe
    const ide = infNFe.ide || {}
    const total = infNFe.total?.ICMSTot || {}
    const partner = nfeType === 'EMITIDA' ? infNFe?.dest : infNFe?.emit

    // nfe_key pode estar como atributo Id do infNFe (mergeAttrs coloca no mesmo nível)
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

  /**
   * Extrai dados de formato simplificado (<nfe> com campos diretos)
   * Formato: <nfe><numero>1001</numero><valor>25000</valor>...</nfe>
   */
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

  /**
   * Processa múltiplos XMLs (por exemplo, de um ZIP)
   */
  async extractMultiple(xmlContents: string[], nfeType: 'EMITIDA' | 'RECEBIDA'): Promise<NFeData[]> {
    const results: NFeData[] = []

    for (const xml of xmlContents) {
      try {
        const data = await this.extractFromXML(xml, nfeType)
        results.push(data)
      } catch (error) {
        console.error('Erro ao processar uma NFe:', error)
        // Continua processando as outras mesmo se uma falhar
      }
    }

    return results
  }

  /**
   * Calcula totais agregados
   */
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

  // Helper functions
  private formatDate(dateString: any): string {
    if (!dateString) return 'N/A'
    // Converte de "2025-01-15T10:30:00-03:00" para "2025-01-15"
    return dateString.split('T')[0]
  }

  private extractCFOP(det: any): string {
    if (Array.isArray(det)) {
      // Se tem múltiplos itens, pega CFOP do primeiro
      return det[0]?.prod?.CFOP || ''
    } else {
      // Se tem apenas um item
      return det?.prod?.CFOP || ''
    }
  }

  /**
   * Validação básica do XML antes de processar
   */
  validateXML(xmlContent: string): boolean {
    // Verificações básicas
    if (!xmlContent || xmlContent.trim() === '') {
      return false
    }

    // Deve conter tags NFe
    if (!xmlContent.includes('<NFe') && !xmlContent.includes('<nfeProc')) {
      return false
    }

    // Deve ter chave de acesso
    if (!xmlContent.includes('Id="NFe')) {
      return false
    }

    return true
  }
}
