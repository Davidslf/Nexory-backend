# 🔧 Resetear Contraseña con MySQL Workbench

## ✅ Método: Usar MySQL Workbench

### Paso 1: Abrir MySQL Workbench
1. Abre **MySQL Workbench** desde Aplicaciones
2. Busca conexiones existentes en la pantalla principal

### Paso 2: Intentar Conectar
1. Si hay una conexión guardada, haz doble clic
2. Si te pide contraseña, intenta:
   - Dejar en blanco
   - Tu contraseña de macOS
   - O cualquier contraseña que hayas usado antes

### Paso 3: Si Puedes Conectarte
Una vez dentro de MySQL Workbench:

1. Ve al menú: **Server** → **Users and Privileges**
2. En la lista de usuarios, selecciona **root**
3. Haz clic en la pestaña **Account Limits** o busca el campo de contraseña
4. Haz clic en **Change Password**
5. Ingresa la nueva contraseña: `nexory123`
6. Confirma la contraseña
7. Haz clic en **Apply**

### Paso 4: Si NO Puedes Conectarte

#### Opción A: Crear Nueva Conexión
1. En MySQL Workbench, haz clic en el **+** junto a "MySQL Connections"
2. Configura:
   - **Connection Name:** NEXORY Local
   - **Hostname:** localhost
   - **Port:** 3306
   - **Username:** root
   - **Password:** (deja en blanco o prueba contraseñas comunes)
3. Haz clic en **Test Connection**
4. Si funciona, guarda y conéctate

#### Opción B: Usar el Usuario del Sistema
Si MySQL Workbench no puede conectarse con root, intenta crear un usuario nuevo desde la terminal usando el método alternativo.

---

## 🔄 Método Alternativo: Crear Usuario Nuevo

Si no puedes resetear root, podemos crear un usuario nuevo. Primero necesitamos detener el MySQL de Homebrew y usar el que está corriendo:

### Paso 1: Detener MySQL de Homebrew
```bash
brew services stop mysql
```

### Paso 2: Verificar qué MySQL está corriendo
El que está corriendo es: `/usr/local/mysql/bin/mysqld`

### Paso 3: Intentar conectar con diferentes métodos
```bash
# Intentar sin contraseña
mysql -u root

# Intentar con socket
mysql -u root --socket=/tmp/mysql.sock

# Intentar con el path completo
/usr/local/mysql/bin/mysql -u root
```

---

## 🎯 Solución Recomendada

**Usa MySQL Workbench** - Es la forma más fácil:

1. Abre MySQL Workbench
2. Intenta conectarte (puede que funcione sin contraseña o con una guardada)
3. Si puedes conectarte, cambia la contraseña desde la interfaz
4. Si no puedes, crea un usuario nuevo desde Workbench

---

## 📝 Después de Cambiar la Contraseña

1. Actualiza `.env`:
```env
DB_PASSWORD=nexory123
```

2. Crea la base de datos:
```bash
mysql -u root -p < database/schema.sql
```

3. Inserta datos iniciales:
```bash
mysql -u root -p < database/seed.sql
```
