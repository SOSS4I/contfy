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

    const mensagemSanitizada = mensagem.trim().replace(/\0/g, '')

    if (mensagemSanitizada.length === 0) {
      return res.status(400).json({ detail: 'Mensagem é obrigatória' })
    }

    if (mensagemSanitizada.length > 2000) {
      return res.status(400).json({ detail: 'Mensagem muito longa (máximo 2000 caracteres)' })
    }

    // Buscar dados reais do sistema para contextualizar a IA
    let systemContext = ''
    if (user.role === 'cliente') {
      systemContext = await buildClientContext(user.id)
    } else if (user.role === 'contador') {
      systemContext = await buildContadorContext(user.id)
    }

    const systemPrompt = buildSystemPrompt(user.role, systemContext, contexto)

    // Montar histórico de mensagens (últimas 20)
    const messages: ChatMessage[] = []
    if (Array.isArray(historico)) {
      for (const msg of historico.slice(-20)) {
        if (msg.role === 'user' || msg.role === 'assistant') {
          messages.push({ role: msg.role, content: String(msg.content).slice(0, 2000) })
        }
      }
    }
    messages.push({ role: 'user', content: mensagemSanitizada })

    if (!anthropicClient) {
      return res.json({
        data: {
          resposta: getFallbackResponse(mensagem, user.role),
          modelo: 'fallback'
        }
      })
    }

    const response = await anthropicClient.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2048,
      system: systemPrompt,
      messages,
    })

    const aiResponse = response.content[0]?.type === 'text'
      ? response.content[0].text
      : 'Desculpe, não consegui gerar uma resposta.'

    res.json({
      data: {
        resposta: aiResponse,
        modelo: 'claude-sonnet-4-6'
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
 * Retorna sugestões de perguntas baseadas no contexto real do usuário
 */
export const getSugestoes = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user

    if (user.role === 'cliente') {
      const [cycleRows, dasRows] = await Promise.all([
        prisma.$queryRaw<any[]>`
          SELECT status, reference_month, reference_year, das_value, das_due_date
          FROM monthly_accounting_cycles
          WHERE client_id = ${user.id}
          ORDER BY created_at DESC LIMIT 1
        `,
        prisma.$queryRaw<any[]>`
          SELECT das_value, das_due_date, das_paid FROM monthly_accounting_cycles
          WHERE client_id = ${user.id} AND das_value IS NOT NULL
          ORDER BY created_at DESC LIMIT 1
        `
      ])

      const sugestoes: string[] = []

      if (dasRows.length > 0 && !dasRows[0].das_paid) {
        sugestoes.push('Qual o valor do meu DAS e quando vence?')
      }

      if (cycleRows.length > 0 && cycleRows[0].status === 'PENDING_DOCS') {
        sugestoes.push('Quais documentos preciso enviar este mês?')
      }

      if (cycleRows.length > 0 && cycleRows[0].status === 'COMPLETED') {
        sugestoes.push('Como foi meu resultado financeiro este mês?')
        sugestoes.push('Quanto paguei de imposto no último mês?')
      }

      sugestoes.push('Como funciona o Simples Nacional?')
      sugestoes.push('Quais são meus próximos vencimentos?')
      sugestoes.push('O que é o Fator R e como me afeta?')

      return res.json({ data: sugestoes.slice(0, 5) })
    }

    // Contador: sugestões baseadas em dados reais
    const [pendingApprovals, pendingDocs, completedToday] = await Promise.all([
      prisma.$queryRaw<any[]>`
        SELECT COUNT(*)::int as total FROM client_accounting_config WHERE status != 'APPROVED'
      `,
      prisma.$queryRaw<any[]>`
        SELECT COUNT(*)::int as total FROM monthly_accounting_cycles WHERE status = 'PENDING_DOCS'
      `,
      prisma.$queryRaw<any[]>`
        SELECT COUNT(*)::int as total FROM monthly_accounting_cycles
        WHERE status = 'COMPLETED' AND updated_at > NOW() - INTERVAL '24 hours'
      `
    ])

    const sugestoes: string[] = []

    if (Number(pendingDocs[0]?.total) > 0) {
      sugestoes.push(`Quais clientes estão aguardando envio de documentos?`)
    }
    if (Number(pendingApprovals[0]?.total) > 0) {
      sugestoes.push('Quais clientes precisam de aprovação de configuração?')
    }
    if (Number(completedToday[0]?.total) > 0) {
      sugestoes.push('Quais ciclos foram concluídos recentemente?')
    }

    sugestoes.push('Liste todos os clientes e seus status atuais')
    sugestoes.push('Como calcular o Fator R para um cliente?')
    sugestoes.push('Quais são os prazos de obrigações acessórias?')
    sugestoes.push('Explique as mudanças recentes no Simples Nacional')

    res.json({ data: sugestoes.slice(0, 5) })

  } catch (error) {
    console.error('Erro ao buscar sugestões:', error)
    res.status(500).json({ detail: 'Erro ao buscar sugestões' })
  }
}

// =========================================
// HELPERS — CONTEXTO DO CLIENTE
// =========================================

async function buildClientContext(clientId: number): Promise<string> {
  try {
    const [clientRows, configRows, cycleRows] = await Promise.all([
      prisma.$queryRaw<any[]>`
        SELECT name, cnpj, email FROM clients WHERE id = ${clientId} LIMIT 1
      `,
      prisma.$queryRaw<any[]>`
        SELECT regime_tributario, anexo_simples, faturamento_mensal,
               has_employees, employee_count, contador_instructions, documents_needed
        FROM client_accounting_config
        WHERE client_id = ${clientId} AND status = 'APPROVED'
        LIMIT 1
      `,
      prisma.$queryRaw<any[]>`
        SELECT id, status, reference_month, reference_year,
               tax_calculation, documents_requested,
               das_value, das_due_date, das_paid,
               accounting_entries, monthly_report_data
        FROM monthly_accounting_cycles
        WHERE client_id = ${clientId}
        ORDER BY created_at DESC LIMIT 1
      `
    ])

    const parts: string[] = []
    const meses = ['', 'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
                   'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']

    // Dados do cliente
    if (clientRows.length > 0) {
      const cl = clientRows[0]
      parts.push(`=== DADOS DA EMPRESA ===`)
      parts.push(`Nome: ${cl.name}`)
      if (cl.cnpj) parts.push(`CNPJ: ${cl.cnpj}`)
    }

    // Configuração contábil
    if (configRows.length > 0) {
      const c = configRows[0]
      parts.push(`\n=== CONFIGURAÇÃO CONTÁBIL ===`)
      parts.push(`Regime tributário: ${c.regime_tributario || 'Simples Nacional'}`)
      if (c.anexo_simples) parts.push(`Anexo Simples Nacional: Anexo ${c.anexo_simples}`)
      if (c.faturamento_mensal) {
        parts.push(`Faturamento mensal estimado: R$ ${Number(c.faturamento_mensal).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`)
      }
      if (c.has_employees) {
        parts.push(`Funcionários: ${c.employee_count || 'Sim'}`)
      } else {
        parts.push(`Funcionários: Não possui`)
      }
      if (c.contador_instructions) {
        parts.push(`Observações do contador: ${c.contador_instructions}`)
      }

      // Documentos configurados
      if (c.documents_needed) {
        try {
          const docs = typeof c.documents_needed === 'string' ? JSON.parse(c.documents_needed) : c.documents_needed
          if (Array.isArray(docs) && docs.length > 0) {
            const mandatory = docs.filter((d: any) => d.mandatory !== false).map((d: any) => d.name || d.type)
            const optional = docs.filter((d: any) => d.mandatory === false).map((d: any) => d.name || d.type)
            if (mandatory.length > 0) parts.push(`Documentos obrigatórios: ${mandatory.join(', ')}`)
            if (optional.length > 0) parts.push(`Documentos opcionais: ${optional.join(', ')}`)
          }
        } catch {}
      }
    } else {
      parts.push(`\n=== CONFIGURAÇÃO CONTÁBIL ===`)
      parts.push(`Status: Configuração pendente de aprovação do contador`)
    }

    // Ciclo atual
    if (cycleRows.length > 0) {
      const cy = cycleRows[0]
      parts.push(`\n=== CICLO ATUAL ===`)
      parts.push(`Período: ${meses[cy.reference_month] || cy.reference_month}/${cy.reference_year}`)

      const statusLabel: Record<string, string> = {
        PENDING_DOCS: 'Aguardando envio de documentos',
        PROCESSING: 'Em processamento pela IA',
        COMPLETED: 'Processamento concluído',
        ERROR: 'Erro no processamento'
      }
      parts.push(`Status: ${statusLabel[cy.status] || cy.status}`)

      // Documentos solicitados
      if (cy.documents_requested) {
        try {
          const req = typeof cy.documents_requested === 'string' ? JSON.parse(cy.documents_requested) : cy.documents_requested
          const docsNeeded = req.documents_needed || req.documents || []
          if (Array.isArray(docsNeeded) && docsNeeded.length > 0) {
            const mandatory = docsNeeded.filter((d: any) => d.mandatory !== false)
            const optional = docsNeeded.filter((d: any) => d.mandatory === false)
            if (mandatory.length > 0) {
              parts.push(`Documentos OBRIGATÓRIOS a enviar: ${mandatory.map((d: any) => d.name || d.type).join(', ')}`)
            }
            if (optional.length > 0) {
              parts.push(`Documentos opcionais a enviar: ${optional.map((d: any) => d.name || d.type).join(', ')}`)
            }
            if (req.message) parts.push(`Instruções do sistema: ${req.message}`)
          }
        } catch {}
      }

      // Imposto calculado
      if (cy.tax_calculation) {
        try {
          const tax = typeof cy.tax_calculation === 'string' ? JSON.parse(cy.tax_calculation) : cy.tax_calculation
          parts.push(`\n=== IMPOSTO DO MÊS ===`)
          if (tax.receita_mes !== undefined) {
            parts.push(`Receita bruta do mês: R$ ${Number(tax.receita_mes).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`)
          }
          if (tax.aliquota_efetiva !== undefined) {
            parts.push(`Alíquota efetiva: ${Number(tax.aliquota_efetiva).toFixed(2)}%`)
          }
          if (tax.valor_a_pagar !== undefined) {
            parts.push(`Imposto a pagar (DAS): R$ ${Number(tax.valor_a_pagar).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`)
          }
          if (tax.vencimento) {
            const venc = new Date(tax.vencimento + 'T00:00:00').toLocaleDateString('pt-BR')
            parts.push(`Vencimento: ${venc}`)
          }
          if (tax.fator_r !== undefined && tax.fator_r_aplicavel) {
            parts.push(`Fator R: ${(Number(tax.fator_r) * 100).toFixed(2)}%`)
          }
          if (tax.breakdown) {
            const bd = tax.breakdown
            const items = []
            if (bd.IRPJ) items.push(`IRPJ R$ ${Number(bd.IRPJ).toFixed(2)}`)
            if (bd.CSLL) items.push(`CSLL R$ ${Number(bd.CSLL).toFixed(2)}`)
            if (bd.COFINS) items.push(`COFINS R$ ${Number(bd.COFINS).toFixed(2)}`)
            if (bd.PIS) items.push(`PIS R$ ${Number(bd.PIS).toFixed(2)}`)
            if (bd.CPP) items.push(`CPP R$ ${Number(bd.CPP).toFixed(2)}`)
            if (bd.ICMS) items.push(`ICMS R$ ${Number(bd.ICMS).toFixed(2)}`)
            if (bd.ISS) items.push(`ISS R$ ${Number(bd.ISS).toFixed(2)}`)
            if (items.length > 0) parts.push(`Composição do imposto: ${items.join(', ')}`)
          }
        } catch {}
      }

      // DAS
      if (cy.das_value) {
        const venc = cy.das_due_date ? new Date(cy.das_due_date).toLocaleDateString('pt-BR') : 'N/A'
        const pago = cy.das_paid ? '✅ PAGO' : '⏳ PENDENTE'
        parts.push(`DAS: R$ ${Number(cy.das_value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} — Vencimento: ${venc} — ${pago}`)
      }

      // Relatório gerencial
      if (cy.monthly_report_data) {
        try {
          const report = typeof cy.monthly_report_data === 'string' ? JSON.parse(cy.monthly_report_data) : cy.monthly_report_data
          parts.push(`\n=== RESULTADO FINANCEIRO ===`)
          if (report.receita_bruta !== undefined) {
            parts.push(`Receita bruta: R$ ${Number(report.receita_bruta).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`)
          }
          if (report.despesas_operacionais !== undefined && report.despesas_operacionais > 0) {
            parts.push(`Despesas operacionais: R$ ${Number(report.despesas_operacionais).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`)
          }
          if (report.lucro_liquido !== undefined) {
            parts.push(`Lucro líquido: R$ ${Number(report.lucro_liquido).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`)
          }
          if (report.margem_lucro !== undefined) {
            parts.push(`Margem de lucro: ${Number(report.margem_lucro).toFixed(2)}%`)
          }
          if (report.insights && Array.isArray(report.insights) && report.insights.length > 0) {
            parts.push(`Insights do período: ${report.insights.join('; ')}`)
          }
        } catch {}
      }

      // Documentos enviados neste ciclo
      const uploadedDocs = await prisma.$queryRaw<any[]>`
        SELECT document_type, file_name FROM client_monthly_documents
        WHERE cycle_id = ${cy.id}
        ORDER BY uploaded_at DESC LIMIT 20
      `
      if (uploadedDocs.length > 0) {
        parts.push(`\nDocumentos já enviados neste ciclo: ${uploadedDocs.map(d => d.document_type).join(', ')}`)
      } else if (cy.status === 'PENDING_DOCS') {
        parts.push(`\nDocumentos enviados: Nenhum até o momento`)
      }
    } else {
      parts.push(`\n=== CICLO ATUAL ===`)
      parts.push(`Nenhum ciclo de processamento iniciado ainda`)
    }

    // Histórico resumido (últimos 3 meses)
    const historicoCiclos = await prisma.$queryRaw<any[]>`
      SELECT reference_month, reference_year, status, das_value, das_paid
      FROM monthly_accounting_cycles
      WHERE client_id = ${clientId}
      ORDER BY created_at DESC LIMIT 4
      OFFSET 1
    `
    if (historicoCiclos.length > 0) {
      parts.push(`\n=== HISTÓRICO RECENTE ===`)
      for (const h of historicoCiclos) {
        const dasInfo = h.das_value ? ` — DAS R$ ${Number(h.das_value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} ${h.das_paid ? '(pago)' : '(pendente)'}` : ''
        parts.push(`${meses[h.reference_month]}/${h.reference_year}: ${h.status}${dasInfo}`)
      }
    }

    return parts.join('\n')
  } catch (error) {
    console.error('Erro ao buscar contexto do cliente:', error)
    return ''
  }
}

// =========================================
// HELPERS — CONTEXTO DO CONTADOR
// =========================================

async function buildContadorContext(contadorId: number): Promise<string> {
  try {
    const [contadorRows, allClients, pendingApprovals, cycles] = await Promise.all([
      prisma.$queryRaw<any[]>`
        SELECT name, email FROM contadores WHERE id = ${contadorId} LIMIT 1
      `,
      // Todos os clientes ativos com suas configurações
      prisma.$queryRaw<any[]>`
        SELECT c.id, c.name, c.cnpj,
               cac.regime_tributario, cac.anexo_simples, cac.faturamento_mensal,
               cac.has_employees, cac.status as config_status
        FROM clients c
        LEFT JOIN client_accounting_config cac ON cac.client_id = c.id
        WHERE c.is_active = true
        ORDER BY c.name ASC
      `,
      // Configs pendentes de aprovação
      prisma.$queryRaw<any[]>`
        SELECT c.name, cac.regime_tributario
        FROM client_accounting_config cac
        JOIN clients c ON c.id = cac.client_id
        WHERE cac.status != 'APPROVED'
        ORDER BY c.name ASC
      `,
      // Ciclos ativos e recentes de todos os clientes
      prisma.$queryRaw<any[]>`
        SELECT mac.id, mac.client_id, mac.reference_month, mac.reference_year,
               mac.status, mac.das_value, mac.das_due_date, mac.das_paid,
               mac.tax_calculation, mac.monthly_report_data,
               c.name as client_name
        FROM monthly_accounting_cycles mac
        JOIN clients c ON c.id = mac.client_id
        ORDER BY mac.reference_year DESC, mac.reference_month DESC, mac.created_at DESC
      `
    ])

    const parts: string[] = []
    const meses = ['', 'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
                   'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']

    // Identificação do contador
    if (contadorRows.length > 0) {
      parts.push(`=== CONTADOR ===`)
      parts.push(`Nome: ${contadorRows[0].name}`)
      parts.push(`Email: ${contadorRows[0].email}`)
    }

    // Resumo geral
    parts.push(`\n=== RESUMO GERAL ===`)
    parts.push(`Total de clientes ativos: ${allClients.length}`)

    const approvedClients = allClients.filter(c => c.config_status === 'APPROVED')
    const pendingConfig = allClients.filter(c => c.config_status !== 'APPROVED')
    parts.push(`Clientes com configuração aprovada: ${approvedClients.length}`)
    if (pendingConfig.length > 0) {
      parts.push(`Clientes aguardando aprovação de configuração: ${pendingConfig.length}`)
    }

    // Ciclos agrupados por status
    const cyclesByStatus: Record<string, any[]> = {}
    for (const cy of cycles) {
      if (!cyclesByStatus[cy.status]) cyclesByStatus[cy.status] = []
      // Manter apenas o ciclo mais recente por cliente
      const existing = cyclesByStatus[cy.status].find(c => c.client_id === cy.client_id)
      if (!existing) cyclesByStatus[cy.status].push(cy)
    }

    if (cyclesByStatus['PENDING_DOCS']?.length > 0) {
      parts.push(`\nCiclos aguardando documentos: ${cyclesByStatus['PENDING_DOCS'].length}`)
    }
    if (cyclesByStatus['PROCESSING']?.length > 0) {
      parts.push(`Ciclos em processamento: ${cyclesByStatus['PROCESSING'].length}`)
    }
    if (cyclesByStatus['COMPLETED']?.length > 0) {
      parts.push(`Ciclos concluídos: ${cyclesByStatus['COMPLETED'].length}`)
    }

    // Todos os clientes com detalhes
    parts.push(`\n=== CLIENTES (DETALHES) ===`)
    for (const client of allClients) {
      const clientCycles = cycles.filter(cy => cy.client_id === client.id)
      const latestCycle = clientCycles[0]

      let linha = `\n• ${client.name}`
      if (client.cnpj) linha += ` (CNPJ: ${client.cnpj})`

      if (client.config_status === 'APPROVED') {
        if (client.regime_tributario) linha += ` — ${client.regime_tributario}`
        if (client.anexo_simples) linha += ` Anexo ${client.anexo_simples}`
        if (client.faturamento_mensal) {
          linha += ` — Fat. R$ ${Number(client.faturamento_mensal).toLocaleString('pt-BR')}/mês`
        }
      } else {
        linha += ` — ⚠️ Configuração pendente de aprovação`
      }

      if (latestCycle) {
        const statusLabel: Record<string, string> = {
          PENDING_DOCS: '⏳ Aguardando documentos',
          PROCESSING: '🔄 Em processamento',
          COMPLETED: '✅ Concluído',
          ERROR: '❌ Erro'
        }
        linha += `\n  Ciclo ${meses[latestCycle.reference_month]}/${latestCycle.reference_year}: ${statusLabel[latestCycle.status] || latestCycle.status}`

        if (latestCycle.das_value) {
          const venc = latestCycle.das_due_date ? new Date(latestCycle.das_due_date).toLocaleDateString('pt-BR') : 'N/A'
          const pago = latestCycle.das_paid ? 'PAGO' : 'PENDENTE'
          linha += ` — DAS R$ ${Number(latestCycle.das_value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} (${pago}, venc. ${venc})`
        }

        if (latestCycle.tax_calculation) {
          try {
            const tax = typeof latestCycle.tax_calculation === 'string'
              ? JSON.parse(latestCycle.tax_calculation)
              : latestCycle.tax_calculation
            if (tax.receita_mes) {
              linha += `\n  Receita: R$ ${Number(tax.receita_mes).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
            }
            if (tax.aliquota_efetiva !== undefined) {
              linha += ` — Alíquota: ${Number(tax.aliquota_efetiva).toFixed(2)}%`
            }
          } catch {}
        }

        if (latestCycle.monthly_report_data) {
          try {
            const report = typeof latestCycle.monthly_report_data === 'string'
              ? JSON.parse(latestCycle.monthly_report_data)
              : latestCycle.monthly_report_data
            if (report.lucro_liquido !== undefined) {
              linha += ` — Lucro: R$ ${Number(report.lucro_liquido).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
            }
            if (report.margem_lucro !== undefined) {
              linha += ` (margem ${Number(report.margem_lucro).toFixed(1)}%)`
            }
          } catch {}
        }
      } else {
        linha += `\n  Ciclo: Nenhum iniciado`
      }

      parts.push(linha)
    }

    // Clientes aguardando aprovação de config
    if (pendingApprovals.length > 0) {
      parts.push(`\n=== APROVAÇÕES PENDENTES ===`)
      for (const p of pendingApprovals) {
        parts.push(`• ${p.name} — ${p.regime_tributario || 'Regime não definido'}`)
      }
    }

    return parts.join('\n')
  } catch (error) {
    console.error('Erro ao buscar contexto do contador:', error)
    return ''
  }
}

// =========================================
// HELPERS — SYSTEM PROMPT
// =========================================

function buildSystemPrompt(role: string, context: string, extraContext?: string): string {
  const today = new Date().toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })

  if (role === 'cliente') {
    let prompt = `Você é o assistente de IA do sistema "Contfy" — plataforma de contabilidade inteligente.
Data de hoje: ${today}

Você está conversando com um CLIENTE (empresário/MEI/ME).
Seu papel é ajudá-lo a entender sua situação fiscal e financeira usando os dados reais do sistema.

REGRAS IMPORTANTES:
- Responda SEMPRE em português brasileiro, de forma clara e acessível
- Use os dados reais fornecidos abaixo — NUNCA invente valores ou datas
- Quando informar valores de imposto, DAS ou receita, use os dados exatos do sistema
- Explique termos técnicos de forma simples (o cliente pode não ser contador)
- Seja objetivo: máximo 3-4 parágrafos, a menos que o cliente peça mais detalhes
- Se não tiver uma informação específica, diga claramente que não está disponível no sistema
- Para perguntas sobre legislação geral, você pode responder com seu conhecimento
- Use formatação simples: evite markdown complexo, prefira texto corrido`

    if (context) {
      prompt += `\n\n=== DADOS REAIS DO SISTEMA ===\n${context}`
    }
    if (extraContext) {
      prompt += `\n\nContexto adicional: ${extraContext}`
    }
    return prompt
  }

  // Contador
  let prompt = `Você é o assistente de IA do sistema "Contfy" — plataforma de contabilidade inteligente.
Data de hoje: ${today}

Você está conversando com o CONTADOR responsável pelo sistema.
Você tem acesso completo aos dados de todos os clientes listados abaixo.

SUAS CAPACIDADES:
- Informar status de qualquer cliente (ciclo, DAS, documentos pendentes, receita, margem)
- Responder perguntas sobre legislação tributária (Simples Nacional, Lucro Presumido, etc.)
- Calcular ou explicar Fator R, alíquotas efetivas, obrigações acessórias
- Identificar quais clientes têm pendências, DAS vencendo, configurações não aprovadas
- Comparar desempenho entre clientes

REGRAS IMPORTANTES:
- Responda em português brasileiro com linguagem técnica contábil
- Use os dados reais do sistema — NUNCA invente valores
- Quando o contador perguntar sobre um cliente específico, localize-o na lista abaixo e use seus dados
- Para perguntas sobre "quais clientes têm X", filtre a lista e responda com precisão
- Seja objetivo e direto — o contador é profissional, não precisa de explicações básicas
- Use formatação clara: listas quando listar múltiplos clientes, parágrafos para explicações
- Máximo 4 parágrafos ou uma lista razoável, a menos que pedido`

  if (context) {
    prompt += `\n\n=== DADOS REAIS DO SISTEMA ===\n${context}`
  }
  if (extraContext) {
    prompt += `\n\nContexto adicional: ${extraContext}`
  }
  return prompt
}

// =========================================
// FALLBACK SEM API KEY
// =========================================

function getFallbackResponse(mensagem: string, role: string): string {
  const lower = mensagem.toLowerCase()

  if (lower.includes('das') || lower.includes('imposto')) {
    return role === 'cliente'
      ? 'Para verificar seu DAS e impostos, acesse a página "Impostos" no menu lateral. Lá você encontra os valores calculados e as guias para pagamento.'
      : 'Para verificar os DAS dos clientes, acesse o Painel de Controle onde estão listados todos os ciclos e seus valores.'
  }

  if (lower.includes('documento')) {
    return 'Você pode enviar e gerenciar documentos pela página "Documentos" no menu lateral. Aceitamos PDF, imagens e XML de NF-e.'
  }

  if (lower.includes('prazo') || lower.includes('vencimento')) {
    return 'O DAS do Simples Nacional vence todo dia 20 do mês seguinte à competência. Obrigações acessórias têm prazos variados conforme o regime tributário.'
  }

  if (lower.includes('simples') || lower.includes('fator r')) {
    return 'O Simples Nacional é um regime tributário simplificado. O Fator R é a relação entre folha de pagamento e faturamento dos últimos 12 meses — se ≥ 28%, o serviço é tributado pelo Anexo III; se < 28%, pelo Anexo V.'
  }

  return 'O assistente de IA está em modo básico no momento. Configure a chave da API Anthropic para respostas completas com acesso aos dados do sistema.'
}
