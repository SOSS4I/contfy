import { Request, Response } from 'express';
import { prisma } from '../utils/prisma';

/**
 * GET /api/v1/contador/dashboard/stats
 * Estatísticas do dashboard do contador
 */
export async function getDashboardStats(req: Request, res: Response) {
  try {
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Todas as queries em paralelo — 1 round-trip ao invés de 7
    const [
      totalClientes,
      clientesAtivos,
      clientesPendentes,
      documentosPendentes,
      documentosProcessadosMes,
      ciclosEmAndamento,
      aprovacoesPendentes
    ] = await Promise.all([
      prisma.client.count(),
      prisma.client.count({ where: { isActive: true } }),
      prisma.client.count({ where: { OR: [{ isVerified: false }, { accountingConfig: null }] } }),
      prisma.document.count({ where: { status: { in: ['UPLOADED', 'PROCESSING', 'PENDING_REVIEW'] } } }),
      prisma.document.count({ where: { status: 'PROCESSED', updatedAt: { gte: firstDayOfMonth } } }),
      prisma.monthlyAccountingCycle.count({ where: { status: { in: ['PENDING', 'PROCESSING', 'WAITING_DOCUMENTS'] } } }),
      prisma.client.count({ where: { isVerified: false } })
    ]);

    return res.status(200).json({
      success: true,
      data: {
        total_clientes: totalClientes,
        clientes_ativos: clientesAtivos,
        clientes_pendentes: clientesPendentes,
        documentos_pendentes: documentosPendentes,
        documentos_processados_mes: documentosProcessadosMes,
        ciclos_em_andamento: ciclosEmAndamento,
        aprovacoes_pendentes: aprovacoesPendentes
      }
    });

  } catch (error: any) {
    console.error('[DASHBOARD] Erro ao buscar stats:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao buscar estatísticas'
    });
  }
}

/**
 * GET /api/v1/contador/dashboard/clientes-pendentes
 * Lista clientes que precisam de atenção
 */
export async function getClientesPendentes(req: Request, res: Response) {
  try {
    const clientes = await prisma.client.findMany({
      where: {
        OR: [
          { accountingConfig: { status: { not: 'APPROVED' } } },
          { accountingConfig: null },
          {
            documents: {
              some: {
                status: {
                  in: ['PENDING_REVIEW', 'ERROR']
                }
              }
            }
          }
        ]
      },
      include: {
        accountingConfig: { select: { status: true } },
        _count: {
          select: {
            documents: {
              where: {
                status: {
                  in: ['UPLOADED', 'PROCESSING', 'PENDING_REVIEW']
                }
              }
            }
          }
        }
      },
      take: 10,
      orderBy: { createdAt: 'desc' }
    });

    const clientesFormatados = clientes.map(cliente => {
      const configAprovada = (cliente as any).accountingConfig?.status === 'APPROVED';
      return {
        id: cliente.id.toString(),
        name: cliente.name || cliente.razaoSocial || 'Sem nome',
        cnpj: cliente.cnpj || 'Sem CNPJ',
        status: configAprovada ? 'ativo' : 'pendente',
        aprovado: configAprovada,
        docs_pendentes: cliente._count.documents
      };
    });

    return res.status(200).json({
      success: true,
      data: clientesFormatados
    });

  } catch (error: any) {
    console.error('[DASHBOARD] Erro ao buscar clientes pendentes:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao buscar clientes pendentes'
    });
  }
}

/**
 * GET /api/v1/contador/dashboard/performance
 * Performance do mês atual
 */
export async function getPerformance(req: Request, res: Response) {
  try {
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    // Todas em paralelo
    const [docsProcessados, ciclosConcluidos, totalCiclos, dasGerados] = await Promise.all([
      prisma.document.count({ where: { status: 'PROCESSED', updatedAt: { gte: firstDayOfMonth } } }),
      prisma.monthlyAccountingCycle.count({ where: { status: 'COMPLETED', updatedAt: { gte: firstDayOfMonth } } }),
      prisma.monthlyAccountingCycle.count({ where: { referenceMonth: currentMonth, referenceYear: currentYear } }),
      // DAS gerados = ciclos completados com DAS emitido no mês
      prisma.monthlyAccountingCycle.count({ where: { das_pdf_path: { not: null }, updatedAt: { gte: firstDayOfMonth } } })
    ]);

    const taxaSucesso = totalCiclos > 0
      ? Math.round((ciclosConcluidos / totalCiclos) * 100)
      : 0;

    return res.status(200).json({
      success: true,
      data: {
        documentos_processados: docsProcessados,
        das_gerados: dasGerados,
        ciclos_concluidos: ciclosConcluidos,
        taxa_sucesso: taxaSucesso
      }
    });

  } catch (error: any) {
    console.error('[DASHBOARD] Erro ao buscar performance:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao buscar performance'
    });
  }
}

/**
 * GET /api/v1/contador/clientes
 * Lista TODOS os clientes do sistema
 */
export async function getAllClientes(req: Request, res: Response) {
  try {
    const { search, status, regime } = req.query;

    const where: any = {};

    // Filtro de busca
    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { razaoSocial: { contains: search as string, mode: 'insensitive' } },
        { email: { contains: search as string, mode: 'insensitive' } },
        { cnpj: { contains: search as string } }
      ];
    }

    // Filtro de status
    if (status && status !== 'todos') {
      if (status === 'ativo') {
        where.isActive = true;
        where.isVerified = true;
      } else if (status === 'pendente') {
        where.isVerified = false;
      } else if (status === 'inativo') {
        where.isActive = false;
      }
    }

    // Filtro de regime
    if (regime && regime !== 'todos') {
      where.regimeTributario = regime;
    }

    const clientes = await prisma.client.findMany({
      where,
      include: {
        contador: {
          select: {
            name: true,
            email: true
          }
        },
        accountingConfig: {
          select: {
            status: true
          }
        },
        _count: {
          select: {
            documents: {
              where: {
                status: {
                  in: ['UPLOADED', 'PROCESSING', 'PENDING_REVIEW']
                }
              }
            }
          }
        },
        monthlyCycles: {
          where: { status: { in: ['PENDING', 'PROCESSING'] } },
          orderBy: { referenceYear: 'asc' },
          take: 1,
          select: { referenceMonth: true, referenceYear: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Batch: buscar docs processados de todos os clientes em uma única query
    const clientIds = clientes.map(c => c.id);
    const docsProcessadosPorCliente = await prisma.document.groupBy({
      by: ['clientId'],
      where: { status: 'PROCESSED', clientId: { in: clientIds } },
      _count: { id: true }
    });
    const docsProcessadosMap = new Map(
      docsProcessadosPorCliente.map(d => [d.clientId, d._count.id])
    );

    // Formatar resposta (sem queries adicionais por cliente)
    const clientesFormatados = clientes.map((cliente) => {
      const docsProcessados = docsProcessadosMap.get(cliente.id) ?? 0;
      const proximoCiclo = cliente.monthlyCycles[0] ?? null;

      // Aprovação baseada no ClientAccountingConfig (não em isVerified)
      const configAprovada = (cliente as any).accountingConfig?.status === 'APPROVED';

      // Definir status baseado em configuração e atividade
      let statusCliente: 'ativo' | 'pendente' | 'inativo' | 'problema' = 'ativo';
      if (!cliente.isActive) {
        statusCliente = 'inativo';
      } else if (!configAprovada) {
        statusCliente = 'pendente';
      } else if (cliente._count.documents > 5) {
        statusCliente = 'problema';
      }

      // Identificar problemas
      const problemas: string[] = [];
      if (!configAprovada) {
        problemas.push('Aguardando aprovação');
      }
      if (cliente._count.documents > 5) {
        problemas.push(`${cliente._count.documents} documentos pendentes`);
      }

      return {
        id: cliente.id.toString(),
        name: cliente.name || cliente.razaoSocial || 'Sem nome',
        cnpj: cliente.cnpj || 'Sem CNPJ',
        regime_tributario: cliente.regimeTributario || 'Não informado',
        status: statusCliente,
        aprovado: configAprovada,
        docs_pendentes: cliente._count.documents,
        docs_processados: docsProcessados,
        ultimo_envio: cliente.updatedAt.toISOString().split('T')[0],
        proxima_obrigacao: proximoCiclo
          ? `${proximoCiclo.referenceYear}-${String(proximoCiclo.referenceMonth).padStart(2, '0')}-20`
          : null,
        problemas,
        email: cliente.email,
        telefone: cliente.phone || 'Não informado',
        responsavel: cliente.contador?.name || 'Sem responsável',
        created_at: cliente.createdAt.toISOString().split('T')[0]
      };
    });

    return res.status(200).json({
      success: true,
      data: clientesFormatados,
      total: clientesFormatados.length
    });

  } catch (error: any) {
    console.error('[CLIENTES] Erro ao buscar clientes:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao buscar clientes'
    });
  }
}

/**
 * GET /api/v1/contador/clientes/:id
 * Detalhes completos de um cliente específico
 */
export async function getClienteById(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const clientId = parseInt(id);

    if (isNaN(clientId)) {
      return res.status(400).json({
        success: false,
        message: 'ID de cliente inválido'
      });
    }

    // Buscar cliente com todas as informações
    const cliente = await prisma.client.findUnique({
      where: { id: clientId },
      include: {
        contador: {
          select: {
            name: true,
            email: true,
            phone: true
          }
        },
        accountingConfig: true,
        onboardingSessions: {
          include: {
            responses: {
              include: {
                question: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          },
          take: 1
        },
        _count: {
          select: {
            documents: true,
            taxCalculations: true,
            monthlyCycles: true
          }
        }
      }
    });

    if (!cliente) {
      return res.status(404).json({
        success: false,
        message: 'Cliente não encontrado'
      });
    }

    // Buscar documentos recentes
    const documentosRecentes = await prisma.document.findMany({
      where: { clientId },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: {
        id: true,
        fileName: true,
        documentType: true,
        status: true,
        createdAt: true,
        updatedAt: true
      }
    });

    // Buscar ciclos mensais
    const ciclosMensais = await prisma.monthlyAccountingCycle.findMany({
      where: { clientId },
      orderBy: [
        { referenceYear: 'desc' },
        { referenceMonth: 'desc' }
      ],
      take: 12
    });

    // Buscar cálculos de impostos recentes
    const calculosImpostos = await prisma.taxCalculation.findMany({
      where: { clientId },
      orderBy: [
        { referenceYear: 'desc' },
        { referenceMonth: 'desc' }
      ],
      take: 6
    });

    // Definir status
    let status: 'ativo' | 'pendente' | 'inativo' | 'problema' = 'ativo';
    if (!cliente.isActive) {
      status = 'inativo';
    } else if (!cliente.isVerified) {
      status = 'pendente';
    } else if (cliente._count.documents > 5) {
      status = 'problema';
    }

    // Formatar dados do onboarding
    let onboardingData: any = null;
    if (cliente.onboardingSessions && cliente.onboardingSessions.length > 0) {
      const session = cliente.onboardingSessions[0];
      const responses: any = {};

      session.responses.forEach(resp => {
        const key = resp.question.questionKey;
        // Parse JSON if needed
        let value = resp.responseValue;
        if (typeof value === 'string') {
          try {
            value = JSON.parse(value);
          } catch (e) {
            // Keep as string if not valid JSON
          }
        }
        responses[key] = value;
      });

      onboardingData = {
        sessionId: session.id,
        status: session.status,
        completedAt: session.completedAt?.toISOString().split('T')[0],
        responses
      };
    }

    // Formatar resposta
    const clienteDetalhado = {
      // Dados básicos
      id: cliente.id.toString(),
      name: cliente.name || cliente.razaoSocial || 'Sem nome',
      razaoSocial: cliente.razaoSocial,
      email: cliente.email,
      phone: cliente.phone,

      // Documentos
      cnpj: cliente.cnpj,
      cpf: cliente.cpf,
      ie: cliente.ie,
      im: cliente.im,

      // Endereço
      endereco: cliente.endereco,
      cidade: cliente.cidade,
      estado: cliente.estado,
      cep: cliente.cep,

      // Regime tributário
      regimeTributario: cliente.regimeTributario || cliente.taxRegime,
      simplesNacionalAnexo: cliente.simplesNacionalAnexo,
      cnaePrincipal: cliente.cnaePrincipal,

      // Informações financeiras
      monthlyRevenue: cliente.monthlyRevenue,
      annualRevenue: cliente.annualRevenue,
      employeeCount: cliente.employeeCount,

      // Status
      status,
      isActive: cliente.isActive,
      isVerified: cliente.isVerified,

      // Contador responsável
      contador: cliente.contador ? {
        name: cliente.contador.name,
        email: cliente.contador.email,
        phone: cliente.contador.phone
      } : null,

      // Configuração contábil
      accountingConfig: cliente.accountingConfig,

      // Dados do onboarding
      onboardingData,

      // Estatísticas
      stats: {
        total_documentos: cliente._count.documents,
        total_calculos: cliente._count.taxCalculations,
        total_ciclos: cliente._count.monthlyCycles
      },

      // Dados relacionados
      documentos_recentes: documentosRecentes.map(doc => ({
        id: doc.id,
        fileName: doc.fileName,
        tipo: doc.documentType,
        status: doc.status,
        data_upload: doc.createdAt.toISOString().split('T')[0],
        data_atualizacao: doc.updatedAt.toISOString().split('T')[0]
      })),

      ciclos_mensais: ciclosMensais.map(ciclo => ({
        id: ciclo.id,
        mes: ciclo.referenceMonth,
        ano: ciclo.referenceYear,
        status: ciclo.status,
        das_valor: ciclo.das_value ? parseFloat(ciclo.das_value.toString()) : null,
        das_vencimento: ciclo.das_due_date ? ciclo.das_due_date.toISOString().split('T')[0] : null,
        das_pago: ciclo.das_paid
      })),

      calculos_impostos: calculosImpostos.map(calc => ({
        id: calc.id,
        mes: calc.referenceMonth,
        ano: calc.referenceYear,
        tipo: calc.taxType,
        status: calc.status,
        valor: calc.taxAmount,
        vencimento: calc.dueDate ? calc.dueDate.toISOString().split('T')[0] : null
      })),

      // Timestamps
      createdAt: cliente.createdAt.toISOString().split('T')[0],
      updatedAt: cliente.updatedAt.toISOString().split('T')[0]
    };

    return res.status(200).json({
      success: true,
      data: clienteDetalhado
    });

  } catch (error: any) {
    console.error('[CLIENTE] Erro ao buscar detalhes do cliente:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao buscar detalhes do cliente'
    });
  }
}
