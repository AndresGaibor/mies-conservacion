#!/bin/bash

# Script de estado para MIES Conservación
# Uso: ./status.sh

# Cambiar al directorio raíz del proyecto
cd "$(dirname "$0")/.."

echo "📊 Estado de MIES Conservación"
echo "=============================="

if [ -f "logs/server.pid" ]; then
    PID=$(cat logs/server.pid)
    if ps -p $PID > /dev/null 2>&1; then
        echo "✅ Servidor ejecutándose"
        echo "   PID: $PID"
        echo "   Puerto: 3001"
        echo "   URL: http://localhost:3001"
        
        # Verificar si el puerto está escuchando
        if lsof -i :3001 >/dev/null 2>&1; then
            echo "   Estado: 🟢 Activo y escuchando"
        else
            echo "   Estado: 🟡 Proceso ejecutándose pero puerto no disponible"
        fi
        
        # Mostrar uso de memoria
        if command -v ps &> /dev/null; then
            MEM=$(ps -o pid,pcpu,pmem,comm -p $PID | tail -1)
            echo "   Recursos: $MEM"
        fi
    else
        echo "❌ Proceso no encontrado (PID: $PID)"
        rm logs/server.pid
    fi
else
    echo "❌ Servidor no está ejecutándose"
fi

echo ""
echo "📁 Archivos de log:"
if [ -f "logs/out.log" ]; then
    SIZE=$(wc -l < logs/out.log)
    echo "   📋 out.log: $SIZE líneas"
else
    echo "   📋 out.log: No existe"
fi

if [ -f "logs/error.log" ]; then
    SIZE=$(wc -l < logs/error.log)
    echo "   ❌ error.log: $SIZE líneas"
    if [ $SIZE -gt 0 ]; then
        echo "      Últimos errores:"
        tail -3 logs/error.log | sed 's/^/      /'
    fi
else
    echo "   ❌ error.log: No existe"
fi

echo ""
echo "💡 Comandos disponibles:"
echo "   ./start-simple.sh  - Iniciar servidor"
echo "   ./stop-simple.sh   - Detener servidor"
echo "   tail -f logs/out.log    - Ver logs en tiempo real"
echo "   tail -f logs/error.log  - Ver errores en tiempo real"
