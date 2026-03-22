/**
 * AGENT 1: Monthly Document Request
 *
 * Responsabilidade: Determinar EXATAMENTE quais documentos pedir para cada cliente
 * Modelo: Claude Opus 4.5
 * Temperature: 0.2
 *
 * Input: client_accounting_config + mês de referência
 * Output: Lista personalizada de documentos necessários
 */

import Anthropic from '@anthropic-ai/sdk'

interface DocumentRequest {
  type: string
  name: string
  description: string
  format: string
  mandatory: boolean
  reason?: string
}

interface DocumentRequestOutput {
  documents_needed: DocumentRequest[]
  deadline: string
  message_to_client: string
}

export class MonthlyDocumentRequestAgent {
  private client: Anthropic | null = null

  constructor() {
    const apiKey = process.env.ANTHROPIC_API_KEY

    if (apiKey) {
      this.client = new Anthropic({ apiKey })
      console.log('✅ MonthlyDocumentRequestAgent inicializado com Claude API')
    } else {
      console.warn('⚠️  ANTHROPIC_API_KEY não configurada - usando modo fallback')
    }
  }

  async requestDocuments(
    clientConfig: any,
    referenceMonth: number,
    referenceYear: number
  ): Promise<DocumentRequestOutput> {

    const monthName = getMonthName(referenceMonth)
    const deadline = calculateDeadline(referenceMonth, referenceYear)

    // Se não tem API key, usar lógica determinística
    if (!this.client) {
      return this.fallbackRequest(clientConfig, monthName, deadline)
    }

    try {
      const prompt = this.buildPrompt(clientConfig, monthName, referenceYear)

      const message = await this.client.messages.create({
        model: 'claude-opus-4-5-20251101',
        max_tokens: 2048,
        temperature: 0.2,
        messages: [{ role: 'user', content: prompt }]
      })

      const responseText = message.content[0].type === 'text' ? message.content[0].text : ''

      // Parse do JSON retornado pela IA
      const jsonMatch = responseText.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const result = JSON.parse(jsonMatch[0])
        return result
      }

      // Fallback se não conseguir parsear
      return this.fallbackRequest(clientConfig, monthName, deadline)

    } catch (error) {
      console.error('❌ Erro no Agent 1 (Document Request):', error)
      return this.fallbackRequest(clientConfig, monthName, deadline)
    }
  }

  private buildPrompt(config: any, monthName: string, year: number): string {
    return `Você é um agente especializado em contabilidade brasileira.

CLIENTE:
- Regime Tributário: ${config.regimeTributario}
- Anexo Simples: ${config.anexoSimples || 'N/A'}
- Atividade: ${config.atividade_principal}
- CNAE: ${config.cnae_code}
- Tem Funcionários: ${config.hasEmployees ? 'Sim' : 'Não'}
- Quantidade de Funcionários: ${config.employee_count || 0}
- Tem Pró-labore: ${config.has_prolabore ? 'Sim' : 'Não'}

INSTRUÇÕES DO CONTADOR:
${config.contadorInstructions || 'Nenhuma instrução especial'}

MÊS DE REFERÊNCIA: ${monthName}/${year}

TAREFA:
Determine EXATAMENTE quais documentos este cliente DEVE enviar para processarmos a contabilidade de ${monthName}/${year}.

REGRAS:
1. NFe Emitidas = SEMPRE obrigatório (exceto se não emite nota)
2. NFe Recebidas (compras) = SEMPRE obrigatório
3. Folha de Pagamento = Obrigatório SE tem funcionários OU pró-labore
4. Se Simples Nacional Anexo III ou V = Folha é OBRIGATÓRIA (para Fator R)
5. Extratos Bancários = Opcional mas recomendado
6. Leia as instruções do contador e adicione documentos extras se necessário

FORMATO DE RESPOSTA (JSON):
{
  "documents_needed": [
    {
      "type": "NFe_EMITIDAS",
      "name": "Notas Fiscais Emitidas",
      "description": "Todas as Notas Fiscais que você EMITIU em ${monthName}/${year}",
      "format": "XML das NFe",
      "mandatory": true
    },
    {
      "type": "FOLHA_PAGAMENTO",
      "name": "Folha de Pagamento",
      "description": "Folha de pagamento completa de ${monthName}/${year} com holerites, GPS e FGTS",
      "format": "PDF",
      "mandatory": true,
      "reason": "Necessário para cálculo do Fator R no Anexo III"
    }
  ],
  "deadline": "${calculateDeadline(parseInt(monthName.split('/')[0]), year)}",
  "message_to_client": "Olá! Para calcularmos seus impostos de ${monthName}/${year}, precisamos dos documentos acima até [data]. Envie pelo sistema."
}

Retorne APENAS o JSON, sem explicações.`
  }

  private fallbackRequest(config: any, monthName: string, deadline: string): DocumentRequestOutput {
    const documents: DocumentRequest[] = []

    // NFe Emitidas - SEMPRE
    documents.push({
      type: 'NFe_EMITIDAS',
      name: 'Notas Fiscais Emitidas',
      description: `Todas as Notas Fiscais que você EMITIU em ${monthName}`,
      format: 'XML das NFe',
      mandatory: true
    })

    // NFe Recebidas - SEMPRE
    documents.push({
      type: 'NFe_RECEBIDAS',
      name: 'Notas Fiscais Recebidas',
      description: `Notas Fiscais de COMPRAS (fornecedores) de ${monthName}`,
      format: 'PDF ou XML',
      mandatory: true
    })

    // Folha de Pagamento - SE tem funcionários OU tem pró-labore OU Anexo III/V
    const needsFolha = config.hasEmployees || config.hasProlabore ||
                       config.anexoSimples === 'III' || config.anexoSimples === 'V'
    if (needsFolha) {
      documents.push({
        type: 'FOLHA_PAGAMENTO',
        name: 'Folha de Pagamento',
        description: `Folha de pagamento completa de ${monthName} (holerites + GPS + FGTS)`,
        format: 'PDF',
        mandatory: true,
        reason: config.anexoSimples === 'III' || config.anexoSimples === 'V'
          ? 'Necessário para cálculo do Fator R'
          : config.hasProlabore
            ? 'Necessário para apuração de pró-labore e encargos'
            : 'Necessário para apuração de encargos'
      })
    }

    // Extratos Bancários - Opcional
    documents.push({
      type: 'EXTRATOS_BANCARIOS',
      name: 'Extratos Bancários',
      description: `Extrato bancário completo da empresa em ${monthName}`,
      format: 'PDF',
      mandatory: false
    })

    return {
      documents_needed: documents,
      deadline,
      message_to_client: `Olá! Para calcularmos seus impostos de ${monthName}, precisamos dos documentos acima até ${deadline}. Envie pelo sistema ou por email.`
    }
  }
}

// Helper functions
function getMonthName(month: number): string {
  const months = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ]
  return months[month - 1]
}

function calculateDeadline(month: number, year: number): string {
  // Prazo: dia 10 do mês seguinte
  const nextMonth = month === 12 ? 1 : month + 1
  const nextYear = month === 12 ? year + 1 : year
  return `${nextYear}-${String(nextMonth).padStart(2, '0')}-10`
}
