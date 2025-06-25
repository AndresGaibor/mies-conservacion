#!/bin/bash

# Script de inicio rápido para MIES Conservación con PM2
# Uso: ./start-pm2.sh [environment]

# Cambiar al directorio raíz del proyecto
cd "$(dirname "$0")/.."

ENVIRONMENT=${1:-production}

echo "🚀 Iniciando MIES Conservación con PM2..."
echo "📝 Ambiente: $ENVIRONMENT"

# Verificar que PM2 esté instalado
if ! command -v pm2 &> /dev/null; then
    echo "❌ PM2 no está instalado. Instalando..."
    npm install -g pm2
fi

# Compilar frontend
echo "📦 Compilando frontend..."
cd public && bun build src/app.ts --outfile app.js --target browser && bun build src/desktop.ts --outfile desktop.js --target browser
cd ..

# Crear directorio de logs si no existe
mkdir -p logs

# Iniciar con PM2
echo "🔄 Iniciando aplicación con PM2..."
pm2 start ecosystem.config.cjs --env $ENVIRONMENT

# Mostrar estado
echo "📊 Estado de la aplicación:"
pm2 status

# Mostrar logs
echo "📋 Logs de la aplicación (Ctrl+C para salir):"
pm2 logs mies-conservacion --lines 20

echo ""
echo "✅ Aplicación iniciada exitosamente!"
echo "🌐 URL: http://localhost:3001"
echo ""
echo "💡 Comandos útiles:"
echo "   pm2 status                    - Ver estado"
echo "   pm2 logs mies-conservacion    - Ver logs"
echo "   pm2 restart mies-conservacion - Reiniciar"
echo "   pm2 stop mies-conservacion    - Detener"
echo "   pm2 delete mies-conservacion  - Eliminar"
