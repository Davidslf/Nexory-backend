-- Script para crear la base de datos manualmente
-- Ejecuta este script desde MySQL Workbench o desde la línea de comandos
-- después de que hayas resuelto el problema de la contraseña

-- Crear la base de datos
CREATE DATABASE IF NOT EXISTS nexory_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE nexory_db;

-- Users Table
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('admin', 'operator') NOT NULL DEFAULT 'operator',
  avatar VARCHAR(500) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_email (email),
  INDEX idx_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Clients Table
CREATE TABLE IF NOT EXISTS clients (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  name VARCHAR(255) NOT NULL,
  document_id VARCHAR(50) UNIQUE NOT NULL,
  plan VARCHAR(100) NOT NULL,
  plan_speed INT NOT NULL COMMENT 'Speed in Mbps',
  status ENUM('active', 'suspended', 'pending') NOT NULL DEFAULT 'pending',
  payment_due_date DATE NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  phone VARCHAR(20) NULL,
  email VARCHAR(255) NULL,
  address VARCHAR(500) NULL,
  city VARCHAR(100) NULL,
  location VARCHAR(100) NULL,
  installation_date DATE NULL,
  contract_number VARCHAR(100) NULL,
  notes TEXT NULL,
  last_connection TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_document_id (document_id),
  INDEX idx_status (status),
  INDEX idx_payment_due_date (payment_due_date),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Client Tags Table
CREATE TABLE IF NOT EXISTS client_tags (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  client_id VARCHAR(36) NOT NULL,
  tag_name VARCHAR(50) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
  UNIQUE KEY unique_client_tag (client_id, tag_name),
  INDEX idx_client_id (client_id),
  INDEX idx_tag_name (tag_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Routers Table
CREATE TABLE IF NOT EXISTS routers (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  name VARCHAR(255) NOT NULL,
  ip VARCHAR(45) NOT NULL,
  status ENUM('online', 'offline', 'maintenance') NOT NULL DEFAULT 'offline',
  location VARCHAR(255) NOT NULL,
  model VARCHAR(100) NULL,
  firmware VARCHAR(100) NULL,
  uptime DECIMAL(5, 2) DEFAULT 0.00 COMMENT 'Percentage',
  cpu_usage DECIMAL(5, 2) DEFAULT 0.00 COMMENT 'Percentage',
  memory_usage DECIMAL(5, 2) DEFAULT 0.00 COMMENT 'Percentage',
  bandwidth_in DECIMAL(10, 2) DEFAULT 0.00 COMMENT 'Mbps',
  bandwidth_out DECIMAL(10, 2) DEFAULT 0.00 COMMENT 'Mbps',
  connected_clients INT DEFAULT 0,
  last_seen TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_status (status),
  INDEX idx_location (location),
  INDEX idx_last_seen (last_seen)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Technical Supports Table
CREATE TABLE IF NOT EXISTS technical_supports (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  client_id VARCHAR(36) NOT NULL,
  type ENUM('installation', 'failure', 'removal') NOT NULL,
  is_new_client BOOLEAN NOT NULL DEFAULT FALSE,
  status ENUM('pending', 'in_progress', 'reviewed', 'resolved', 'cancelled') NOT NULL DEFAULT 'pending',
  reported_issue TEXT NULL,
  reported_at TIMESTAMP NOT NULL,
  assigned_to VARCHAR(36) NULL COMMENT 'User ID',
  priority ENUM('low', 'medium', 'high', 'urgent') NOT NULL DEFAULT 'medium',
  notes TEXT NULL,
  resolved_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
  INDEX idx_client_id (client_id),
  INDEX idx_status (status),
  INDEX idx_type (type),
  INDEX idx_priority (priority),
  INDEX idx_reported_at (reported_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  user_id VARCHAR(36) NOT NULL,
  type ENUM('support_new', 'support_urgent', 'client_suspended', 'router_offline', 'payment_due', 'system_alert') NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN NOT NULL DEFAULT FALSE,
  link VARCHAR(500) NULL,
  severity ENUM('info', 'warning', 'error', 'success') NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_user_id (user_id),
  INDEX idx_read (read),
  INDEX idx_type (type),
  INDEX idx_created_at (created_at),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Activities Table
CREATE TABLE IF NOT EXISTS activities (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  type ENUM('client_suspended', 'client_reactivated', 'router_offline', 'router_online', 'payment_received', 'plan_upgraded', 'alert') NOT NULL,
  description TEXT NOT NULL,
  client_name VARCHAR(255) NULL,
  severity ENUM('info', 'warning', 'error', 'success') NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_type (type),
  INDEX idx_severity (severity),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Billing Data Table
CREATE TABLE IF NOT EXISTS billing_data (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  month VARCHAR(7) NOT NULL COMMENT 'Format: YYYY-MM',
  revenue DECIMAL(12, 2) NOT NULL,
  clients INT NOT NULL,
  average_revenue_per_user DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_month (month),
  INDEX idx_month (month)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Client Metrics Table
CREATE TABLE IF NOT EXISTS client_metrics (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  client_id VARCHAR(36) NOT NULL,
  bandwidth_usage DECIMAL(10, 2) NULL COMMENT 'GB',
  latency INT NULL COMMENT 'ms',
  uptime DECIMAL(5, 2) NULL COMMENT 'Percentage',
  recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
  INDEX idx_client_id (client_id),
  INDEX idx_recorded_at (recorded_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
