#!/bin/bash
# ─────────────────────────────────────────────────────────────
# setup-mac.sh — Nexory Backend · Mac nueva desde cero
# Corre este script UNA sola vez en una Mac nueva.
# ─────────────────────────────────────────────────────────────

set -e  # Detener si algo falla

echo ""
echo "════════════════════════════════════════"
echo "  Nexory Backend — Setup inicial (Mac)"
echo "════════════════════════════════════════"
echo ""

# ── 1. Homebrew ───────────────────────────────────────────────
if ! command -v brew &>/dev/null; then
  echo "▶ Instalando Homebrew..."
  /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
  # Agregar brew al PATH (Apple Silicon)
  echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> ~/.zprofile
  eval "$(/opt/homebrew/bin/brew shellenv)"
else
  echo "✓ Homebrew ya instalado ($(brew --version | head -1))"
fi

# ── 2. Node.js 20 ─────────────────────────────────────────────
if ! command -v node &>/dev/null || [[ $(node --version | cut -d. -f1 | tr -d v) -lt 20 ]]; then
  echo "▶ Instalando Node.js 20..."
  brew install node@20
  echo 'export PATH="/opt/homebrew/opt/node@20/bin:$PATH"' >> ~/.zprofile
  export PATH="/opt/homebrew/opt/node@20/bin:$PATH"
else
  echo "✓ Node.js ya instalado ($(node --version))"
fi

# ── 3. PostgreSQL 16 ──────────────────────────────────────────
if ! command -v psql &>/dev/null; then
  echo "▶ Instalando PostgreSQL 16..."
  brew install postgresql@16
  echo 'export PATH="/opt/homebrew/opt/postgresql@16/bin:$PATH"' >> ~/.zprofile
  export PATH="/opt/homebrew/opt/postgresql@16/bin:$PATH"
else
  echo "✓ PostgreSQL ya instalado"
fi

# Iniciar PostgreSQL como servicio
echo "▶ Iniciando PostgreSQL..."
brew services start postgresql@16
sleep 2  # Esperar a que arranque

# ── 4. Crear base de datos ────────────────────────────────────
echo "▶ Creando base de datos 'nexory_db'..."
psql postgres -c "CREATE DATABASE nexory_db;" 2>/dev/null || echo "  (la base de datos ya existe, continuando...)"

# ── 5. Variables de entorno ───────────────────────────────────
if [ ! -f .env ]; then
  echo "▶ Creando archivo .env desde .env.example..."
  cp .env.example .env
  # Agregar DATABASE_URL al .env
  echo "" >> .env
  echo "# Base de datos PostgreSQL" >> .env
  echo 'DATABASE_URL="postgresql://'"$USER"':@localhost:5432/nexory_db"' >> .env
  echo ""
  echo "  ⚠️  Abre .env y ajusta los valores si es necesario:"
  echo "     JWT_SECRET → cambia por una clave segura"
  echo "     DATABASE_URL → ajusta usuario/contraseña si aplica"
  echo ""
else
  echo "✓ .env ya existe"
fi

# ── 6. Dependencias npm ───────────────────────────────────────
echo "▶ Instalando dependencias npm..."
npm install

# ── 7. Aplicar esquema de base de datos ──────────────────────
echo "▶ Aplicando esquema Prisma a la base de datos..."
npx prisma db push

# ── 8. Seed (datos de prueba) ─────────────────────────────────
echo ""
read -p "¿Cargar datos de prueba? (recomendado para primera vez) [s/N]: " seed
if [[ "$seed" =~ ^[sS]$ ]]; then
  npx prisma db seed 2>/dev/null || echo "  (seed no configurado, omitiendo)"
fi

echo ""
echo "════════════════════════════════════════"
echo "  ✅ Backend listo"
echo ""
echo "  Para correrlo:"
echo "    npm run dev"
echo ""
echo "  Corre en → http://localhost:3000"
echo "════════════════════════════════════════"
echo ""
