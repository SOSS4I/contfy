import { Request, Response } from 'express'
import { prisma } from '../utils/prisma'
import { FiscalContextAgent } from '../services/agents/fiscal-context.agent'
import { AILegalResearchAgent } from '../services/agents/ai-legal-research.agent'
import { FiscalClassificationAgent } from '../services/agents/fiscal-classification.agent'

/**
 * Iniciar nova sessão de onboarding
 */
export async function startOnboarding(req: Request, res: Response) {
  try {
    const { client_id } = req.body

    if (!client_id) {
      return res.status(400).json({ error: 'client_id é obrigatório' })
    }

    // Verificar se cliente existe
    const client = await prisma.client.findUnique({
      where: { id: parseInt(client_id) }
    })

    if (!client) {
      return res.status(404).json({ error: 'Cliente não encontrado' })
    }

    // Verificar se já tem sessão completa
    const completedSession = await prisma.onboardingSession.findFirst({
      where: {
        clientId: parseInt(client_id),
        status: 'COMPLETED'
      }
    })

    if (completedSession) {
      return res.json({
        message: 'Onboarding já foi concluído',
        data: completedSession,
        already_completed: true
      })
    }

    // Verificar se já tem sessão ativa (em andamento ou analisando)
    const existingSession = await prisma.onboardingSession.findFirst({
      where: {
        clientId: parseInt(client_id),
        status: { in: ['IN_PROGRESS', 'ANALYZING'] }
      }
    })

    if (existingSession) {
      return res.json({
        message: 'Sessão já existe',
        data: existingSession
      })
    }

    // Se tem sessão com erro, buscar e reutilizar (permitir recomeçar)
    const errorSession = await prisma.onboardingSession.findFirst({
      where: {
        clientId: parseInt(client_id),
        status: 'ERROR'
      }
    })

    if (errorSession) {
      // Resetar para IN_PROGRESS para permitir nova tentativa
      const resetSession = await prisma.onboardingSession.update({
        where: { id: errorSession.id },
        data: { status: 'IN_PROGRESS', currentStep: 1 }
      })
      return res.json({
        message: 'Sessão reiniciada após erro anterior',
        data: resetSession
      })
    }

    // Contar total de perguntas
    const totalQuestions = await prisma.onboardingQuestion.count()

    // Criar nova sessão
    const session = await prisma.onboardingSession.create({
      data: {
        clientId: parseInt(client_id),
        status: 'IN_PROGRESS',
        currentStep: 1,
        totalSteps: totalQuestions
      }
    })

    res.json({
      message: 'Sessão de onboarding iniciada',
      data: session
    })

  } catch (error: any) {
    console.error('Erro ao iniciar onboarding:', error)
    res.status(500).json({ error: 'Erro ao iniciar onboarding', details: error.message })
  }
}

/**
 * Buscar perguntas do questionário
 */
export async function getQuestions(req: Request, res: Response) {
  try {
    const questions = await prisma.onboardingQuestion.findMany({
      orderBy: { orderIndex: 'asc' }
    })

    res.json({ data: questions })

  } catch (error: any) {
    console.error('Erro ao buscar perguntas:', error)
    res.status(500).json({ error: 'Erro ao buscar perguntas', details: error.message })
  }
}

/**
 * Salvar resposta de uma pergunta
 */
export async function saveResponse(req: Request, res: Response) {
  try {
    const { session_id, question_id, response_value } = req.body

    if (!session_id || !question_id || response_value === undefined) {
      return res.status(400).json({ error: 'Campos obrigatórios faltando' })
    }

    // Verificar se sessão existe
    const session = await prisma.onboardingSession.findUnique({
      where: { id: parseInt(session_id) }
    })
    if (!session) {
      return res.status(404).json({ error: 'Sessão não encontrada' })
    }

    // Verificar se pergunta existe
    const question = await prisma.onboardingQuestion.findUnique({
      where: { id: parseInt(question_id) }
    })
    if (!question) {
      return res.status(400).json({ error: 'Pergunta não encontrada', question_id })
    }

    // Verificar se resposta já existe
    const existing = await prisma.onboardingResponse.findFirst({
      where: {
        sessionId: parseInt(session_id),
        questionId: parseInt(question_id)
      }
    })

    let response

    if (existing) {
      // Atualizar resposta existente
      response = await prisma.onboardingResponse.update({
        where: { id: existing.id },
        data: { responseValue: response_value }
      })
    } else {
      // Criar nova resposta
      response = await prisma.onboardingResponse.create({
        data: {
          sessionId: parseInt(session_id),
          questionId: parseInt(question_id),
          responseValue: response_value
        }
      })
    }

    // Atualizar step da sessão
    await prisma.onboardingSession.update({
      where: { id: parseInt(session_id) },
      data: {
        currentStep: parseInt(question_id) + 1
      }
    })

    res.json({
      message: 'Resposta salva',
      response
    })

  } catch (error: any) {
    console.error('Erro ao salvar resposta:', error)
    res.status(500).json({ error: 'Erro ao salvar resposta', details: error.message })
  }
}

/**
 * Finalizar questionário e executar agentes de IA
 */
export async function completeOnboarding(req: Request, res: Response) {
  try {
    const { session_id } = req.body

    if (!session_id) {
      return res.status(400).json({ error: 'session_id é obrigatório' })
    }

    // Buscar sessão com respostas
    const session = await prisma.onboardingSession.findUnique({
      where: { id: parseInt(session_id) },
      include: {
        responses: {
          include: {
            question: true
          }
        },
        client: true
      }
    })

    if (!session) {
      return res.status(404).json({ error: 'Sessão não encontrada' })
    }

    // Atualizar status para ANALYZING
    await prisma.onboardingSession.update({
      where: { id: parseInt(session_id) },
      data: { status: 'ANALYZING' }
    })

    // Converter respostas para formato utilizável
    const responsesMap: Record<string, any> = {}
    session.responses.forEach(r => {
      responsesMap[r.question.questionKey] = r.responseValue
    })

    console.log('📋 Respostas coletadas:', JSON.stringify(responsesMap, null, 2))

    // EXECUTAR AGENTE 1: Fiscal Context Agent (extrair contexto)
    console.log('📋 Executando Agente de Contexto Fiscal...')
    const contextAgent = new FiscalContextAgent()
    const fiscalContext = contextAgent.extract(responsesMap)

    // EXECUTAR AGENTE 2: AI Legal Research Agent (pesquisa com IA)
    console.log('🔍 Executando Agente de Pesquisa Legal com IA...')
    const aiLegalAgent = new AILegalResearchAgent()
    const legalResearch = await aiLegalAgent.research(fiscalContext)

    // Salvar resultado da pesquisa legal
    await prisma.legalResearchResult.create({
      data: {
        clientId: session.clientId,
        sessionId: session.id,
        applicableLaws: legalResearch.applicable_laws as any,
        taxRecommendations: legalResearch.tax_recommendations as any,
        researchLog: legalResearch.research_log,
        confidenceScore: legalResearch.confidence_score
      }
    })

    // EXECUTAR AGENTE 3: Fiscal Classification Agent
    console.log('📊 Executando Agente de Classificação Fiscal...')
    const fiscalAgent = new FiscalClassificationAgent()
    const classification = await fiscalAgent.classify(fiscalContext, legalResearch)

    // Salvar classificação fiscal (upsert - atualiza se existir, cria se não)
    await prisma.fiscalClassification.upsert({
      where: {
        clientId: session.clientId
      },
      update: {
        sessionId: session.id,
        classificationData: classification.classification_data,
        customConfig: classification.custom_config,
        updatedAt: new Date()
      },
      create: {
        clientId: session.clientId,
        sessionId: session.id,
        classificationData: classification.classification_data,
        customConfig: classification.custom_config
      }
    })

    // CRIAR NOTIFICAÇÃO PARA ADMIN DASHBOARD
    const regime = legalResearch.tax_recommendations.regime
    const confidenceScore = legalResearch.confidence_score || 0

    // Determinar tipo de notificação baseado no regime e confiança
    let notificationType: 'READY_TO_REVIEW' | 'NEEDS_ANALYSIS'
    let title: string
    let message: string
    let severity: 'INFO' | 'URGENT'

    if (regime === 'CONSULTAR_CONTADOR') {
      // 🔴 RED ALERT: Caso complexo que precisa análise detalhada
      notificationType = 'NEEDS_ANALYSIS'
      title = '🔴 Novo cliente precisa de análise detalhada'
      message = `Cliente "${session.client.name}" completou onboarding mas o caso é COMPLEXO e precisa de análise manual de contador.`
      severity = 'URGENT'
    } else {
      // 🟢 GREEN ALERT: Caso simples, só precisa revisar e aprovar
      notificationType = 'READY_TO_REVIEW'
      title = '🟢 Novo cliente pronto para revisão'
      message = `Cliente "${session.client.name}" completou onboarding. Regime sugerido: ${regime}. Apenas revise e aprove.`
      severity = 'INFO'
    }

    // Inserir notificação no banco (usando Prisma seguro)
    await prisma.admin_notifications.create({
      data: {
        client_id: session.clientId,
        session_id: session.id,
        type: notificationType,
        title: title,
        message: message,
        severity: severity,
        regime: regime,
        confidence_score: confidenceScore,
      }
    })

    console.log(`📬 Notificação criada: ${notificationType} - ${title}`)

    // Marcar sessão como completa
    await prisma.onboardingSession.update({
      where: { id: parseInt(session_id) },
      data: {
        status: 'COMPLETED',
        completedAt: new Date()
      }
    })

    res.json({
      message: 'Onboarding concluído com sucesso!',
      fiscal_context: fiscalContext,
      legal_research: legalResearch,
      classification: classification
    })

  } catch (error: any) {
    console.error('❌ Erro ao completar onboarding:', error)

    // Marcar sessão como ERROR
    if (req.body.session_id) {
      await prisma.onboardingSession.update({
        where: { id: parseInt(req.body.session_id) },
        data: { status: 'ERROR' }
      })
    }

    res.status(500).json({ error: 'Erro ao processar onboarding', details: error.message })
  }
}

/**
 * Buscar status do onboarding de um cliente
 */
export async function getOnboardingStatus(req: Request, res: Response) {
  try {
    const { client_id } = req.params

    const session = await prisma.onboardingSession.findFirst({
      where: { clientId: parseInt(client_id) },
      orderBy: { createdAt: 'desc' },
      include: {
        responses: {
          include: {
            question: true
          }
        }
      }
    })

    if (!session) {
      return res.json({ has_onboarding: false })
    }

    // Buscar classificação fiscal se existir
    const classification = await prisma.fiscalClassification.findUnique({
      where: { clientId: parseInt(client_id) }
    })

    // Buscar pesquisa legal se existir
    const legalResearch = await prisma.legalResearchResult.findFirst({
      where: { sessionId: session.id }
    })

    res.json({
      has_onboarding: true,
      data: {
        session,
        classification,
        legal_research: legalResearch
      }
    })

  } catch (error: any) {
    console.error('Erro ao buscar status:', error)
    res.status(500).json({ error: 'Erro ao buscar status', details: error.message })
  }
}
