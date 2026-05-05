# Resetear Contraseña de MySQL

## Opción 1: Resetear desde Terminal (macOS)

1. **Detener MySQL:**
```bash
sudo /usr/local/mysql/support-files/mysql.server stop
# O si usas Homebrew:
brew services stop mysql
```

2. **Iniciar MySQL en modo seguro (sin verificación de permisos):**
```bash
sudo mysqld_safe --skip-grant-tables --skip-networking &
```

3. **Conectar sin contraseña:**
```bash
mysql -u root
```

4. **En MySQL, ejecutar:**
```sql
USE mysql;
UPDATE user SET authentication_string=PASSWORD('nueva_password') WHERE User='root';
FLUSH PRIVILEGES;
EXIT;
```

5. **Reiniciar MySQL normalmente:**
```bash
sudo /usr/local/mysql/support-files/mysql.server restart
# O:
brew services restart mysql
```

## Opción 2: Usar MySQL Workbench

Si tienes MySQL Workbench instalado:
1. Abre MySQL Workbench
2. Intenta conectarte (puede que funcione sin contraseña o con una guardada)
3. Si puedes conectarte, ve a "Server" > "Users and Privileges"
4. Selecciona el usuario "root" y cambia la contraseña

## Opción 3: Crear un Nuevo Usuario

Si puedes acceder de alguna forma, crea un nuevo usuario:

```sql
CREATE USER 'nexory_user'@'localhost' IDENTIFIED BY 'tu_password_segura';
GRANT ALL PRIVILEGES ON nexory_db.* TO 'nexory_user'@'localhost';
FLUSH PRIVILEGES;
```

Luego actualiza el `.env` con este nuevo usuario.

## Opción 4: Reinstalar MySQL (Último recurso)

Si nada funciona, puedes reinstalar MySQL:
```bash
# Con Homebrew:
brew uninstall mysql
brew install mysql
brew services start mysql
```

Después de la instalación, MySQL generalmente no tiene contraseña inicial.
