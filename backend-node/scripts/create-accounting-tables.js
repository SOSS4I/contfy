const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function createAccountingTables() {
  console.log('🏗️  Criando tabelas do sistema de contabilidade mensal...\n')

  try {
    // Tabela 1: client_accounting_config
    console.log('📋 Criando tabela: client_accounting_config')
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS client_accounting_config (
        id SERIAL PRIMARY KEY,
        client_id INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE,

        -- Configuração definida pelo contador
        regime_tributario VARCHAR(50) NOT NULL,
        anexo_simples VARCHAR(10),
        atividade_principal TEXT,
        cnae_code VARCHAR(20),

        -- Configurações de folha (para Fator R)
        has_employees BOOLEAN DEFAULT false,
        employee_count INTEGER DEFAULT 0,
        has_prolabore BOOLEAN DEFAULT false,

        -- Instruções do contador para a IA
        contador_instructions TEXT,

        -- Configurações de documentos mensais
        required_documents JSONB,

        -- Status
        status VARCHAR(20) DEFAULT 'ACTIVE',
        approved_by INTEGER REFERENCES users(id),
        approved_at TIMESTAMP,

        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP,

        UNIQUE(client_id)
      );
    `)
    console.log('✅ Tabela client_accounting_config criada\n')

    // Tabela 2: monthly_accounting_cycles
    console.log('📋 Criando tabela: monthly_accounting_cycles')
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS monthly_accounting_cycles (
        id SERIAL PRIMARY KEY,
        client_id INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE,

        -- Período de referência
        reference_month INTEGER NOT NULL CHECK (reference_month BETWEEN 1 AND 12),
        reference_year INTEGER NOT NULL,

        -- Status do ciclo
        status VARCHAR(30) NOT NULL DEFAULT 'AWAITING_DOCUMENTS',
        -- 'AWAITING_DOCUMENTS' → 'DOCUMENTS_RECEIVED' → 'PROCESSING' → 'COMPLETED' → 'PAID'

        -- Documentos
        documents_requested_at TIMESTAMP,
        documents_deadline DATE,
        documents_received_at TIMESTAMP,
        documents_validated BOOLEAN DEFAULT false,

        -- Cálculos
        tax_calculation JSONB,
        accounting_entries JSONB,

        -- Guias geradas
        das_pdf_path TEXT,
        das_value DECIMAL(10,2),
        das_due_date DATE,
        das_paid BOOLEAN DEFAULT false,
        das_paid_at TIMESTAMP,

        -- Relatórios
        monthly_report_path TEXT,
        monthly_report_data JSONB,

        -- Logs e erros
        processing_log TEXT,
        error_message TEXT,

        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP,

        UNIQUE(client_id, reference_month, reference_year)
      );
    `)
    console.log('✅ Tabela monthly_accounting_cycles criada\n')

    // Tabela 3: client_monthly_documents
    console.log('📋 Criando tabela: client_monthly_documents')
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS client_monthly_documents (
        id SERIAL PRIMARY KEY,
        cycle_id INTEGER NOT NULL REFERENCES monthly_accounting_cycles(id) ON DELETE CASCADE,
        client_id INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE,

        document_type VARCHAR(50) NOT NULL,
        -- 'NFe_EMITIDAS', 'NFe_RECEBIDAS', 'FOLHA_PAGAMENTO', 'EXTRATOS_BANCARIOS', etc

        file_path TEXT NOT NULL,
        file_name TEXT NOT NULL,
        file_size INTEGER,
        file_mime_type VARCHAR(100),

        -- Validação
        validated BOOLEAN DEFAULT false,
        validation_result JSONB,
        validation_message TEXT,

        -- Dados extraídos (se NFe)
        extracted_data JSONB,

        uploaded_at TIMESTAMP DEFAULT NOW()
      );
    `)
    console.log('✅ Tabela client_monthly_documents criada\n')

    // Tabela 4: client_nfe_data (Dados extraídos das NFe)
    console.log('📋 Criando tabela: client_nfe_data')
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS client_nfe_data (
        id SERIAL PRIMARY KEY,
        document_id INTEGER NOT NULL REFERENCES client_monthly_documents(id) ON DELETE CASCADE,
        cycle_id INTEGER NOT NULL REFERENCES monthly_accounting_cycles(id) ON DELETE CASCADE,
        client_id INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE,

        -- Tipo de NFe
        nfe_type VARCHAR(20) NOT NULL, -- 'EMITIDA', 'RECEBIDA'

        -- Dados da NFe
        nfe_number VARCHAR(50),
        nfe_series VARCHAR(10),
        nfe_key VARCHAR(44), -- Chave de acesso
        nfe_date DATE,

        -- Valores
        total_value DECIMAL(10,2),
        base_calculo_icms DECIMAL(10,2),
        valor_icms DECIMAL(10,2),
        base_calculo_issqn DECIMAL(10,2),
        valor_issqn DECIMAL(10,2),
        valor_pis DECIMAL(10,2),
        valor_cofins DECIMAL(10,2),

        -- CFOP
        cfop VARCHAR(10),

        -- Fornecedor/Cliente
        partner_cnpj_cpf VARCHAR(20),
        partner_name TEXT,

        -- XML completo
        xml_data TEXT,

        created_at TIMESTAMP DEFAULT NOW()
      );
    `)
    console.log('✅ Tabela client_nfe_data criada\n')

    console.log('🎉 Todas as tabelas foram criadas com sucesso!')

  } catch (error) {
    console.error('❌ Erro ao criar tabelas:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

createAccountingTables()
  .then(() => {
    console.log('\n✅ Script finalizado com sucesso!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Erro fatal:', error)
    process.exit(1)
  })
