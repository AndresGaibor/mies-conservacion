#!/bin/bash

# Script de monitoreo para MIES Conservación
# Uso: ./monitor.sh

# Cambiar al directorio raíz del proyecto
cd "$(dirname "$0")/.."

echo "🔍 Monitor de MIES Conservación"
echo "================================"

# Función para mostrar información del sistema
show_system_info() {
    echo "📊 Información del Sistema:"
    echo "  CPU: $(top -l 1 | grep "CPU usage" | awk '{print $3}' | sed 's/%//')"
    echo "  Memoria: $(vm_stat | grep "Pages free" | awk '{print $3}' | sed 's/\.//')KB libres"
    echo "  Disco: $(df -h / | awk 'NR==2{print $5}') usado"
    echo ""
}

# Función para mostrar estado de PM2
show_pm2_status() {
    echo "🚀 Estado de PM2:"
    pm2 status
    echo ""
}

# Función para mostrar logs recientes
show_recent_logs() {
    echo "📋 Logs Recientes (últimas 10 líneas):"
    echo "======================================"
    if [ -f "./logs/out.log" ]; then
        tail -10 ./logs/out.log
    else
        echo "No hay logs disponibles aún."
    fi
    echo ""
}

# Función para mostrar estadísticas de la aplicación
show_app_stats() {
    echo "📈 Estadísticas de la Aplicación:"
    echo "================================="
    
    # Verificar si el puerto está escuchando
    if lsof -i :3001 >/dev/null 2>&1; then
        echo "✅ Servidor ejecutándose en puerto 3001"
    else
        echo "❌ Servidor NO está ejecutándose en puerto 3001"
    fi
    
    # Verificar logs de errores
    if [ -f "./logs/error.log" ]; then
        ERROR_COUNT=$(wc -l < ./logs/error.log)
        echo "⚠️  Errores registrados: $ERROR_COUNT"
        if [ $ERROR_COUNT -gt 0 ]; then
            echo "   Últimos errores:"
            tail -3 ./logs/error.log | sed 's/^/   /'
        fi
    fi
    
    echo ""
}

# Loop principal
while true; do
    clear
    echo "$(date)"
    echo ""
    
    show_system_info
    show_pm2_status
    show_app_stats
    show_recent_logs
    
    echo "💡 Comandos disponibles:"
    echo "   r - Reiniciar aplicación"
    echo "   l - Ver logs en tiempo real"
    echo "   s - Detener aplicación"
    echo "   q - Salir del monitor"
    echo ""
    
    read -t 10 -n 1 -s input
    
    case $input in
        r|R)
            echo "🔄 Reiniciando aplicación..."
            pm2 restart mies-conservacion
            sleep 2
            ;;
        l|L)
            echo "📋 Mostrando logs en tiempo real (Ctrl+C para volver)..."
            pm2 logs mies-conservacion
            ;;
        s|S)
            echo "⏹️  Deteniendo aplicación..."
            pm2 stop mies-conservacion
            sleep 2
            ;;
        q|Q)
            echo "👋 Saliendo del monitor..."
            exit 0
            ;;
    esac
done
