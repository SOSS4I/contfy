/**
 * AGENTE 3: Fiscal Classification Agent
 * Responsabilidade: Definir classificação fiscal e criar configuração personalizada
 */

export class FiscalClassificationAgent {
  async classify(analysis: any, legalResearch: any): Promise<any> {
    console.log('📊 [Fiscal Classification Agent] Criando classificação fiscal...')

    const classification_data = {
      tax_regime: legalResearch.tax_recommendations.regime,
      sub_regime: legalResearch.tax_recommendations.sub_regime || null,
      anexo_simples: legalResearch.tax_recommendations.anexo || null,

      monthly_obligations: legalResearch.tax_recommendations.monthly_obligations || [],
      annual_obligations: legalResearch.tax_recommendations.annual_obligations || [],

      required_documents: legalResearch.tax_recommendations.required_documents || [],

      estimated_tax_rate: legalResearch.tax_recommendations.estimated_tax_rate,

      // Metadata
      business_profile: {
        model: analysis.business_model,
        is_foreign_company: analysis.is_foreign_company,
        company_country: analysis.company_country,
        receives_from_abroad: analysis.receives_from_abroad,
        has_brazil_operations: analysis.has_brazil_operations
      },

      applicable_laws_summary: legalResearch.applicable_laws.map((law: any) => ({
        law: law.law,
        article: law.article,
        summary: law.summary
      })),

      professional_advice: legalResearch.tax_recommendations.professional_advice || null,
      common_mistakes: legalResearch.tax_recommendations.common_mistakes || []
    }

    // Configuração personalizada para o sistema
    const custom_config = this.buildCustomConfig(analysis, legalResearch)

    console.log('✅ [Fiscal Classification Agent] Classificação criada')
    console.log(`📋 Regime: ${classification_data.tax_regime}`)

    return {
      classification_data,
      custom_config
    }
  }

  private buildCustomConfig(analysis: any, legalResearch: any): any {
    const config: any = {
      // Tipos de documentos que esse cliente deve enviar
      document_types_required: [],

      // Regras de classificação automática de documentos
      document_classification_rules: {},

      // Configuração de cálculo de impostos
      tax_calculation_config: {
        regime: legalResearch.tax_recommendations.regime,
        base: null,
        deductions_allowed: [],
        foreign_tax_credit: false,
        monthly_payment: false
      },

      // Alertas personalizados
      alerts: [],

      // Periodicidade de obrigações
      obligations_schedule: {}
    }

    // Configuração específica para LLC + PF
    if (analysis.is_foreign_company && analysis.person_type === 'pf') {
      config.document_types_required = [
        'comprovante_recebimento_llc',
        'financial_statements_llc',
        'tax_return_usa'
      ]

      if (analysis.brazil_activities.includes('ads')) {
        config.document_types_required.push('faturas_anuncios_cartao')
      }

      config.document_classification_rules = {
        'comprovante_recebimento_llc': 'RENDIMENTO_EXTERIOR',
        'financial_statements_llc': 'DOCUMENTO_COMPROBATORIO',
        'tax_return_usa': 'DOCUMENTO_FISCAL_EXTERIOR',
        'faturas_anuncios_cartao': 'DESPESA_OPERACIONAL_NAO_DEDUTIVEL'
      }

      config.tax_calculation_config = {
        regime: 'CARNE_LEAO',
        base: 'lucros_distribuidos',
        deductions_allowed: ['inss_proprio', 'dependentes'],
        foreign_tax_credit: true,
        monthly_payment: true
      }

      config.alerts = [
        {
          type: 'monthly_reminder',
          day: 25,
          message: 'Lembre-se de pagar o Carnê-Leão até dia 30'
        },
        {
          type: 'annual_reminder',
          month: 3,
          day: 15,
          message: 'Prepare documentação da LLC para DIRPF (prazo: 30 de abril)'
        }
      ]

      config.obligations_schedule = {
        monthly: [
          {
            name: 'Carnê-Leão',
            deadline_day: 'last_business_day',
            auto_calculate: true
          }
        ],
        annual: [
          {
            name: 'DIRPF',
            month: 4,
            deadline_day: 30
          }
        ]
      }
    }

    // Configuração para Simples Nacional
    if (legalResearch.tax_recommendations.regime === 'SIMPLES_NACIONAL') {
      config.document_types_required = [
        'nfe_entrada',
        'nfe_saida',
        'extrato_bancario',
        'folha_pagamento'
      ]

      config.tax_calculation_config = {
        regime: 'SIMPLES_NACIONAL',
        anexo: legalResearch.tax_recommendations.anexo,
        base: 'faturamento_bruto',
        monthly_payment: true
      }

      config.alerts = [
        {
          type: 'monthly_reminder',
          day: 15,
          message: 'Lembre-se de gerar e pagar o DAS até dia 20'
        }
      ]

      config.obligations_schedule = {
        monthly: [
          {
            name: 'DAS',
            deadline_day: 20,
            auto_calculate: true
          }
        ],
        annual: [
          {
            name: 'DEFIS',
            month: 3,
            deadline_day: 31
          }
        ]
      }
    }

    return config
  }
}
