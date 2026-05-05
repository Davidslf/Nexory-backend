# 🔐 Resetear Contraseña MySQL - Instrucciones Inmediatas

## ⚡ Método Rápido (Ejecuta estos comandos en orden)

### Paso 1: Detener MySQL
```bash
brew services stop mysql
```

### Paso 2: Iniciar MySQL en modo seguro
**IMPORTANTE:** Este comando debe ejecutarse y dejarse corriendo. Abre una NUEVA terminal después.

```bash
sudo mysqld_safe --skip-grant-tables --skip-networking
```

**Deja esta terminal abierta** y abre una **NUEVA terminal** (Cmd+T o nueva ventana).

### Paso 3: En la NUEVA terminal, conectar sin contraseña
```bash
mysql -u root
```

### Paso 4: Cambiar la contraseña (dentro de MySQL)
```sql
USE mysql;
ALTER USER 'root'@'localhost' IDENTIFIED BY 'nexory123';
FLUSH PRIVILEGES;
EXIT;
```

### Paso 5: Volver a la primera terminal y detener MySQL
Presiona `Ctrl+C` en la terminal donde está corriendo `mysqld_safe`

### Paso 6: Reiniciar MySQL normalmente
```bash
brew services start mysql
```

### Paso 7: Probar la nueva contraseña
```bash
mysql -u root -p
# Ingresa: nexory123
```

---

## ✅ Después de Resetear

### 1. Actualizar .env
```bash
cd nexory-backend
nano .env
```

Cambia:
```env
DB_PASSWORD=nexory123
```

### 2. Crear la base de datos
```bash
mysql -u root -p < database/schema.sql
# Contraseña: nexory123
```

### 3. Insertar datos iniciales
```bash
mysql -u root -p < database/seed.sql
# Contraseña: nexory123
```

---

## 🆘 Si el Método Anterior No Funciona

### Alternativa: Crear Usuario Nuevo (si puedes acceder de alguna forma)

Si tienes MySQL Workbench o alguna otra forma de acceder:

```sql
CREATE USER 'nexory_user'@'localhost' IDENTIFIED BY 'nexory123';
GRANT ALL PRIVILEGES ON nexory_db.* TO 'nexory_user'@'localhost';
FLUSH PRIVILEGES;
```

Luego en `.env`:
```env
DB_USER=nexory_user
DB_PASSWORD=nexory123
```

---

## 📝 Nota sobre la Contraseña

La contraseña que usaremos es: **nexory123**

Puedes cambiarla después si quieres. Por ahora, esta es la más simple para empezar.
