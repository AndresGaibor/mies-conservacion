# MIES Conservación - Procesador de Imágenes

Aplicación para procesar imágenes HEIC usando Gemini AI para extraer códigos y renombrar automáticamente.

## Características

- 🔍 Extrae títulos y códigos de imágenes usando Gemini AI
- 🖼️ Procesa archivos HEIC automáticamente
- 📁 Renombra y copia imágenes a carpeta de resultado
- ⚠️ Detecta y omite duplicados
- 📊 Genera Excel con todos los títulos extraídos

## Configuración

1. Instalar dependencias:
```bash
bun install
```

2. Configurar API key de Gemini:
   - Copia `.env.example` a `.env`
   - Obtén tu API key en [Google AI Studio](https://makersuite.google.com/app/apikey)
   - Reemplaza `tu_api_key_aqui` con tu API key real

```bash
cp .env.example .env
# Edita .env con tu API key
```

## Uso

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

This project was created using `bun init` in bun v1.2.15. [Bun](https://bun.sh) is a fast all-in-one JavaScript runtime.
