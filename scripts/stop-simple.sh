#!/bin/bash

# Script para detener MIES Conservación
# Uso: ./stop-simple.sh

# Cambiar al directorio raíz del proyecto
cd "$(dirname "$0")/.."

echo "⏹️  Deteniendo MIES Conservación..."

if [ -f "logs/server.pid" ]; then
    PID=$(cat logs/server.pid)
    if ps -p $PID > /dev/null 2>&1; then
        kill $PID
        echo "✅ Servidor detenido (PID: $PID)"
        rm logs/server.pid
    else
        echo "⚠️  El proceso con PID $PID no está ejecutándose"
        rm logs/server.pid
    fi
else
    echo "⚠️  Archivo PID no encontrado"
    # Intentar matar todos los procesos bun que ejecuten src/server.ts
    pkill -f "bun run src/server.ts"
    if [ $? -eq 0 ]; then
        echo "✅ Procesos de servidor detenidos"
    else
        echo "⚠️  No se encontraron procesos de servidor ejecutándose"
    fi
fi
