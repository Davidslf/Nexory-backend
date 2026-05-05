-- Método alternativo: Resetear contraseña usando archivo SQL
-- Este método funciona si puedes iniciar MySQL de alguna forma

-- Opción 1: Si puedes acceder sin contraseña o con otra cuenta
USE mysql;

-- Resetear contraseña de root
ALTER USER 'root'@'localhost' IDENTIFIED BY 'nexory123';
FLUSH PRIVILEGES;

-- Opción 2: Crear un usuario nuevo para NEXORY (más seguro)
CREATE USER IF NOT EXISTS 'nexory_user'@'localhost' IDENTIFIED BY 'nexory123';
GRANT ALL PRIVILEGES ON nexory_db.* TO 'nexory_user'@'localhost';
GRANT ALL PRIVILEGES ON *.* TO 'nexory_user'@'localhost' WITH GRANT OPTION;
FLUSH PRIVILEGES;

-- Verificar usuarios
SELECT user, host FROM mysql.user WHERE user IN ('root', 'nexory_user');
