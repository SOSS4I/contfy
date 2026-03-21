/**
 * AGENT 2: Document Validator
 *
 * Responsabilidade: Validar se os documentos enviados estão corretos e completos
 * Modelo: Claude Haiku (rápido e barato)
 * Temperature: 0
 *
 * Input: Documentos enviados + documentos esperados
 * Output: Validação OK/ERRO + lista de pendências
 */

import Anthropic from '@anthropic-ai/sdk'

interface DocumentValidationResult {
  status: 'COMPLETE' | 'INCOMPLETE' | 'ERROR'
  received: string[]
  missing: string[]
  errors: string[]
  message: string
}

export class DocumentValidatorAgent {
  private client: Anthropic | null = null

  constructor() {
    const apiKey = process.env.ANTHROPIC_API_KEY

    if (apiKey) {
      this.client = new Anthropic({ apiKey })
      console.log('✅ DocumentValidatorAgent inicializado')
    } else {
      console.warn('⚠️  ANTHROPIC_API_KEY não configurada - usando modo fallback')
    }
  }

  async validate(
    documentsReceived: Array<{ type: string; file_name: string; file_size: number }>,
    documentsExpected: Array<{ type: string; mandatory: boolean }>
  ): Promise<DocumentValidationResult> {

    // Validação básica (sem IA) - case-insensitive
    const receivedTypes = documentsReceived.map(d => d.type)
    const receivedTypesUpper = receivedTypes.map(t => t.toUpperCase())
    const mandatoryTypes = documentsExpected.filter(d => d.mandatory).map(d => d.type)
    const missingMandatory = mandatoryTypes.filter(type => !receivedTypesUpper.includes(type.toUpperCase()))

    // Se falta documentos obrigatórios
    if (missingMandatory.length > 0) {
      return {
        status: 'INCOMPLETE',
        received: receivedTypes,
        missing: missingMandatory,
        errors: [],
        message: this.buildMissingMessage(missingMandatory)
      }
    }

    // Validação de tamanho e formato (básica)
    const errors: string[] = []
    for (const doc of documentsReceived) {
      // Arquivo muito pequeno (< 1KB) - provavelmente corrompido
      if (doc.file_size < 1024) {
        errors.push(`Arquivo ${doc.file_name} muito pequeno (${doc.file_size} bytes) - pode estar corrompido`)
      }

      // Arquivo muito grande (> 50MB)
      if (doc.file_size > 50 * 1024 * 1024) {
        errors.push(`Arquivo ${doc.file_name} muito grande (${Math.round(doc.file_size / 1024 / 1024)}MB) - limite 50MB`)
      }

      // Validar extensão baseado no tipo
      const typeUpper = doc.type.toUpperCase()
      if (typeUpper === 'NFE_EMITIDAS' || typeUpper === 'NFE_RECEBIDAS' || typeUpper === 'NFE' || doc.type === 'NFe_EMITIDAS' || doc.type === 'NFe_RECEBIDAS') {
        if (!doc.file_name.match(/\.(xml|zip|pdf)$/i)) {
          errors.push(`${doc.file_name}: NFe deve ser em formato XML, ZIP ou PDF`)
        }
      } else if (typeUpper === 'FOLHA_PAGAMENTO' || typeUpper === 'EXTRATOS_BANCARIOS') {
        if (!doc.file_name.match(/\.(pdf|json|csv|xlsx|xls)$/i)) {
          errors.push(`${doc.file_name}: Deve ser em formato PDF, JSON, CSV ou Excel`)
        }
      }
    }

    if (errors.length > 0) {
      return {
        status: 'ERROR',
        received: receivedTypes,
        missing: [],
        errors,
        message: 'Alguns documentos apresentam problemas. Corrija e envie novamente.'
      }
    }

    // Tudo OK!
    return {
      status: 'COMPLETE',
      received: receivedTypes,
      missing: [],
      errors: [],
      message: 'Todos os documentos foram recebidos e validados com sucesso!'
    }
  }

  private buildMissingMessage(missing: string[]): string {
    const translations: Record<string, string> = {
      'NFe_EMITIDAS': 'Notas Fiscais Emitidas',
      'NFe_RECEBIDAS': 'Notas Fiscais Recebidas (compras)',
      'FOLHA_PAGAMENTO': 'Folha de Pagamento',
      'EXTRATOS_BANCARIOS': 'Extratos Bancários'
    }

    const missingNames = missing.map(type => translations[type] || type)

    if (missingNames.length === 1) {
      return `Falta enviar: ${missingNames[0]}`
    } else {
      const last = missingNames.pop()
      return `Faltam enviar: ${missingNames.join(', ')} e ${last}`
    }
  }

  /**
   * Validação adicional com IA (opcional, mais custoso)
   * Pode ser usado para validar conteúdo dos arquivos
   */
  async validateWithAI(
    documents: Array<any>,
    clientContext: string
  ): Promise<string> {
    if (!this.client) {
      return 'Validação com IA não disponível'
    }

    try {
      const prompt = `Você é um validador de documentos contábeis.

CLIENTE: ${clientContext}

DOCUMENTOS RECEBIDOS:
${documents.map(d => `- ${d.type}: ${d.file_name} (${d.file_size} bytes)`).join('\n')}

Analise se os documentos recebidos são adequados para processar a contabilidade.
Retorne apenas "OK" ou liste os problemas identificados.`

      const message = await this.client.messages.create({
        model: 'claude-haiku-20250514',
        max_tokens: 512,
        temperature: 0,
        messages: [{ role: 'user', content: prompt }]
      })

      return message.content[0].type === 'text' ? message.content[0].text : 'OK'

    } catch (error) {
      console.error('Erro na validação com IA:', error)
      return 'Erro na validação com IA'
    }
  }
}
