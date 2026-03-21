import { Request, Response } from 'express'
import { prisma } from '../utils/prisma'
import { Prisma } from '@prisma/client'

/**
 * Salvar configuração contábil do cliente (após aprovação do contador)
 * POST /api/v1/clients/:clientId/accounting-config
 */
export const saveAccountingConfig = async (req: Request, res: Response) => {
  try {
    const { clientId } = req.params
    const {
      regime_tributario,
      anexo_simples,
      contador_instructions,
      approved_by,
      required_documents: custom_documents,
      atividade_principal: atividade_override,
      cnae_code: cnae_override,
      has_employees: has_employees_override,
      employee_count: employee_count_override
    } = req.body

    const cId = parseInt(clientId)
    if (isNaN(cId)) return res.status(400).json({ error: 'ID de cliente inválido' })

    // Validações
    if (!regime_tributario) {
      return res.status(400).json({ error: 'Regime tributário é obrigatório' })
    }

    if (regime_tributario === 'SIMPLES_NACIONAL' && !anexo_simples) {
      return res.status(400).json({ error: 'Anexo do Simples Nacional é obrigatório' })
    }

    // Buscar dados do cliente para preencher config
    const client = await prisma.$queryRaw<Array<any>>`
      SELECT c.*, os.id as session_id
      FROM clients c
      LEFT JOIN onboarding_sessions os ON os.client_id = c.id
      WHERE c.id = ${cId}
      LIMIT 1
    `

    if (!client || client.length === 0) {
      return res.status(404).json({ error: 'Cliente não encontrado' })
    }

    const clientData = client[0]

    // Buscar respostas do quiz para extrair informações
    let responsesObj: Record<string, any> = {}
    if (clientData.session_id) {
      const responses = await prisma.$queryRaw<Array<any>>`
        SELECT q.question_key, r.response_value
        FROM onboarding_responses r
        JOIN onboarding_questions q ON r.question_id = q.id
        WHERE r.session_id = ${clientData.session_id}
      `
      responses.forEach((r) => {
        responsesObj[r.question_key] = r.response_value
      })
    }

    // Extrair informações relevantes (request body tem prioridade sobre respostas do quiz)
    const has_employees = has_employees_override !== undefined
      ? (has_employees_override === true || has_employees_override === 'true')
      : (responsesObj.has_employees === 'true' || responsesObj.has_employees === true)
    const employee_count = employee_count_override !== undefined
      ? parseInt(String(employee_count_override))
      : parseInt(responsesObj.employee_count || '0')
    const has_prolabore = responsesObj.has_partners === 'true' || responsesObj.has_partners === true
    const atividade_principal = atividade_override || responsesObj.business_description || responsesObj.business_model || ''
    const cnae_code = cnae_override || responsesObj.cnae || clientData.cnae || ''

    // Definir documentos necessários baseado no regime (ou usar custom se fornecido)
    const required_documents = custom_documents || defineRequiredDocuments(regime_tributario, anexo_simples, has_employees)

    // Verificar se já existe config para este cliente
    const existingConfig = await prisma.$queryRaw<Array<any>>`
      SELECT id FROM client_accounting_config WHERE client_id = ${cId}
    `

    const reqDocsJson = JSON.stringify(required_documents)

    if (existingConfig && existingConfig.length > 0) {
      await prisma.$executeRaw`
        UPDATE client_accounting_config
        SET
          regime_tributario = ${regime_tributario},
          anexo_simples = ${anexo_simples || null},
          atividade_principal = ${atividade_principal},
          cnae_code = ${cnae_code},
          has_employees = ${has_employees},
          employee_count = ${employee_count},
          has_prolabore = ${has_prolabore},
          contador_instructions = ${contador_instructions || null},
          required_documents = ${Prisma.raw(`'${reqDocsJson.replace(/'/g, "''")}'::jsonb`)},
          status = 'APPROVED',
          approved_by = ${approved_by || null},
          approved_at = NOW(),
          updated_at = NOW()
        WHERE client_id = ${cId}
      `
    } else {
      await prisma.$executeRaw`
        INSERT INTO client_accounting_config (
          client_id, regime_tributario, anexo_simples,
          atividade_principal, cnae_code, has_employees,
          employee_count, has_prolabore, contador_instructions,
          required_documents, status, approved_by, approved_at
        ) VALUES (
          ${cId}, ${regime_tributario}, ${anexo_simples || null},
          ${atividade_principal}, ${cnae_code}, ${has_employees},
          ${employee_count}, ${has_prolabore}, ${contador_instructions || null},
          ${Prisma.raw(`'${reqDocsJson.replace(/'/g, "''")}'::jsonb`)},
          'APPROVED', ${approved_by || null}, NOW()
        )
      `
    }

    // CRITICAL: Marcar cliente como verificado/aprovado
    await prisma.$executeRaw`
      UPDATE clients SET is_verified = true, updated_at = NOW() WHERE id = ${cId}
    `

    res.json({
      message: 'Configuração salva com sucesso',
      config: {
        regime_tributario,
        anexo_simples,
        has_employees,
        employee_count,
        required_documents
      }
    })

  } catch (error: any) {
    console.error('❌ Erro ao salvar configuração:', error)
    res.status(500).json({ error: 'Erro ao salvar configuração', details: error.message })
  }
}

/**
 * Atualizar configuração contábil do cliente
 * PUT /api/v1/clients/:clientId/accounting-config
 */
export const updateAccountingConfig = async (req: Request, res: Response) => {
  try {
    const { clientId } = req.params
    const cId = parseInt(clientId)
    if (isNaN(cId)) return res.status(400).json({ error: 'ID de cliente inválido' })
    const {
      regime_tributario,
      anexo_simples,
      contador_instructions,
      required_documents
    } = req.body

    // Verificar se existe config
    const existing = await prisma.$queryRaw<Array<any>>`
      SELECT * FROM client_accounting_config WHERE client_id = ${cId}
    `

    if (!existing || existing.length === 0) {
      return res.status(404).json({ error: 'Configuração não encontrada. Use POST para criar.' })
    }

    const config = existing[0]

    const newRegime = regime_tributario || config.regime_tributario
    const newAnexo = regime_tributario === 'SIMPLES_NACIONAL' ? (anexo_simples || config.anexo_simples) : null
    const newInstructions = contador_instructions !== undefined ? contador_instructions : config.contador_instructions
    const newDocs = required_documents || config.required_documents

    // Recalcular has_employees se regime mudou
    const has_employees = config.has_employees
    if (regime_tributario && regime_tributario !== config.regime_tributario) {
      // Se mudou de regime, recalcular documentos necessários se não foram fornecidos custom
      if (!required_documents) {
        const autoDocuments = defineRequiredDocuments(newRegime, newAnexo, has_employees)
        const autoDocsJson = JSON.stringify(autoDocuments)
        await prisma.$executeRaw`
          UPDATE client_accounting_config
          SET
            regime_tributario = ${newRegime},
            anexo_simples = ${newAnexo},
            contador_instructions = ${newInstructions},
            required_documents = ${Prisma.raw(`'${autoDocsJson.replace(/'/g, "''")}'::jsonb`)},
            updated_at = NOW()
          WHERE client_id = ${cId}
        `
      }
    }

    if (!regime_tributario || regime_tributario === config.regime_tributario || required_documents) {
      const docsJson = JSON.stringify(newDocs)
      await prisma.$executeRaw`
        UPDATE client_accounting_config
        SET
          regime_tributario = ${newRegime},
          anexo_simples = ${newAnexo},
          contador_instructions = ${newInstructions},
          required_documents = ${Prisma.raw(`'${docsJson.replace(/'/g, "''")}'::jsonb`)},
          updated_at = NOW()
        WHERE client_id = ${cId}
      `
    }

    // Buscar config atualizada
    const updated = await prisma.$queryRaw<Array<any>>`
      SELECT * FROM client_accounting_config WHERE client_id = ${cId}
    `

    res.json({
      message: 'Configuração atualizada com sucesso',
      data: updated[0]
    })

  } catch (error: any) {
    console.error('❌ Erro ao atualizar configuração:', error)
    res.status(500).json({ error: 'Erro ao atualizar configuração', details: error.message })
  }
}

/**
 * Buscar configuração contábil do cliente
 * GET /api/v1/clients/:clientId/accounting-config
 */
export const getAccountingConfig = async (req: Request, res: Response) => {
  try {
    const { clientId } = req.params
    const cId = parseInt(clientId)
    if (isNaN(cId)) return res.status(400).json({ error: 'ID de cliente inválido' })

    const config = await prisma.$queryRaw<Array<any>>`
      SELECT * FROM client_accounting_config WHERE client_id = ${cId}
    `

    if (!config || config.length === 0) {
      return res.status(404).json({ error: 'Configuração não encontrada' })
    }

    res.json({ data: config[0] })

  } catch (error: any) {
    console.error('❌ Erro ao buscar configuração:', error)
    res.status(500).json({ error: 'Erro ao buscar configuração', details: error.message })
  }
}

/**
 * Define documentos necessários baseado no regime tributário
 */
function defineRequiredDocuments(regime: string, anexo: string | null, hasEmployees: boolean): any[] {
  const documents = [
    {
      type: 'NFe_EMITIDAS',
      name: 'Notas Fiscais Emitidas',
      description: 'Todas as Notas Fiscais que você EMITIU no mês',
      format: 'XML das NFe',
      mandatory: true
    },
    {
      type: 'NFe_RECEBIDAS',
      name: 'Notas Fiscais Recebidas',
      description: 'Notas Fiscais de COMPRAS (fornecedores) do mês',
      format: 'PDF ou XML',
      mandatory: true
    },
    {
      type: 'EXTRATOS_BANCARIOS',
      name: 'Extratos Bancários',
      description: 'Extrato bancário completo da empresa no mês',
      format: 'PDF',
      mandatory: false
    }
  ]

  // Se tem funcionários, pedir folha de pagamento
  if (hasEmployees) {
    documents.push({
      type: 'FOLHA_PAGAMENTO',
      name: 'Folha de Pagamento',
      description: 'Folha de pagamento completa do mês (salários + encargos)',
      format: 'PDF',
      mandatory: true
    })
  }

  // Se é Simples Nacional com Anexo III ou V (serviços), folha é obrigatória para Fator R
  if (regime === 'SIMPLES_NACIONAL' && (anexo === 'III' || anexo === 'V')) {
    // Adicionar se ainda não foi adicionado
    if (!documents.find(d => d.type === 'FOLHA_PAGAMENTO')) {
      documents.push({
        type: 'FOLHA_PAGAMENTO',
        name: 'Folha de Pagamento',
        description: 'Folha de pagamento completa (necessária para cálculo do Fator R)',
        format: 'PDF',
        mandatory: true
      })
    }
  }

  return documents
}
