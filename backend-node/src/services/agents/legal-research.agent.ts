/**
 * AGENTE 2: Legal Research Agent
 * Responsabilidade: Pesquisar legislação aplicável e fazer recomendações fiscais
 *
 * NOTA: Esta implementação usa um banco de conhecimento baseado em regras.
 * Em produção, pode ser integrado com APIs de pesquisa jurídica ou LLMs.
 */

interface LegalResearchResult {
  applicable_laws: any[]
  tax_recommendations: any
  research_log: string
  confidence_score: number
}

export class LegalResearchAgent {
  private knowledgeBase = {
    // Cenário: LLC americana + PF brasileira
    foreign_llc_pf: {
      laws: [
        {
          law: 'IN RFB 1.520/2014',
          article: 'Art. 7º',
          summary: 'Lucros auferidos por controlada/coligada no exterior devem ser adicionados ao lucro líquido da PJ/PF brasileira',
          url: 'http://normas.receita.fazenda.gov.br/sijut2consulta/link.action?idAto=59863'
        },
        {
          law: 'Carnê-Leão',
          article: 'Instrução Normativa RFB 1.500/2014',
          summary: 'Rendimentos recebidos de fontes no exterior devem ser declarados em Carnê-Leão mensalmente',
          url: 'http://normas.receita.fazenda.gov.br/sijut2consulta/link.action?idAto=58004'
        },
        {
          law: 'DIRPF',
          article: 'Instrução Normativa RFB 2.065/2022',
          summary: 'Declaração anual obrigatória de rendimentos e bens no exterior',
          url: 'http://normas.receita.fazenda.gov.br/sijut2consulta/link.action?idAto=131248'
        }
      ],
      tax_regime: 'pessoa_fisica_carne_leao',
      aliquot: 'progressive_table_up_to_27_5_percent',
      monthly_obligation: true,
      annual_obligation: true
    },

    // Cenário: Dropshipping nacional (PJ)
    dropshipping_national: {
      laws: [
        {
          law: 'Lei Complementar 123/2006',
          article: 'Simples Nacional',
          summary: 'Regime tributário simplificado para micro e pequenas empresas',
          url: 'http://www.planalto.gov.br/ccivil_03/leis/lcp/lcp123.htm'
        },
        {
          law: 'Resolução CGSN 140/2018',
          article: 'Anexo I - Comércio',
          summary: 'Alíquotas para comércio no Simples Nacional (4% a 11,61%)',
          url: 'http://normas.receita.fazenda.gov.br/sijut2consulta/link.action?idAto=92278'
        }
      ],
      tax_regime: 'simples_nacional',
      aliquot: '4_to_11_61_percent',
      anexo: 'ANEXO_I'
    },

    // Cenário: Prestação de serviços
    services: {
      laws: [
        {
          law: 'Lei Complementar 116/2003',
          article: 'ISS - Imposto Sobre Serviços',
          summary: 'Regulamentação do ISS para prestadores de serviço',
          url: 'http://www.planalto.gov.br/ccivil_03/leis/lcp/lcp116.htm'
        },
        {
          law: 'Resolução CGSN 140/2018',
          article: 'Anexo III ou V - Serviços',
          summary: 'Alíquotas para serviços no Simples Nacional',
          url: 'http://normas.receita.fazenda.gov.br/sijut2consulta/link.action?idAto=92278'
        }
      ],
      tax_regime: 'simples_nacional',
      aliquot: '6_to_33_percent',
      anexo: 'ANEXO_III'
    }
  }

  async research(analysis: any): Promise<LegalResearchResult> {
    console.log('🔍 [Legal Research Agent] Iniciando pesquisa legal...')

    const log: string[] = []
    let applicable_laws: any[] = []
    let tax_recommendations: any = {}
    let confidence = 0.95

    log.push('[INÍCIO] Análise de cenário fiscal')
    log.push(`Tipo de pessoa: ${analysis.person_type}`)
    log.push(`Modelo de negócio: ${analysis.business_model}`)
    log.push(`País da empresa: ${analysis.company_country}`)
    log.push(`Recebe do exterior: ${analysis.receives_from_abroad}`)

    // CENÁRIO 1: LLC AMERICANA + PESSOA FÍSICA BRASILEIRA
    if (analysis.is_foreign_company && analysis.person_type === 'pf' && analysis.company_country === 'usa') {
      log.push('[CENÁRIO IDENTIFICADO] LLC Americana + Pessoa Física Brasileira')
      log.push('[PESQUISA] Consultando legislação sobre lucros no exterior...')

      const knowledge = this.knowledgeBase.foreign_llc_pf
      applicable_laws = knowledge.laws

      tax_recommendations = {
        regime: 'PESSOA_FISICA',
        sub_regime: 'CARNE_LEAO',
        reason: 'LLC americana não é PJ brasileira. Lucros distribuídos são tributados como rendimento de PF no Brasil',

        monthly_obligations: [
          {
            name: 'Carnê-Leão',
            deadline: 'Último dia útil do mês seguinte',
            base_calculation: 'Lucros/dividendos recebidos da LLC',
            aliquot: 'Tabela progressiva (0% a 27,5%)',
            deductions: ['Dependentes', 'INSS próprio (se houver)'],
            how_to_pay: 'Gerar DARF através do sistema Carnê-Leão da Receita Federal'
          }
        ],

        annual_obligations: [
          {
            name: 'DIRPF - Declaração de Imposto de Renda Pessoa Física',
            deadline: '30 de abril',
            required_info: [
              'Rendimentos recebidos da LLC (discriminados por mês)',
              'Bens e direitos no exterior (participação na LLC)',
              'Imposto pago nos EUA (se houver - para compensação)',
              'Despesas dedutíveis (saúde, educação, etc)'
            ]
          },
          {
            name: 'DCBE - Declaração de Capitais Brasileiros no Exterior',
            deadline: '5 de abril',
            trigger: 'Se participação na LLC > US$ 1.000.000',
            optional_below_limit: true
          }
        ],

        required_documents: [
          'Comprovante de recebimento da LLC (wire transfer, etc)',
          'Financial statements da LLC (Balance Sheet, Income Statement)',
          'Tax return da LLC nos EUA (Form 1120 ou 1065)',
          'Comprovante de pagamento de ads (se aplicável - cartão corporativo)'
        ],

        estimated_tax_rate: {
          min: '0%',
          max: '27.5%',
          depends_on: 'Valor total de rendimentos + outras fontes de renda no Brasil',
          example: 'Se receber R$ 10.000/mês da LLC = aprox. 7,5% a 15% de IR (Carnê-Leão)'
        },

        common_mistakes: [
          {
            mistake: 'Aplicar alíquota de 3% (Lucro Presumido)',
            why_wrong: 'Lucro Presumido é para PJ brasileira. LLC não é PJ no Brasil.',
            correct: 'Usar tabela progressiva do Carnê-Leão'
          },
          {
            mistake: 'Não declarar rendimentos da LLC',
            why_wrong: 'Evasão fiscal. Receita Federal tem acordo de troca de informações com EUA.',
            consequence: 'Multa de 150% a 225% + juros + possível processo criminal'
          },
          {
            mistake: 'Declarar apenas no IR anual (não fazer Carnê-Leão)',
            why_wrong: 'Carnê-Leão é obrigatório MENSALMENTE para rendimentos do exterior',
            consequence: 'Multa de 50% do imposto devido + juros'
          }
        ],

        professional_advice: 'A LLC americana é transparente para fins fiscais. Você (PF) deve tributar os lucros recebidos via Carnê-Leão mensalmente. A alíquota NÃO é 3% fixa.'
      }

      confidence = 0.98

    }
    // CENÁRIO 2: DROPSHIPPING NACIONAL (PJ)
    else if (analysis.business_model === 'dropshipping' && !analysis.is_foreign_company) {
      log.push('[CENÁRIO IDENTIFICADO] Dropshipping Nacional (PJ Brasileira)')

      const knowledge = this.knowledgeBase.dropshipping_national
      applicable_laws = knowledge.laws

      tax_recommendations = {
        regime: 'SIMPLES_NACIONAL',
        anexo: 'ANEXO_I',
        reason: 'Atividade de comércio (revenda de produtos)',

        estimated_tax_rate: {
          min: '4%',
          max: '11.61%',
          depends_on: 'Faturamento nos últimos 12 meses',
          faixas: [
            { ate: 'R$ 180.000', aliquota: '4%' },
            { ate: 'R$ 360.000', aliquota: '5.47% a 7.30%' },
            { ate: 'R$ 720.000', aliquota: '8.36% a 9.03%' },
            { ate: 'R$ 1.800.000', aliquota: '9.12% a 9.62%' },
            { ate: 'R$ 3.600.000', aliquota: '10.45% a 11.61%' },
            { ate: 'R$ 4.800.000', aliquota: '11.51% a 11.61%' }
          ]
        },

        monthly_obligations: [
          {
            name: 'DAS - Documento de Arrecadação do Simples Nacional',
            deadline: 'Dia 20 do mês seguinte',
            how_to: 'Gerar no Portal do Simples Nacional'
          }
        ],

        annual_obligations: [
          {
            name: 'DEFIS - Declaração de Informações Socioeconômicas e Fiscais',
            deadline: '31 de março'
          }
        ]
      }

      confidence = 0.95

    }
    // CENÁRIO 3: PRESTAÇÃO DE SERVIÇOS
    else if (analysis.business_model === 'services' || analysis.business_model === 'consulting' || analysis.business_model === 'freelancer') {
      log.push('[CENÁRIO IDENTIFICADO] Prestação de Serviços')

      const knowledge = this.knowledgeBase.services
      applicable_laws = knowledge.laws

      tax_recommendations = {
        regime: 'SIMPLES_NACIONAL',
        anexo: 'ANEXO_III',
        reason: 'Prestação de serviços',

        estimated_tax_rate: {
          min: '6%',
          max: '33%',
          depends_on: 'Faturamento e Fator R (folha de pagamento / receita bruta)',
          note: 'Se Fator R >= 28%, usa Anexo III (6% a 19,5%). Se Fator R < 28%, usa Anexo V (15,5% a 30,5%)'
        }
      }

      confidence = 0.92
    }
    // CENÁRIO PADRÃO
    else {
      log.push('[CENÁRIO] Padrão - Análise genérica')

      applicable_laws = [
        {
          law: 'Código Tributário Nacional',
          article: 'Lei 5.172/1966',
          summary: 'Normas gerais de direito tributário',
          url: 'http://www.planalto.gov.br/ccivil_03/leis/l5172compilado.htm'
        }
      ]

      tax_recommendations = {
        regime: 'CONSULTAR_CONTADOR',
        reason: 'Cenário específico requer análise detalhada por profissional habilitado'
      }

      confidence = 0.70
    }

    log.push('[CONCLUSÃO] Pesquisa legal concluída')
    log.push(`[CONFIANÇA] ${(confidence * 100).toFixed(0)}%`)

    console.log(`✅ [Legal Research Agent] Pesquisa concluída com confiança de ${(confidence * 100).toFixed(0)}%`)

    return {
      applicable_laws,
      tax_recommendations,
      research_log: log.join('\n'),
      confidence_score: confidence
    }
  }
}
