# Guía de Configuración - NEXORY Backend

## Pasos de Instalación

### 1. Instalar Dependencias
```bash
cd nexory-backend
npm install
```

### 2. Configurar Variables de Entorno

Copia el archivo de ejemplo y edítalo:
```bash
cp .env.example .env
```

Edita `.env` con tus credenciales:
```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=tu_password_aqui
DB_NAME=nexory_db

PORT=3000
NODE_ENV=development

JWT_SECRET=tu_secret_key_super_segura_cambiar_en_produccion
JWT_EXPIRES_IN=24h

FRONTEND_URL=http://localhost:5001
```

### 3. Crear la Base de Datos

Abre MySQL y ejecuta:
```bash
mysql -u root -p < database/schema.sql
```

O desde MySQL Workbench/CLI:
```sql
source database/schema.sql;
```

### 4. Insertar Datos Iniciales (Opcional)

```bash
mysql -u root -p < database/seed.sql
```

Esto creará usuarios por defecto:
- **Admin:** admin@nexory.com / admin123
- **Operador:** operator@nexory.com / operator123

⚠️ **IMPORTANTE:** Cambia estos passwords en producción.

### 5. Iniciar el Servidor

**Desarrollo (con hot reload):**
```bash
npm run dev
```

**Producción:**
```bash
npm run build
npm start
```

El servidor estará disponible en `http://localhost:3000`

### 6. Verificar que Funciona

```bash
curl http://localhost:3000/health
```

Deberías recibir:
```json
{
  "success": true,
  "message": "NEXORY API is running",
  "timestamp": "..."
}
```

## Solución de Problemas

### Error de Conexión a MySQL

1. Verifica que MySQL esté corriendo:
```bash
mysql -u root -p
```

2. Verifica las credenciales en `.env`

3. Verifica que la base de datos exista:
```sql
SHOW DATABASES;
```

### Error de Puerto en Uso

Si el puerto 3000 está ocupado, cambia `PORT` en `.env`

### Error de JWT

Asegúrate de que `JWT_SECRET` esté configurado en `.env`

## Próximos Pasos

1. Conectar el frontend con el backend
2. Actualizar las URLs en el frontend para apuntar a `http://localhost:3000/api`
3. Probar los endpoints con Postman o similar
4. Agregar más datos de prueba si es necesario
