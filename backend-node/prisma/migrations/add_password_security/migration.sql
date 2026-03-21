-- Add password_hash to clients table
ALTER TABLE clients ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255);

-- Add razao_social to clients
ALTER TABLE clients ADD COLUMN IF NOT EXISTS razao_social VARCHAR(255);

-- Add address fields to clients
ALTER TABLE clients ADD COLUMN IF NOT EXISTS endereco VARCHAR(500);
ALTER TABLE clients ADD COLUMN IF NOT EXISTS cidade VARCHAR(100);
ALTER TABLE clients ADD COLUMN IF NOT EXISTS estado VARCHAR(2);
ALTER TABLE clients ADD COLUMN IF NOT EXISTS cep VARCHAR(9);
ALTER TABLE clients ADD COLUMN IF NOT EXISTS regime_tributario VARCHAR(50);

-- Create contadores table (if not exists)
CREATE TABLE IF NOT EXISTS contadores (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    cpf VARCHAR(14) UNIQUE NOT NULL,
    crc VARCHAR(50),
    codigo_contador VARCHAR(6) UNIQUE NOT NULL,
    status VARCHAR(20) DEFAULT 'ativo',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indices for security
CREATE INDEX IF NOT EXISTS idx_contadores_email ON contadores(email);
CREATE INDEX IF NOT EXISTS idx_contadores_cpf ON contadores(cpf);
CREATE INDEX IF NOT EXISTS idx_contadores_codigo ON contadores(codigo_contador);
CREATE INDEX IF NOT EXISTS idx_clients_email_hash ON clients(email, password_hash);

-- Update existing users passwords with a secure hash (MUST BE CHANGED IN PRODUCTION!)
-- This is just for development/testing
UPDATE clients SET password_hash = '$2b$10$rN.8kZUgf.gVQxQXqfGT0OKxZHV5jF3vZYQZQ8Z8Z8Z8Z8Z8Z8Z8Z8'
WHERE password_hash IS NULL OR password_hash = '';

UPDATE users SET password_hash = '$2b$10$rN.8kZUgf.gVQxQXqfGT0OKxZHV5jF3vZYQZQ8Z8Z8Z8Z8Z8Z8Z8Z8'
WHERE password_hash IS NULL OR password_hash = '';
