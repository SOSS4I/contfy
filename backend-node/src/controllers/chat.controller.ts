/**
 * Chat Controller
 * ===============
 *
 * Endpoint para chat com IA usando Claude API.
 * Stateless: o frontend envia o histórico de mensagens e o backend responde.
 */

import { Request, Response } from 'express'
import Anthropic from '@anthropic-ai/sdk'
import { prisma } from '../utils/prisma'

let anthropicClient: Anthropic | null = null

const apiKey = process.env.ANTHROPIC_API_KEY
if (apiKey) {
  anthropicClient = new Anthropic({ apiKey })
  console.log('✅ Chat Controller: Claude API configurada')
} else {
  console.warn('⚠️  Chat Controller: ANTHROPIC_API_KEY não configurada')
}

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

/**
 * POST /chat/mensagem
 * Envia uma mensagem para a IA e recebe resposta
 */
export const enviarMensagem = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user
    const { mensagem, historico, contexto } = req.body

    if (!mensagem || typeof mensagem !== 'string' || mensagem.trim().length === 0) {
      return res.status(400).json({ detail: 'Mensagem é obrigatória' })
    }

    if (mensagem.length > 2000) {
      return res.status(400).json({ detail: 'Mensagem muito longa (máximo 2000 caracteres)' })
    }

    // Buscar dados reais do cliente para contextualizar a IA
    let clientContext = ''

    if (user.role === 'cliente') {
      clientContext = await buildClientContext(user.id)
    } else if (user.role === 'contador') {
      clientContext = await buildContadorContext(user.id)
    }

    // Montar system prompt
    const systemPrompt = buildSystemPrompt(user.role, clientContext, contexto)

    // Montar histórico de mensagens
    const messages: ChatMessage[] = []

    if (Array.isArray(historico)) {
      for (const msg of historico.slice(-20)) { // Últimas 20 mensagens
        if (msg.role === 'user' || msg.role === 'assistant') {
          messages.push({ role: msg.role, content: String(msg.content).slice(0, 2000) })
        }
      }
    }

    messages.push({ role: 'user', content: mensagem })

    // Chamar Claude API
    if (!anthropicClient) {
      // Fallback sem API key
      return res.json({
        data: {
          resposta: getFallbackResponse(mensagem, user.role),
          modelo: 'fallback'
        }
      })
    }

    const response = await anthropicClient.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 1024,
      system: systemPrompt,
      messages,
    })

    const aiResponse = response.content[0]?.type === 'text'
      ? response.content[0].text
      : 'Desculpe, não consegui gerar uma resposta.'

    res.json({
      data: {
        resposta: aiResponse,
        modelo: 'claude-sonnet'
      }
    })

  } catch (error: any) {
    console.error('Erro no chat:', error)

    if (error?.status === 429) {
      return res.status(429).json({ detail: 'Muitas requisições. Aguarde um momento.' })
    }

    res.status(500).json({ detail: 'Erro ao processar mensagem' })
  }
}

/**
 * GET /chat/sugestoes
 * Retorna sugestões de perguntas baseadas no contexto do usuário
 */
export const getSugestoes = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user

    if (user.role === 'cliente') {
      // Verificar se tem ciclo ativo para sugestões contextuais
      const cycle = await prisma.$queryRaw<any[]>`
        SELECT status, reference_month, reference_year
        FROM monthly_accounting_cycles
        WHERE client_id = ${user.id}
        ORDER BY created_at DESC LIMIT 1
      `

      const sugestoes = [
        'Qual o valor do meu DAS deste mês?',
        'Quais documentos preciso enviar?',
        'Como funciona o Simples Nacional?',
        'Quando vence meu próximo imposto?',
      ]

      if (cycle.length > 0 && cycle[0].status === 'COMPLETED') {
        sugestoes.unshift('Resumo do meu último processamento contábil')
      }

      return res.json({ data: sugestoes })
    }

    // Contador
    res.json({
      data: [
        'Quais clientes têm pendências este mês?',
        'Explique as mudanças recentes no Simples Nacional',
        'Como calcular o Fator R para um cliente?',
        'Quais são os prazos de obrigações acessórias?',
      ]
    })
  } catch (error) {
    console.error('Erro ao buscar sugestões:', error)
    res.status(500).json({ detail: 'Erro ao buscar sugestões' })
  }
}

// =========================================
// HELPERS
// =========================================

async function buildClientContext(clientId: number): Promise<string> {
  try {
    // Todas as queries em paralelo
    const [clientRows, configRows, cycleRows] = await Promise.all([
      prisma.$queryRaw<any[]>`
        SELECT name, cnpj FROM clients WHERE id = ${clientId} LIMIT 1
      `,
      prisma.$queryRaw<any[]>`
        SELECT regime_tributario, anexo_simples, faturamento_mensal, has_employees,
               employee_count, contador_instructions, documents_needed
        FROM client_accounting_config
        WHERE client_id = ${clientId} AND status = 'APPROVED'
        LIMIT 1
      `,
      prisma.$queryRaw<any[]>`
        SELECT status, reference_month, reference_year, tax_calculation,
               documents_requested, das_value, das_due_date
        FROM monthly_accounting_cycles
        WHERE client_id = ${clientId}
        ORDER BY created_at DESC LIMIT 1
      `
    ])

    const parts: string[] = []

    // Dados do cliente
    if (clientRows.length > 0) {
      parts.push(`Cliente: ${clientRows[0].name} (CNPJ: ${clientRows[0].cnpj || 'N/A'})`)
    }

    // Config contábil
    if (configRows.length > 0) {
      const c = configRows[0]
      parts.push(`Regime tributário: ${c.regime_tributario || 'Simples Nacional'}`)
      if (c.anexo_simples) parts.push(`Anexo Simples: ${c.anexo_simples}`)
      if (c.faturamento_mensal) parts.push(`Faturamento mensal estimado: R$ ${Number(c.faturamento_mensal).toLocaleString('pt-BR')}`)
      if (c.has_employees) parts.push(`Possui ${c.employee_count || 'N/A'} funcionário(s)`)
      if (c.contador_instructions) parts.push(`Instrução do contador: ${c.contador_instructions}`)

      // Documentos que o contador configurou como necessários
      if (c.documents_needed) {
        try {
          const docs = typeof c.documents_needed === 'string' ? JSON.parse(c.documents_needed) : c.documents_needed
          if (Array.isArray(docs) && docs.length > 0) {
            const docList = docs.map((d: any) => `${d.name || d.type}${d.mandatory ? ' (obrigatório)' : ' (opcional)'}`).join(', ')
            parts.push(`Documentos configurados pelo contador: ${docList}`)
          }
        } catch {}
      }
    }

    // Ciclo atual
    if (cycleRows.length > 0) {
      const cy = cycleRows[0]
      const meses = ['', 'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
                     'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']
      parts.push(`\nCiclo atual: ${meses[cy.reference_month] || cy.reference_month}/${cy.reference_year} — Status: ${cy.status}`)

      // Documentos solicitados pela IA (Agent 1) neste ciclo
      if (cy.documents_requested) {
        try {
          const req = typeof cy.documents_requested === 'string' ? JSON.parse(cy.documents_requested) : cy.documents_requested
          const docsNeeded = req.documents_needed || req.documents || []
          if (Array.isArray(docsNeeded) && docsNeeded.length > 0) {
            const mandatory = docsNeeded.filter((d: any) => d.mandatory !== false)
            const optional = docsNeeded.filter((d: any) => d.mandatory === false)
            if (mandatory.length > 0) {
              parts.push(`Documentos OBRIGATÓRIOS solicitados: ${mandatory.map((d: any) => d.name || d.type).join(', ')}`)
            }
            if (optional.length > 0) {
              parts.push(`Documentos opcionais solicitados: ${optional.map((d: any) => d.name || d.type).join(', ')}`)
            }
            if (req.message) parts.push(`Mensagem do sistema: ${req.message}`)
          }
        } catch {}
      }

      // Resultado fiscal
      if (cy.tax_calculation) {
        try {
          const tax = typeof cy.tax_calculation === 'string' ? JSON.parse(cy.tax_calculation) : cy.tax_calculation
          if (tax.valor_a_pagar !== undefined) {
            parts.push(`Imposto calculado: R$ ${Number(tax.valor_a_pagar).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`)
          }
          if (tax.aliquota_efetiva !== undefined) {
            parts.push(`Alíquota efetiva: ${(Number(tax.aliquota_efetiva)).toFixed(2)}%`)
          }
          if (tax.receita_mes !== undefined) {
            parts.push(`Receita do mês: R$ ${Number(tax.receita_mes).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`)
          }
        } catch {}
      }

      // DAS
      if (cy.das_value) {
        const venc = cy.das_due_date ? new Date(cy.das_due_date).toLocaleDateString('pt-BR') : 'N/A'
        parts.push(`DAS: R$ ${Number(cy.das_value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} — Vencimento: ${venc}`)
      }
    }

    // Documentos já enviados neste ciclo
    if (cycleRows.length > 0) {
      const uploadedDocs = await prisma.$queryRaw<any[]>`
        SELECT document_type, file_name FROM client_monthly_documents
        WHERE cycle_id = (
          SELECT id FROM monthly_accounting_cycles
          WHERE client_id = ${clientId} ORDER BY created_at DESC LIMIT 1
        )
      `
      if (uploadedDocs.length > 0) {
        parts.push(`Documentos já enviados: ${uploadedDocs.map(d => d.document_type).join(', ')}`)
      }
    }

    return parts.join('\n')
  } catch (error) {
    console.error('Erro ao buscar contexto do cliente:', error)
    return ''
  }
}

async function buildContadorContext(contadorId: number): Promise<string> {
  try {
    // Todas em paralelo
    const [contadorRows, clientCount, pendingCount, activeCycles, recentCycles] = await Promise.all([
      prisma.$queryRaw<any[]>`
        SELECT name, email FROM contadores WHERE id = ${contadorId} LIMIT 1
      `,
      prisma.$queryRaw<any[]>`
        SELECT COUNT(*)::int as total FROM clients WHERE is_active = true
      `,
      prisma.$queryRaw<any[]>`
        SELECT COUNT(*)::int as total FROM admin_notifications WHERE status = 'PENDING'
      `,
      prisma.$queryRaw<any[]>`
        SELECT COUNT(*)::int as total FROM monthly_accounting_cycles
        WHERE status IN ('PENDING_DOCS', 'PROCESSING')
      `,
      prisma.$queryRaw<any[]>`
        SELECT c.name, mac.reference_month, mac.reference_year, mac.status
        FROM monthly_accounting_cycles mac
        JOIN clients c ON c.id = mac.client_id
        WHERE mac.status IN ('PENDING_DOCS', 'PROCESSING')
        ORDER BY mac.created_at DESC LIMIT 5
      `
    ])

    const parts: string[] = []

    if (contadorRows.length > 0) {
      parts.push(`Contador: ${contadorRows[0].name}`)
    }

    parts.push(`Clientes ativos: ${clientCount[0]?.total || 0}`)

    if (Number(pendingCount[0]?.total) > 0) {
      parts.push(`Aprovações pendentes: ${pendingCount[0].total}`)
    }

    if (Number(activeCycles[0]?.total) > 0) {
      parts.push(`Ciclos em andamento: ${activeCycles[0].total}`)
      if (recentCycles.length > 0) {
        const lista = recentCycles.map((r: any) => `${r.name} (${r.reference_month}/${r.reference_year}: ${r.status})`).join('; ')
        parts.push(`Clientes com ciclo ativo: ${lista}`)
      }
    }

    return parts.join('\n')
  } catch (error) {
    console.error('Erro ao buscar contexto do contador:', error)
    return ''
  }
}

function buildSystemPrompt(role: string, context: string, extraContext?: string): string {
  const base = `Você é o assistente de IA do sistema de contabilidade "Contabilidade AI".
Responda sempre em português brasileiro, de forma clara, profissional e objetiva.
Mantenha respostas concisas (máximo 3 parágrafos) a menos que o usuário peça detalhes.
Use formatação simples (sem markdown complexo).
Nunca invente dados financeiros - use APENAS os dados reais fornecidos no contexto.
Se não souber algo específico do cliente, diga que não tem essa informação disponível.`

  const roleContext = role === 'cliente'
    ? `\nVocê está conversando com um CLIENTE (empresário/MEI).
Ajude com dúvidas sobre impostos, documentos, prazos e obrigações fiscais.
Seja didático e explique termos técnicos de forma simples.`
    : `\nVocê está conversando com um CONTADOR profissional.
Use linguagem técnica contábil. Ajude com legislação, cálculos tributários,
obrigações acessórias e gestão de clientes.`

  let prompt = base + roleContext

  if (context) {
    prompt += `\n\nDados reais do sistema:\n${context}`
  }

  if (extraContext) {
    prompt += `\n\nContexto adicional: ${extraContext}`
  }

  return prompt
}

function getFallbackResponse(mensagem: string, role: string): string {
  const lower = mensagem.toLowerCase()

  if (lower.includes('das') || lower.includes('imposto')) {
    return 'Para verificar seus impostos e DAS, acesse a página "Meus Impostos" no menu lateral. Lá você encontra os valores calculados e guias para pagamento.'
  }

  if (lower.includes('documento')) {
    return 'Você pode enviar e gerenciar documentos pela página "Documentos" no menu lateral. Aceitamos PDF, imagens e XML de NF-e.'
  }

  if (lower.includes('prazo') || lower.includes('vencimento')) {
    return 'Os prazos de entrega de documentos e vencimento de impostos estão disponíveis na sua página principal. O DAS do Simples Nacional vence todo dia 20.'
  }

  return 'Entendi sua pergunta. No momento o assistente de IA está em modo básico. Para respostas mais completas, verifique se a chave da API está configurada ou entre em contato com o suporte.'
}
