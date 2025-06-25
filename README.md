# 📱 MIES Conservación - Aplicación Móvil Web

Una **aplicación móvil web moderna** construida con **TypeScript** y **Bun** para capturar, procesar y gestionar imágenes utilizando **inteligencia artificial** de Google Gemini.

## ✨ Características Principales

### 📷 Captura Avanzada
- **Cámara en tiempo real** con soporte para múltiples dispositivos
- **Alternancia entre cámara frontal y trasera**
- **Subida de archivos** desde la galería del dispositivo
- **Soporte completo para HEIC** (imágenes de iOS)

### 🤖 Procesamiento Inteligente
- **Extracción automática de texto** usando Gemini AI
- **Optimización de imágenes** con Sharp
- **Compresión inteligente** sin pérdida de calidad
- **Generación automática de nombres** basados en contenido

### 📱 Experiencia Móvil
- **PWA (Progressive Web App)** instalable
- **Interfaz totalmente responsiva**
- **Soporte offline** para funciones básicas
- **Diseño optimizado para touch**

### 🔧 Tecnología Moderna
- **TypeScript** para tipado estático
- **Bun** como runtime y bundler
- **Express** para el backend
- **Vanilla JS** en el frontend (sin frameworks pesados)

## 🚀 Instalación y Configuración

### Prerrequisitos
- **Bun** v1.0+ ([Instalar Bun](https://bun.sh))
- **API Key de Google Gemini** ([Obtener aquí](https://makersuite.google.com/app/apikey))

### 1. Clonar e Instalar
```bash
git clone <tu-repositorio>
cd mies-conservacion
bun install
```

### 2. Configurar Variables de Entorno
```bash
# Copia el archivo de ejemplo
cp .env.example .env

# Edita .env y agrega tu API key de Gemini
GEMINI_API_KEY=tu_api_key_aqui
```

### 3. Ejecutar la Aplicación
```bash
# Desarrollo
bun dev

# Producción
bun start
```

### 4. Abrir en el Navegador
- **Desktop**: `http://localhost:3000`
- **Móvil**: Escanea el código QR o usa la IP local

## 🎯 Uso de la Aplicación

### 1. **Capturar Imagen**
- Toca **"Tomar Foto"** para usar la cámara
- O **"Subir Archivo"** para seleccionar desde galería
- Usa el **botón de cambio** para alternar cámaras

### 2. **Procesar con IA**
- Revisa la imagen en la vista previa
- Toca **"Procesar Imagen"** 
- La IA extraerá texto y optimizará la calidad

### 3. **Descargar y Compartir**
- Descarga la imagen procesada
- Revisa la información extraída
- Accede a la galería de imágenes procesadas

## 📱 Instalación como PWA

### En Móvil (iOS/Android):
1. Abre la app en **Safari/Chrome**
2. Toca **"Agregar a pantalla de inicio"**
3. Confirma la instalación
4. La app aparecerá como aplicación nativa

### En Desktop:
1. Abre en **Chrome/Edge**
2. Busca el **ícono de instalación** en la barra de direcciones
3. Haz clic en **"Instalar"**

1. Coloca las imágenes HEIC en la carpeta `fotos/`
2. Ejecuta el procesador:

```bash
bun run index.ts
```

## Estructura de carpetas

```
mies-conservacion/
├── fotos/                  # Imágenes originales (.heic)
├── fotos_resultado/        # Imágenes renombradas
├── titulos_imagenes.xlsx   # Excel con títulos extraídos
└── index.ts               # Script principal
```

## Proceso

1. **Análisis**: Gemini AI analiza cada imagen HEIC
2. **Extracción**: Busca títulos y códigos prominentes en las imágenes
3. **Renombrado**: Copia archivos con el título como nombre
4. **Registro**: Crea Excel con todos los títulos encontrados

## Excel de Títulos

El archivo `titulos_imagenes.xlsx` contiene:
- **Título Extraído**: El título/código encontrado en la imagen
- **Nombre Original**: Nombre del archivo original
- **Estado**: Si se procesó exitosamente o hubo errores

## 🔧 Despliegue con PM2

### Instalación de PM2
```bash
# Instalar PM2 globalmente
npm install -g pm2

# O con bun
bun add -g pm2
```

### Comandos de PM2
```bash
# Compilar frontend
bun run build-frontend

# Iniciar la aplicación
bun run pm2:start

# Ver estado
bun run pm2:status

# Ver logs en tiempo real
bun run pm2:logs

# Reiniciar la aplicación
bun run pm2:restart

# Recargar sin downtime
bun run pm2:reload

# Detener la aplicación
bun run pm2:stop

# Eliminar del PM2
bun run pm2:delete

# Monitor en tiempo real
bun run pm2:monit
```

### Configuración de Producción
El archivo `ecosystem.config.js` está configurado para:
- **Auto-restart** en caso de fallos
- **Logs rotativos** en `./logs/`
- **Límite de memoria** de 1GB
- **Variables de entorno** separadas por ambiente
- **Configuración de deployment** para servidores remotos

### Variables de Entorno de Producción
```bash
# .env para producción
NODE_ENV=production
PORT=3001
GEMINI_API_KEY=tu_api_key_de_produccion
```

This project was created using `bun init` in bun v1.2.15. [Bun](https://bun.sh) is a fast all-in-one JavaScript runtime.
