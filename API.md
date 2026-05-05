# NEXORY API Documentation

## Base URL
```
http://localhost:3000/api
```

## Autenticación

La mayoría de los endpoints requieren autenticación mediante JWT token en el header:
```
Authorization: Bearer <token>
```

## Endpoints

### Autenticación

#### POST /auth/login
Iniciar sesión

**Request:**
```json
{
  "email": "admin@nexory.com",
  "password": "admin123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "token": "jwt_token_here",
    "user": {
      "id": "1",
      "email": "admin@nexory.com",
      "name": "Administrador",
      "role": "admin"
    }
  }
}
```

#### GET /auth/me
Obtener usuario actual (requiere autenticación)

---

### Clientes

#### GET /clients
Listar clientes con filtros opcionales

**Query Parameters:**
- `search` - Buscar por nombre, cédula o plan
- `status` - Filtrar por estado (active, suspended, pending, all)
- `plan` - Filtrar por plan

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "1",
      "name": "Juan Pérez",
      "document_id": "12345678-9",
      "plan": "Fibra 200MB",
      "status": "active",
      "tags": ["VIP", "Residencial"],
      ...
    }
  ]
}
```

#### GET /clients/:id
Obtener cliente por ID

#### PATCH /clients/:id/status
Cambiar estado del cliente (admin only)

**Request:**
```json
{
  "status": "suspended" // o "active"
}
```

---

### Dashboard

#### GET /dashboard/stats
Obtener estadísticas del dashboard

**Response:**
```json
{
  "success": true,
  "data": {
    "total_clients": 10,
    "online_clients": 7,
    "suspended_clients": 3,
    "monthly_revenue": 125000,
    "average_latency": 12,
    "network_uptime": 99.92,
    "total_bandwidth": 2190,
    "active_routers": 3,
    "total_routers": 5,
    "revenue_growth": 3.2,
    "client_growth": 2.5
  }
}
```

#### GET /dashboard/activities
Obtener actividades recientes

**Query Parameters:**
- `limit` - Número de resultados (default: 50)

---

### Routers

#### GET /routers
Listar routers

**Query Parameters:**
- `status` - Filtrar por estado (online, offline, maintenance, all)
- `location` - Buscar por ubicación

#### GET /routers/:id
Obtener router por ID

#### PATCH /routers/:id/status
Cambiar estado del router (admin only)

**Request:**
```json
{
  "status": "online" // online, offline, maintenance
}
```

---

### Soporte Técnico

#### GET /support
Listar tickets de soporte

**Query Parameters:**
- `status` - Filtrar por estado (pending, in_progress, reviewed, resolved, cancelled, all)
- `type` - Filtrar por tipo (installation, failure, removal, all)
- `search` - Buscar por cliente, cédula, dirección o falla

#### GET /support/:id
Obtener ticket por ID

#### PATCH /support/:id/status
Actualizar estado del ticket

**Request:**
```json
{
  "status": "in_progress",
  "assigned_to": "user_id",
  "notes": "Técnico asignado"
}
```

---

### Notificaciones

#### GET /notifications
Obtener notificaciones del usuario actual

**Query Parameters:**
- `read` - Filtrar por leídas (true/false)

#### PATCH /notifications/:id/read
Marcar notificación como leída

#### PATCH /notifications/read-all
Marcar todas las notificaciones como leídas

---

### Facturación

#### GET /billing
Obtener datos de facturación (admin only)

**Query Parameters:**
- `limit` - Número de meses (default: 12)

---

## Códigos de Estado HTTP

- `200` - Éxito
- `201` - Creado
- `400` - Solicitud incorrecta
- `401` - No autenticado
- `403` - Prohibido (sin permisos)
- `404` - No encontrado
- `500` - Error del servidor

## Formato de Respuesta

Todas las respuestas siguen este formato:

**Éxito:**
```json
{
  "success": true,
  "data": { ... }
}
```

**Error:**
```json
{
  "success": false,
  "error": "Mensaje de error"
}
```
