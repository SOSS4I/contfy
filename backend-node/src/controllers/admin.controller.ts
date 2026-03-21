import { Request, Response } from 'express'
import { prisma } from '../utils/prisma'

/**
 * Listar notificações do admin
 * GET /api/v1/admin/notifications
 */
export const getNotifications = async (req: Request, res: Response) => {
  try {
    const { status, type, page = 1, per_page = 20 } = req.query

    const skip = (Number(page) - 1) * Number(per_page)
    const take = Number(per_page)

    // Construir filtros com parameterized queries
    const conditions: string[] = []
    const params: any[] = []
    let paramIdx = 1

    if (status) {
      conditions.push(`n.status = $${paramIdx}`)
      params.push(status)
      paramIdx++
    }
    if (type) {
      conditions.push(`n.type = $${paramIdx}`)
      params.push(type)
      paramIdx++
    }

    const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : ''
    // For count query without alias
    const whereClauseNoAlias = conditions.length > 0
      ? 'WHERE ' + conditions.map(c => c.replace('n.', '')).join(' AND ')
      : ''

    // Buscar notificações com informações do cliente
    const notifications = await prisma.$queryRawUnsafe(`
      SELECT
        n.*,
        c.name as client_name,
        c.email as client_email,
        c.cnpj,
        c.cpf,
        s.id as session_id,
        s.completed_at
      FROM admin_notifications n
      LEFT JOIN clients c ON n.client_id = c.id
      LEFT JOIN onboarding_sessions s ON n.session_id = s.id
      ${whereClause}
      ORDER BY n.created_at DESC
      LIMIT $${paramIdx} OFFSET $${paramIdx + 1}
    `, ...params, take, skip)

    // Contar total
    const countResult = await prisma.$queryRawUnsafe<Array<{ count: bigint }>>(
      `SELECT COUNT(*) as count FROM admin_notifications ${whereClauseNoAlias}`,
      ...params
    )
    const total = Number(countResult[0]?.count || 0)

    // Estatísticas
    const stats = await prisma.$queryRaw<Array<any>>`
      SELECT
        COUNT(*)::int as total,
        SUM(CASE WHEN status = 'PENDING' THEN 1 ELSE 0 END)::int as pending,
        SUM(CASE WHEN status = 'REVIEWED' OR status = 'APPROVED' THEN 1 ELSE 0 END)::int as reviewed,
        SUM(CASE WHEN type = 'READY_TO_REVIEW' THEN 1 ELSE 0 END)::int as ready_to_review,
        SUM(CASE WHEN type = 'NEEDS_ANALYSIS' THEN 1 ELSE 0 END)::int as needs_analysis
      FROM admin_notifications
    `

    res.json({
      data: notifications,
      pagination: {
        page: Number(page),
        per_page: Number(per_page),
        total,
        total_pages: Math.ceil(total / Number(per_page))
      },
      stats: stats[0] || {
        total: 0,
        pending: 0,
        reviewed: 0,
        ready_to_review: 0,
        needs_analysis: 0
      }
    })

  } catch (error: any) {
    console.error('❌ Erro ao buscar notificações:', error)
    res.status(500).json({ error: 'Erro ao buscar notificações', details: error.message })
  }
}

/**
 * Marcar notificação como revisada
 * POST /api/v1/admin/notifications/:id/review
 */
export const reviewNotification = async (req: Request, res: Response) => {
  try {
    const notifId = parseInt(req.params.id)
    const { status, contador_notes, contador_id } = req.body

    await prisma.$executeRaw`
      UPDATE admin_notifications
      SET
        status = ${status},
        contador_notes = ${contador_notes || null},
        reviewed_by = ${contador_id || null},
        reviewed_at = NOW()
      WHERE id = ${notifId}
    `

    res.json({ message: 'Notificação atualizada com sucesso' })

  } catch (error: any) {
    console.error('❌ Erro ao revisar notificação:', error)
    res.status(500).json({ error: 'Erro ao revisar notificação', details: error.message })
  }
}

/**
 * Obter detalhes completos de uma notificação
 * GET /api/v1/admin/notifications/:id
 */
export const getNotificationDetails = async (req: Request, res: Response) => {
  try {
    const notifId = parseInt(req.params.id)

    const notification = await prisma.$queryRaw`
      SELECT
        n.*,
        c.name as client_name,
        c.email as client_email,
        c.phone as client_phone,
        c.cnpj,
        c.cpf,
        c.address,
        s.id as session_id,
        s.completed_at,
        fc.classification_data,
        lr.applicable_laws,
        lr.tax_recommendations,
        lr.confidence_score as legal_confidence
      FROM admin_notifications n
      LEFT JOIN clients c ON n.client_id = c.id
      LEFT JOIN onboarding_sessions s ON n.session_id = s.id
      LEFT JOIN fiscal_classifications fc ON fc.client_id = c.id
      LEFT JOIN legal_research_results lr ON lr.session_id = s.id
      WHERE n.id = ${notifId}
      LIMIT 1
    `

    if (!notification || (notification as any[]).length === 0) {
      return res.status(404).json({ error: 'Notificação não encontrada' })
    }

    // Buscar respostas do questionário
    const responses = await prisma.$queryRaw`
      SELECT
        q.question_text,
        q.question_key,
        r.response_value
      FROM onboarding_responses r
      JOIN onboarding_questions q ON r.question_id = q.id
      WHERE r.session_id = (
        SELECT session_id FROM admin_notifications WHERE id = ${notifId}
      )
      ORDER BY q.order_index
    `

    res.json({
      data: {
        ...(notification as any[])[0],
        questionnaire_responses: responses
      }
    })

  } catch (error: any) {
    console.error('❌ Erro ao buscar detalhes da notificação:', error)
    res.status(500).json({ error: 'Erro ao buscar detalhes', details: error.message })
  }
}

/**
 * Contar notificações pendentes
 * GET /api/v1/admin/notifications/pending-count
 */
export const getPendingCount = async (req: Request, res: Response) => {
  try {
    const result = await prisma.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(*)::int as count FROM admin_notifications WHERE status = 'PENDING'
    `
    res.json({ count: Number(result[0]?.count || 0) })
  } catch (error: any) {
    console.error('❌ Erro ao contar notificações:', error)
    res.status(500).json({ error: 'Erro ao contar notificações' })
  }
}
