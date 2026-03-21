/**
 * AGENTE 2: AI Legal Research Agent
 * Responsabilidade: Pesquisar legislação brasileira usando Claude Opus
 * Modelo: Claude Opus 4.5 (melhor para pesquisa detalhada)
 */

import Anthropic from '@anthropic-ai/sdk'

interface LegalResearchResult {
  applicable_laws: ApplicableLaw[]
  tax_recommendations: TaxRecommendations
  research_log: string
  confidence_score: number
}

interface ApplicableLaw {
  law: string
  article: string
  summary: string
  url?: string
}

interface TaxRecommendations {
  regime: string
  sub_regime?: string
  reason: string
  monthly_obligations?: MonthlyObligation[]
  annual_obligations?: AnnualObligation[]
  estimated_tax_rate?: any
  common_mistakes?: any[]
  professional_advice?: string
}

interface MonthlyObligation {
  name: string
  deadline: string
  base_calculation: string
  aliquot: string
  how_to_pay?: string
}

interface AnnualObligation {
  name: string
  deadline: string
  required_info?: string[]
}

export class AILegalResearchAgent {
  private client: Anthropic | null = null
  private hasApiKey: boolean = false

  constructor() {
    const apiKey = process.env.ANTHROPIC_API_KEY

    if (apiKey && apiKey.length > 10) {
      this.client = new Anthropic({ apiKey })
      this.hasApiKey = true
      console.log('✅ [AI Legal Research] API key configurada')
    } else {
      console.log('⚠️  [AI Legal Research] API key não configurada - usando fallback')
    }
  }

  async research(context: any): Promise<LegalResearchResult> {
    console.log('🔍 [AI Legal Research Agent] Iniciando pesquisa legal...')

    if (!this.hasApiKey) {
      return this.fallbackResearch(context)
    }

    try {
      const prompt = this.buildPrompt(context)

      const message = await this.client!.messages.create({
        model: 'claude-opus-4-5-20251101',
        max_tokens: 4096,
        temperature: 0.2, // Baixa temperatura para máxima precisão
        messages: [{
          role: 'user',
          content: prompt
        }]
      })

      const responseText = message.content[0].type === 'text' ? message.content[0].text : ''

      // Parse da resposta JSON
      const result = this.parseResponse(responseText)

      console.log(`✅ [AI Legal Research Agent] Pesquisa concluída (confiança: ${(result.confidence_score * 100).toFixed(0)}%)`)

      return result

    } catch (error) {
      console.error('❌ [AI Legal Research Agent] Erro na API:', error)
      return this.fallbackResearch(context)
    }
  }

  private buildPrompt(context: any): string {
    return `Você é um contador especialista em legislação tributária brasileira. Sua tarefa é analisar o caso de um cliente e fazer uma pesquisa EXTREMAMENTE DETALHADA na legislação para determinar o regime tributário correto.

**CONTEXTO DO CLIENTE:**

Tipo de pessoa: ${context.person_type.toUpperCase()}
${context.cnae ? `CNAE: ${context.cnae}` : ''}
Modelo de negócio: ${context.business_model}
Faturamento mensal estimado: R$ ${context.estimated_monthly_revenue_brl.toLocaleString('pt-BR')}

Empresa registrada em: ${context.company_country}
${context.is_foreign_company ? '⚠️ EMPRESA ESTRANGEIRA' : ''}

Fontes de receita: ${context.revenue_source}
Métodos de pagamento: ${context.payment_methods.join(', ')}

${context.has_partners ? `Tem ${context.partner_count} sócio(s)` : 'Trabalha sozinho'}
${context.has_employees ? `Tem ${context.employee_count} funcionário(s): ${context.employee_types.join(', ')}` : 'Sem funcionários'}

Emite notas fiscais brasileiras: ${context.issues_brazilian_invoices ? 'SIM' : 'NÃO'}
Recebe invoices internacionais: ${context.receives_international_invoices ? 'SIM' : 'NÃO'}
Paga impostos no exterior: ${context.pays_foreign_taxes ? `SIM (${context.foreign_tax_country})` : 'NÃO'}

Atividades físicas no Brasil: ${context.brazil_physical_activities.join(', ') || 'Nenhuma'}
Gastos no Brasil: ${context.brazil_expenses.join(', ') || 'Nenhum'}

Descrição do negócio:
"${context.business_description}"

Dúvidas do cliente:
"${context.tax_doubts}"

**SUA TAREFA:**

1. **PESQUISE** as leis brasileiras aplicáveis (Lei Complementar 123/2006, IN RFB, Código Tributário, etc)
2. **DETERMINE** o regime tributário mais adequado (Simples Nacional, Lucro Presumido, Lucro Real, Carnê-Leão PF, MEI, etc)
3. **LISTE** todas as obrigações mensais e anuais
4. **CALCULE** a alíquota aproximada de impostos
5. **IDENTIFIQUE** erros comuns que o cliente pode cometer
6. **AVALIE** se o caso é simples o suficiente para automação ou se precisa de análise humana de um contador

**IMPORTANTE:**
- Se for um caso SIMPLES e COMUM (MEI simples, PF autônomo, PJ Simples Nacional padrão), retorne regime específico
- Se for COMPLEXO ou INCOMUM (cripto, internacional complicado, alto faturamento), retorne "CONSULTAR_CONTADOR"
- Seja CONSERVADOR: na dúvida, peça análise de contador

**FORMATO DE RESPOSTA (JSON):**

\`\`\`json
{
  "applicable_laws": [
    {
      "law": "Nome da lei",
      "article": "Artigo específico",
      "summary": "Resumo do que diz",
      "url": "URL oficial (se conhecer)"
    }
  ],
  "tax_recommendations": {
    "regime": "SIMPLES_NACIONAL | LUCRO_PRESUMIDO | LUCRO_REAL | PESSOA_FISICA | MEI | CONSULTAR_CONTADOR",
    "sub_regime": "CARNE_LEAO | ANEXO_I | ANEXO_III | etc (se aplicável)",
    "reason": "Explicação clara do por que este regime",
    "monthly_obligations": [
      {
        "name": "Nome da obrigação",
        "deadline": "Prazo",
        "base_calculation": "Base de cálculo",
        "aliquot": "Alíquota",
        "how_to_pay": "Como pagar"
      }
    ],
    "annual_obligations": [
      {
        "name": "Nome da obrigação",
        "deadline": "Prazo",
        "required_info": ["Info 1", "Info 2"]
      }
    ],
    "estimated_tax_rate": {
      "min": "X%",
      "max": "Y%",
      "depends_on": "Do que depende"
    },
    "common_mistakes": [
      {
        "mistake": "Erro comum",
        "why_wrong": "Por que está errado",
        "correct": "Como fazer certo"
      }
    ],
    "professional_advice": "Conselho profissional resumido"
  },
  "confidence_score": 0.95
}
\`\`\`

Retorne APENAS o JSON, sem texto adicional.`
  }

  private parseResponse(responseText: string): LegalResearchResult {
    try {
      // Extrair JSON da resposta
      const jsonMatch = responseText.match(/```json\n([\s\S]*?)\n```/) || responseText.match(/\{[\s\S]*\}/)

      if (!jsonMatch) {
        throw new Error('JSON não encontrado na resposta')
      }

      const jsonText = jsonMatch[1] || jsonMatch[0]
      const parsed = JSON.parse(jsonText)

      return {
        applicable_laws: parsed.applicable_laws || [],
        tax_recommendations: parsed.tax_recommendations || {},
        research_log: 'Pesquisa realizada via Claude Opus 4.5',
        confidence_score: parsed.confidence_score || 0.85
      }

    } catch (error) {
      console.error('❌ Erro ao fazer parse da resposta:', error)
      throw error
    }
  }

  private fallbackResearch(context: any): LegalResearchResult {
    console.log('⚠️  [AI Legal Research] Usando fallback - retornando CONSULTAR_CONTADOR')

    return {
      applicable_laws: [{
        law: 'Código Tributário Nacional',
        article: 'Lei 5.172/1966',
        summary: 'Normas gerais de direito tributário',
        url: 'http://www.planalto.gov.br/ccivil_03/leis/l5172compilado.htm'
      }],
      tax_recommendations: {
        regime: 'CONSULTAR_CONTADOR',
        reason: 'API de IA não configurada. Análise manual necessária por contador habilitado.'
      },
      research_log: 'Fallback - API não configurada',
      confidence_score: 0.50
    }
  }
}
