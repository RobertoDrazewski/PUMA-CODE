-- ============================================================
--  PUMA CODE · Esquema de base de datos (MySQL 8 / Railway)
--  Importá este archivo en tu base de Railway, o dejá que el
--  backend lo ejecute solo al arrancar (src/config/initDb.js).
-- ============================================================

-- ----------------------------------------------------------------
--  USUARIOS (trabajadores)
--  role: admin = ve todo y gestiona usuarios | worker = operativo
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  name          VARCHAR(120) NOT NULL,
  email         VARCHAR(160) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role          ENUM('admin','worker') NOT NULL DEFAULT 'worker',
  active        TINYINT(1) NOT NULL DEFAULT 1,
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------
--  CLIENTES  (cada cliente = una venta, con el precio pagado)
--  status: lead | active | finished | cancelled
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS clients (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(160) NOT NULL,           -- nombre del contacto
  company     VARCHAR(160) DEFAULT NULL,        -- empresa
  email       VARCHAR(160) DEFAULT NULL,
  phone       VARCHAR(60)  DEFAULT NULL,
  service     VARCHAR(160) DEFAULT NULL,        -- tipo de trabajo vendido
  amount      DECIMAL(14,2) NOT NULL DEFAULT 0, -- precio que pagó el cliente
  currency    ENUM('ARS','USD') NOT NULL DEFAULT 'USD',
  status      ENUM('lead','active','finished','cancelled') NOT NULL DEFAULT 'active',
  sale_date   DATE NOT NULL,                    -- fecha de la venta (para métricas)
  notes       TEXT DEFAULT NULL,
  created_by  INT DEFAULT NULL,
  created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_clients_user FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_clients_status (status),
  INDEX idx_clients_saledate (sale_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------
--  PROYECTOS / TICKETS  (tablero tipo Trello/Jira simplificado)
--  status (columnas del tablero): todo | in_progress | review | done
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS projects (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  client_id   INT NOT NULL,
  title       VARCHAR(200) NOT NULL,
  description TEXT DEFAULT NULL,
  status      ENUM('todo','in_progress','review','done') NOT NULL DEFAULT 'todo',
  priority    ENUM('low','medium','high') NOT NULL DEFAULT 'medium',
  assignee_id INT DEFAULT NULL,                 -- trabajador asignado
  due_date    DATE DEFAULT NULL,
  position    INT NOT NULL DEFAULT 0,           -- orden dentro de la columna
  created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_projects_client   FOREIGN KEY (client_id)   REFERENCES clients(id) ON DELETE CASCADE,
  CONSTRAINT fk_projects_assignee FOREIGN KEY (assignee_id) REFERENCES users(id)   ON DELETE SET NULL,
  INDEX idx_projects_status (status),
  INDEX idx_projects_client (client_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------
--  SENTINEL · proyectos monitoreados (= "clientes" de seguridad)
--  Cada proyecto tiene un sello (badge) con token público propio.
--  plan: basico | profesional | enterprise
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS sentinel_projects (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  name          VARCHAR(160) NOT NULL,
  domain        VARCHAR(200) DEFAULT NULL,
  contact       VARCHAR(160) DEFAULT NULL,
  country       VARCHAR(8)  NOT NULL DEFAULT 'AR',
  plan          ENUM('basico','profesional','enterprise') NOT NULL DEFAULT 'profesional',
  score         DECIMAL(5,1) NOT NULL DEFAULT 0,    -- último score 0..100
  badge_token   VARCHAR(80) DEFAULT NULL UNIQUE,    -- token público del sello
  badge_active  TINYINT(1) NOT NULL DEFAULT 1,
  last_audit    DATETIME DEFAULT NULL,
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_sproj_token (badge_token)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------
--  SENTINEL · auditorías (cada análisis IA de salida de pentest)
--  result_json guarda la salida completa del analizador (infra,
--  hallazgos con CVSS, controles_ok, score determinístico).
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS sentinel_audits (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  project_id     INT NOT NULL,
  plan           VARCHAR(40) NOT NULL,
  tool           VARCHAR(60) DEFAULT NULL,        -- herramienta analizada (nmap, nikto, ...)
  score          DECIMAL(5,1) NOT NULL DEFAULT 0,
  level          VARCHAR(20) DEFAULT NULL,         -- excelente | bueno | regular | critico
  findings_count INT NOT NULL DEFAULT 0,
  status         VARCHAR(20) NOT NULL DEFAULT 'completada',
  result_json    LONGTEXT,
  created_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_audits_project FOREIGN KEY (project_id) REFERENCES sentinel_projects(id) ON DELETE CASCADE,
  INDEX idx_audits_project (project_id),
  INDEX idx_audits_date (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
