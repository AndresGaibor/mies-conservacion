#!/bin/bash

# Script de inicio simple para MIES Conservación
# Uso: ./start-simple.sh

# Cambiar al directorio raíz del proyecto
cd "$(dirname "$0")/.."

echo "🚀 Iniciando MIES Conservación..."

# Crear directorio de logs si no existe
mkdir -p logs

# Compilar frontend
echo "📦 Compilando frontend..."
cd public && bun build src/app.ts --outfile app.js --target browser && bun build src/desktop.ts --outfile desktop.js --target browser
cd ..

# Verificar que el archivo .env existe
if [ ! -f ".env" ]; then
    echo "⚠️  Archivo .env no encontrado, copiando desde .env.example..."
    cp .env.example .env
    echo "🔧 Por favor, edita .env y agrega tu GEMINI_API_KEY"
fi

# Iniciar el servidor en segundo plano
echo "🔄 Iniciando servidor..."
nohup bun run src/server.ts > logs/out.log 2> logs/error.log &

# Guardar el PID
echo $! > logs/server.pid

echo "✅ Servidor iniciado exitosamente!"
echo "🌐 URL: http://localhost:3001"
echo "📋 Logs: tail -f logs/out.log"
echo "❌ Errores: tail -f logs/error.log"
echo "⏹️  Detener: ./stop-simple.sh"

# Mostrar los últimos logs
echo ""
echo "📊 Estado del servidor:"
sleep 2
if ps -p $(cat logs/server.pid) > /dev/null 2>&1; then
    echo "✅ Servidor ejecutándose con PID: $(cat logs/server.pid)"
else
    echo "❌ Error al iniciar el servidor. Revisa logs/error.log"
    cat logs/error.log
fi
