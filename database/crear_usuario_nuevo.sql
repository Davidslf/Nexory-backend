-- Script para crear un usuario nuevo para NEXORY
-- Ejecuta esto desde MySQL Workbench si puedes conectarte

-- Crear usuario nuevo
CREATE USER 'nexory_user'@'localhost' IDENTIFIED BY 'nexory123';

-- Dar todos los privilegios en la base de datos nexory_db
GRANT ALL PRIVILEGES ON nexory_db.* TO 'nexory_user'@'localhost';

-- Si quieres que pueda crear la base de datos también
GRANT ALL PRIVILEGES ON *.* TO 'nexory_user'@'localhost' WITH GRANT OPTION;

-- Aplicar cambios
FLUSH PRIVILEGES;

-- Verificar que se creó
SELECT user, host FROM mysql.user WHERE user = 'nexory_user';

-- Si todo funciona, actualiza tu .env con:
-- DB_USER=nexory_user
-- DB_PASSWORD=nexory123
