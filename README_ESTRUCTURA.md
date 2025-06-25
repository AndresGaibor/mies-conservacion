# MIES Conservación - Estructura del Proyecto

## 📁 Estructura de Carpetas

```
mies-conservacion/
├── 📂 src/                          # Código fuente del servidor
│   ├── 📄 server.ts                 # Servidor Express principal
│   ├── 📄 index.ts                  # CLI para procesamiento batch
│   ├── 📂 services/                 # Servicios de la aplicación
│   │   └── 📄 imageProcessor.ts     # Procesador de imágenes con IA
│   └── 📂 types/                    # Definiciones de tipos TypeScript
│       └── 📄 heic-convert.d.ts     # Tipos para heic-convert
├── 📂 public/                       # Archivos del frontend
│   ├── 📄 index.html               # Página principal
│   ├── 📄 app.js                   # JavaScript compilado (generado)
│   ├── 📄 styles.css               # Estilos CSS
│   ├── 📄 manifest.json            # Manifest para PWA
│   ├── 📂 src/                     # Código fuente del frontend
│   │   └── 📄 app.ts               # TypeScript del frontend
│   └── 📂 processed/               # Imágenes procesadas (público)
├── 📂 scripts/                     # Scripts de automatización
│   ├── 📄 start-simple.sh          # Inicio simple con nohup
│   ├── 📄 start-pm2.sh             # Inicio con PM2
│   ├── 📄 stop-simple.sh           # Detener servidor simple
│   ├── 📄 status.sh                # Estado del servidor
│   └── 📄 monitor.sh               # Monitor de archivos
├── 📂 fotos/                       # Imágenes originales
├── 📂 fotos_resultado/             # Imágenes procesadas (servidor)
├── 📂 logs/                        # Archivos de log
│   ├── 📄 out.log                 # Logs de salida
│   ├── 📄 error.log               # Logs de errores
│   └── 📄 server.pid              # PID del servidor
├── 📂 dist/                        # Archivos compilados (generado)
├── 📄 package.json                 # Dependencias y scripts npm
├── 📄 tsconfig.json                # Configuración TypeScript
├── 📄 ecosystem.config.cjs         # Configuración PM2
├── 📄 bun.lock                     # Lock file de Bun
├── 📄 .env                         # Variables de entorno
└── 📄 .env.example                 # Ejemplo de variables de entorno
```

## 🚀 Scripts Disponibles

### Desarrollo
```bash
bun run dev                    # Iniciar servidor en modo desarrollo
bun run build                  # Compilar proyecto
bun run build-frontend         # Compilar solo frontend
```

### Producción
```bash
bun run start                  # Iniciar servidor
npm run start-daemon           # Iniciar como daemon (scripts/start-simple.sh)
npm run stop-daemon            # Detener daemon
npm run status-daemon          # Ver estado del daemon
```

### PM2 (Recomendado para producción)
```bash
bun run pm2:start             # Iniciar con PM2
bun run pm2:stop              # Detener PM2
bun run pm2:restart           # Reiniciar PM2
bun run pm2:logs              # Ver logs de PM2
bun run pm2:status            # Estado de PM2
```

### CLI
```bash
bun run process-cli           # Procesar imágenes por lotes
```

## 🔧 Configuración

1. **Variables de entorno**: Copiar `.env.example` a `.env` y configurar `GEMINI_API_KEY`
2. **Puerto**: Por defecto usa el puerto 3001
3. **Logs**: Se almacenan en `logs/`

## 📦 Dependencias

- **Runtime**: Bun (reemplaza Node.js y npm)
- **Framework**: Express.js
- **IA**: Google Gemini API
- **Imágenes**: Sharp, heic-convert
- **Deploy**: PM2 (opcional)

## 🏗️ Arquitectura

- **Backend**: TypeScript con Express.js
- **Frontend**: TypeScript vanilla compilado a JavaScript
- **Procesamiento**: Google Gemini API para análisis de imágenes
- **Storage**: Sistema de archivos local
- **Deploy**: PM2 o scripts simples con nohup
