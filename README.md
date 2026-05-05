# Nexory — Backend

API REST para el sistema de gestión de ISP Nexory.  
**Stack:** Node.js 20 · Express · TypeScript · PostgreSQL · Prisma ORM · JWT

---

## Setup en Mac nueva (desde cero)

Si la Mac no tiene nada instalado, este script lo hace todo automáticamente:

```bash
bash setup-mac.sh
```

Instala: Homebrew → Node.js 20 → PostgreSQL 16 → crea la BD → genera el `.env` → instala dependencias → aplica el esquema Prisma.

Solo se corre **una vez**.

---

## Setup manual (paso a paso)

### 1 — Instalar Homebrew

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

### 2 — Instalar Node.js 20

```bash
brew install node@20
```

Verificar:

```bash
node --version   # debe mostrar v20.x.x
npm --version
```

### 3 — Instalar PostgreSQL 16

```bash
brew install postgresql@16
brew services start postgresql@16
```

### 4 — Crear la base de datos

```bash
psql postgres -c "CREATE DATABASE nexory_db;"
```

### 5 — Configurar variables de entorno

```bash
cp .env.example .env
```

Editar el `.env` con tu editor:

```env
PORT=3000
NODE_ENV=development
JWT_SECRET=cambia_esto_por_algo_seguro
JWT_EXPIRES_IN=24h
FRONTEND_URL=http://localhost:5001

DATABASE_URL="postgresql://TU_USUARIO:TU_PASSWORD@localhost:5432/nexory_db"

# MikroTik (opcional si no tienes router)
MIKROTIK_HOST=192.168.1.1
MIKROTIK_USER=admin
MIKROTIK_PASS=
MIKROTIK_PORT=8728

# WAHA — WhatsApp (opcional)
WAHA_BASE_URL=http://localhost:3010
WAHA_API_KEY=
WAHA_SESSION=nexory
```

> Para `DATABASE_URL`: si instalaste PostgreSQL con Homebrew sin contraseña, el formato es:
> `postgresql://TU_USUARIO_DE_MAC:@localhost:5432/nexory_db`

### 6 — Instalar dependencias

```bash
npm install
```

### 7 — Aplicar esquema a la base de datos

```bash
npx prisma db push
```

### 8 — Correr el servidor

```bash
npm run dev
```

Corre en → `http://localhost:3000`

---

## Comandos útiles

```bash
# Correr en desarrollo (hot reload)
npm run dev

# Compilar para producción
npm run build
npm start

# Ver y editar la BD visualmente
npx prisma studio
# → http://localhost:5555

# Aplicar cambios al esquema (después de editar schema.prisma)
npx prisma db push

# Detener / iniciar PostgreSQL
brew services stop postgresql@16
brew services start postgresql@16
```

---

## Estructura

```
nexory-backend/
├── prisma/
│   ├── schema.prisma       # Esquema de la BD (fuente de verdad)
│   └── seed.ts             # Datos iniciales
├── src/
│   ├── config/             # Configuración (env, DB)
│   ├── controllers/        # Lógica de cada módulo
│   ├── middleware/         # Auth JWT, CORS, errores
│   ├── routes/             # Definición de rutas
│   ├── services/           # Servicios externos (MikroTik, WAHA)
│   └── app.ts              # Entrada principal
├── .env.example            # Plantilla de variables de entorno
├── setup-mac.sh            # Script de instalación automática
└── package.json
```

---

## Puertos

| Servicio       | Puerto |
|----------------|--------|
| Backend API    | 3000   |
| Prisma Studio  | 5555   |
| WAHA WhatsApp  | 3010   |

---

## Roles de usuario

| Rol        | Acceso |
|------------|--------|
| `admin`    | Todo: clientes, soporte, cortes, comunicados, configuración |
| `operator` | Soporte y clientes (sin configuración ni comunicados masivos) |
