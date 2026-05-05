-- Seed data for NEXORY database
-- Run this after creating the schema

USE nexory_db;

-- Insert default admin user (password: admin123)
-- Password hashes generated with bcrypt
INSERT INTO users (id, email, name, password_hash, role) VALUES
('1', 'admin@nexory.com', 'Administrador', '$2a$10$n2mZWL4AxiXaUQu3/YkYd.2iCjrzgTKq6aw4iI7UmZRYktVU2T2hq', 'admin'),
('2', 'operator@nexory.com', 'Operador', '$2a$10$6FCU02RBUQmBEITkicH00.0L8GHJ1F7c.ANVrVscOgV50gNygkcoe', 'operator')
ON DUPLICATE KEY UPDATE email=email;
