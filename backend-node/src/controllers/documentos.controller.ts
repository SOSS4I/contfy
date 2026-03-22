import { Request, Response } from 'express';
import { prisma } from '../utils/prisma';

// GET /documentos - Listar documentos
export async function listarDocumentos(req: Request, res: Response) {
  try {
    const { client_id, tipo, status, page = '1', limit = '50' } = req.query;

    const pageNum = Math.max(1, parseInt(page as string) || 1);
    const limitNum = Math.min(200, Math.max(1, parseInt(limit as string) || 50));
    const skip = (pageNum - 1) * limitNum;

    let where: any = {};

    if (client_id) {
      where.clientId = Number(client_id);
    }

    if (tipo) {
      where.documentType = tipo;
    }

    if (status) {
      where.status = status;
    }

    const [documentos, total] = await Promise.all([
      prisma.document.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNum,
        include: {
          client: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      }),
      prisma.document.count({ where }),
    ]);

    res.json({
      data: documentos,
      total,
      page: pageNum,
      per_page: limitNum,
      total_pages: Math.ceil(total / limitNum),
    });
  } catch (error: any) {
    console.error('Erro ao listar documentos:', error);
    res.status(500).json({ detail: 'Erro ao listar documentos' });
  }
}

// GET /documentos/:id - Buscar documento por ID
export async function buscarDocumentoPorId(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const documento = await prisma.document.findUnique({
      where: { id: Number(id) },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!documento) {
      return res.status(404).json({ detail: 'Documento não encontrado' });
    }

    res.json({ data: documento });
  } catch (error: any) {
    console.error('Erro ao buscar documento:', error);
    res.status(500).json({ detail: 'Erro ao buscar documento' });
  }
}

// POST /documentos - Criar documento (placeholder - upload seria implementado depois)
export async function criarDocumento(req: Request, res: Response) {
  try {
    const {
      client_id,
      document_type = 'OUTROS',
      file_name,
      file_path = '/uploads/temp',
    } = req.body;

    const documento = await prisma.document.create({
      data: {
        clientId: Number(client_id),
        documentType: document_type,
        fileName: file_name,
        filePath: file_path,
        status: 'UPLOADED',
        createdAt: new Date(),
      },
    });

    res.status(201).json({ data: documento });
  } catch (error: any) {
    console.error('Erro ao criar documento:', error);
    res.status(500).json({ detail: 'Erro ao criar documento' });
  }
}

// GET /documentos/estatisticas - Estatísticas de documentos
export async function getEstatisticas(req: Request, res: Response) {
  try {
    const { client_id } = req.query;

    let where: any = {};
    if (client_id) {
      where.clientId = Number(client_id);
    }

    const total = await prisma.document.count({ where });
    const aprovados = await prisma.document.count({ where: { ...where, status: 'PROCESSED' } });
    const processando = await prisma.document.count({ where: { ...where, status: 'PROCESSING' } });
    const rejeitados = await prisma.document.count({ where: { ...where, status: 'ERROR' } });
    const pendentes = await prisma.document.count({ where: { ...where, status: 'UPLOADED' } });

    res.json({ total, aprovados, processando, rejeitados, pendentes });
  } catch (error: any) {
    console.error('Erro ao buscar estatísticas:', error);
    res.status(500).json({ detail: 'Erro ao buscar estatísticas' });
  }
}

// DELETE /documentos/:id - Deletar documento
export async function deletarDocumento(req: Request, res: Response) {
  try {
    const { id } = req.params;

    await prisma.document.delete({
      where: { id: Number(id) },
    });

    res.status(204).send();
  } catch (error: any) {
    console.error('Erro ao deletar documento:', error);
    res.status(500).json({ detail: 'Erro ao deletar documento' });
  }
}
