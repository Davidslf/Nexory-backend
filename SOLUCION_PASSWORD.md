# 🔐 Solución: No Recuerdo la Contraseña de MySQL

## Opción Rápida: Resetear Contraseña

### Método Automático (Script)

1. **Ejecuta el script:**
```bash
cd nexory-backend/database
./reset_password.sh
```

El script te guiará paso a paso.

### Método Manual (Paso a Paso)

#### Paso 1: Detener MySQL
```bash
brew services stop mysql
```

#### Paso 2: Iniciar MySQL en modo seguro
En una terminal, ejecuta:
```bash
sudo mysqld_safe --skip-grant-tables --skip-networking &
```

**⚠️ IMPORTANTE:** Deja esta terminal abierta y abre una **NUEVA terminal**.

#### Paso 3: Conectar sin contraseña
En la **NUEVA terminal**, ejecuta:
```bash
mysql -u root
```

#### Paso 4: Cambiar la contraseña
En MySQL, ejecuta estos comandos:
```sql
USE mysql;
ALTER USER 'root'@'localhost' IDENTIFIED BY 'nueva_password123';
FLUSH PRIVILEGES;
EXIT;
```

#### Paso 5: Detener MySQL en modo seguro
En la primera terminal, presiona `Ctrl+C` o ejecuta:
```bash
sudo pkill mysqld
```

#### Paso 6: Reiniciar MySQL normalmente
```bash
brew services start mysql
```

#### Paso 7: Probar la nueva contraseña
```bash
mysql -u root -p
# Ingresa: nueva_password123
```

---

## Opción Alternativa: Usar MySQL Workbench

Si tienes MySQL Workbench instalado:

1. Abre MySQL Workbench
2. Intenta conectarte (puede que funcione sin contraseña o con una guardada)
3. Si puedes conectarte:
   - Ve a "Server" > "Users and Privileges"
   - Selecciona el usuario "root"
   - Cambia la contraseña
   - O crea un nuevo usuario para NEXORY

---

## Después de Resetear la Contraseña

### 1. Actualiza el archivo `.env`
```bash
cd nexory-backend
nano .env
# O usa tu editor favorito
```

Cambia:
```env
DB_PASSWORD=nueva_password123
```

### 2. Crea la base de datos
```bash
mysql -u root -p < database/schema.sql
# Ingresa la nueva contraseña
```

### 3. Inserta datos iniciales (opcional)
```bash
mysql -u root -p < database/seed.sql
```

### 4. Inicia el servidor backend
```bash
npm run dev
```

---

## Si Nada Funciona: Reinstalar MySQL

Como último recurso:

```bash
# Desinstalar
brew services stop mysql
brew uninstall mysql

# Reinstalar
brew install mysql
brew services start mysql
```

Después de reinstalar, MySQL generalmente **no tiene contraseña** inicialmente, así que puedes:
1. Conectarte con `mysql -u root` (sin contraseña)
2. Crear una contraseña nueva con los comandos SQL de arriba

---

## Crear Usuario Específico para NEXORY (Recomendado)

Una vez que puedas acceder, crea un usuario dedicado:

```sql
CREATE USER 'nexory_user'@'localhost' IDENTIFIED BY 'nexory_password123';
GRANT ALL PRIVILEGES ON nexory_db.* TO 'nexory_user'@'localhost';
FLUSH PRIVILEGES;
```

Luego actualiza `.env`:
```env
DB_USER=nexory_user
DB_PASSWORD=nexory_password123
```

Esto es más seguro que usar root.
