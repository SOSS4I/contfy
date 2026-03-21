-- Criar tabela de notificações para o dashboard admin
CREATE TABLE IF NOT EXISTS admin_notifications (
  id SERIAL PRIMARY KEY,
  client_id INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  session_id INTEGER REFERENCES onboarding_sessions(id) ON DELETE SET NULL,

  -- Tipo de notificação
  type VARCHAR(50) NOT NULL, -- 'READY_TO_REVIEW' ou 'NEEDS_ANALYSIS'

  -- Status
  status VARCHAR(50) NOT NULL DEFAULT 'PENDING', -- 'PENDING', 'REVIEWED', 'APPROVED', 'REJECTED'

  -- Dados da notificação
  title VARCHAR(255) NOT NULL,
  message TEXT,
  severity VARCHAR(20) NOT NULL DEFAULT 'INFO', -- 'INFO', 'WARNING', 'URGENT'

  -- Classificação fiscal para contexto
  regime VARCHAR(100),
  confidence_score DECIMAL(3, 2),

  -- Contador responsável
  contador_id INTEGER REFERENCES contadores(id) ON DELETE SET NULL,

  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  reviewed_at TIMESTAMP,
  reviewed_by INTEGER REFERENCES contadores(id) ON DELETE SET NULL,

  -- Notas do contador
  contador_notes TEXT,

  CONSTRAINT admin_notifications_type_check CHECK (type IN ('READY_TO_REVIEW', 'NEEDS_ANALYSIS')),
  CONSTRAINT admin_notifications_status_check CHECK (status IN ('PENDING', 'REVIEWED', 'APPROVED', 'REJECTED'))
);

-- Índices para performance
CREATE INDEX idx_admin_notifications_type ON admin_notifications(type);
CREATE INDEX idx_admin_notifications_status ON admin_notifications(status);
CREATE INDEX idx_admin_notifications_client ON admin_notifications(client_id);
CREATE INDEX idx_admin_notifications_created ON admin_notifications(created_at DESC);
