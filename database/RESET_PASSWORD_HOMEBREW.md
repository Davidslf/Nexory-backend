# Resetear Contraseña MySQL (Homebrew) - macOS

## Método 1: Resetear Contraseña (Recomendado)

### Paso 1: Detener MySQL
```bash
brew services stop mysql
```

### Paso 2: Iniciar MySQL en modo seguro
```bash
sudo mysqld_safe --skip-grant-tables --skip-networking &
```

Espera unos segundos y luego presiona Enter.

### Paso 3: Conectar sin contraseña
Abre una NUEVA terminal y ejecuta:
```bash
mysql -u root
```

### Paso 4: En MySQL, ejecuta estos comandos:
```sql
USE mysql;
ALTER USER 'root'@'localhost' IDENTIFIED BY 'nueva_password123';
FLUSH PRIVILEGES;
EXIT;
```

### Paso 5: Detener MySQL en modo seguro
En la primera terminal, presiona Ctrl+C o ejecuta:
```bash
sudo pkill mysqld
```

### Paso 6: Reiniciar MySQL normalmente
```bash
brew services start mysql
```

### Paso 7: Probar la nueva contraseña
```bash
mysql -u root -p
# Ingresa: nueva_password123
```

---

## Método 2: Intentar sin contraseña

A veces MySQL no tiene contraseña por defecto. Prueba:

```bash
mysql -u root
```

Si funciona, entonces no necesitas contraseña. Puedes:
1. Dejar la contraseña vacía en `.env` (DB_PASSWORD=)
2. O crear una contraseña nueva con:
```sql
ALTER USER 'root'@'localhost' IDENTIFIED BY 'tu_password';
FLUSH PRIVILEGES;
```

---

## Método 3: Usar MySQL Workbench

Si tienes MySQL Workbench instalado:
1. Abre MySQL Workbench
2. Intenta conectarte (puede que funcione sin contraseña)
3. Si puedes conectarte, ve a "Server" > "Users and Privileges"
4. Selecciona "root" y cambia la contraseña

---

## Método 4: Crear un nuevo usuario (si puedes acceder)

Si logras acceder de alguna forma, crea un usuario específico para NEXORY:

```sql
CREATE USER 'nexory_user'@'localhost' IDENTIFIED BY 'nexory_password123';
GRANT ALL PRIVILEGES ON nexory_db.* TO 'nexory_user'@'localhost';
FLUSH PRIVILEGES;
```

Luego actualiza tu `.env`:
```env
DB_USER=nexory_user
DB_PASSWORD=nexory_password123
```

---

## Después de resolver el acceso

Una vez que puedas acceder a MySQL, ejecuta:

```bash
mysql -u root -p < database/schema.sql
```

O si creaste un usuario nuevo:
```bash
mysql -u nexory_user -p < database/schema.sql
```

O desde MySQL Workbench, abre y ejecuta el archivo `database/create_database_manual.sql`
