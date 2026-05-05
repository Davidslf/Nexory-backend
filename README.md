# NEXORY Backend API

Backend API para el sistema de gestión de ISP NEXORY.

## 🚀 Inicio Rápido

### Prerrequisitos

- Node.js 18+ 
- MySQL 8.0+
- npm o yarn

### Instalación

1. **Instalar dependencias:**
```bash
npm install
```

2. **Configurar variables de entorno:**
```bash
cp .env.example .env
```

Edita el archivo `.env` con tus credenciales de MySQL:
```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=tu_password
DB_NAME=nexory_db
JWT_SECRET=tu_secret_key_super_segura
```

3. **Crear la base de datos:**
```bash
mysql -u root -p < database/schema.sql
```

4. **Ejecutar seed (opcional):**
```bash
mysql -u root -p < database/seed.sql
```

5. **Iniciar el servidor:**
```bash
# Desarrollo (con hot reload)
npm run dev

# Producción
npm run build
npm start
```

## 📁 Estructura del Proyecto

```
nexory-backend/
├── src/
│   ├── config/          # Configuración (DB, env)
│   ├── controllers/     # Lógica de negocio
│   ├── middleware/      # Middleware (auth, errors, cors)
│   ├── models/         # Modelos de datos (si usas ORM)
│   ├── routes/          # Definición de rutas
│   ├── types/          # Tipos TypeScript
│   ├── utils/          # Utilidades (JWT, password, etc.)
│   └── app.ts          # Aplicación principal
├── database/
│   ├── schema.sql      # Esquema de base de datos
│   └── seed.sql        # Datos iniciales
├── .env.example        # Ejemplo de variables de entorno
└── package.json
```

## 🔌 Endpoints API

### Autenticación
- `POST /api/auth/login` - Iniciar sesión
- `GET /api/auth/me` - Obtener usuario actual

### Clientes
- `GET /api/clients` - Listar clientes (con filtros)
- `GET /api/clients/:id` - Obtener cliente por ID
- `PATCH /api/clients/:id/status` - Cambiar estado del cliente (admin only)

### Dashboard
- `GET /api/dashboard/stats` - Obtener estadísticas
- `GET /api/dashboard/activities` - Obtener actividades recientes

### Routers
- `GET /api/routers` - Listar routers
- `GET /api/routers/:id` - Obtener router por ID
- `PATCH /api/routers/:id/status` - Cambiar estado del router (admin only)

### Soporte Técnico
- `GET /api/support` - Listar tickets de soporte
- `GET /api/support/:id` - Obtener ticket por ID
- `PATCH /api/support/:id/status` - Actualizar estado del ticket

### Notificaciones
- `GET /api/notifications` - Obtener notificaciones
- `PATCH /api/notifications/:id/read` - Marcar como leída
- `PATCH /api/notifications/read-all` - Marcar todas como leídas

### Facturación
- `GET /api/billing` - Obtener datos de facturación (admin only)

📖 Ver [API.md](./API.md) para documentación completa de la API

## 🔐 Autenticación

Las rutas protegidas requieren un token JWT en el header:
```
Authorization: Bearer <token>
```

## 🗄️ Base de Datos

El esquema incluye las siguientes tablas:
- `users` - Usuarios del sistema
- `clients` - Clientes
- `client_tags` - Tags de clientes
- `routers` - Routers
- `technical_supports` - Soporte técnico
- `notifications` - Notificaciones
- `activities` - Logs de actividades
- `billing_data` - Datos de facturación
- `client_metrics` - Métricas de clientes

## 🛠️ Scripts Disponibles

- `npm run dev` - Inicia el servidor en modo desarrollo
- `npm run build` - Compila TypeScript a JavaScript
- `npm start` - Inicia el servidor en producción
- `npm run db:migrate` - Ejecuta migraciones (si las hay)

## 📝 Notas

- El servidor corre en el puerto 3000 por defecto
- Asegúrate de que MySQL esté corriendo antes de iniciar el servidor
- Para producción, cambia `JWT_SECRET` a una clave segura y aleatoria
