#!/bin/bash

echo "🔐 Script para Resetear Contraseña de MySQL"
echo "=============================================="
echo ""

# Detener MySQL
echo "1️⃣  Deteniendo MySQL..."
brew services stop mysql

echo ""
echo "2️⃣  Iniciando MySQL en modo seguro..."
echo "   (Esto iniciará MySQL sin verificación de permisos)"
echo ""
echo "⚠️  IMPORTANTE: Deja esta terminal abierta y abre una NUEVA terminal"
echo "   Luego ejecuta: mysql -u root"
echo ""
echo "Presiona Enter cuando estés listo para continuar..."
read

# Iniciar MySQL en modo seguro
sudo mysqld_safe --skip-grant-tables --skip-networking &

echo ""
echo "✅ MySQL iniciado en modo seguro"
echo ""
echo "📝 Ahora en la NUEVA terminal, ejecuta:"
echo "   mysql -u root"
echo ""
echo "Luego ejecuta estos comandos SQL:"
echo "   USE mysql;"
echo "   ALTER USER 'root'@'localhost' IDENTIFIED BY 'nueva_password123';"
echo "   FLUSH PRIVILEGES;"
echo "   EXIT;"
echo ""
echo "Cuando termines, presiona Enter aquí para detener MySQL en modo seguro..."
read

# Detener MySQL en modo seguro
echo ""
echo "🛑 Deteniendo MySQL en modo seguro..."
sudo pkill mysqld
sleep 2

# Reiniciar MySQL normalmente
echo "🔄 Reiniciando MySQL normalmente..."
brew services start mysql
sleep 3

echo ""
echo "✅ MySQL reiniciado"
echo ""
echo "🧪 Prueba la nueva contraseña con:"
echo "   mysql -u root -p"
echo "   (Contraseña: nueva_password123)"
echo ""
echo "📝 No olvides actualizar tu archivo .env con la nueva contraseña!"
