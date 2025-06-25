# MIES Conservación - Aplicación Móvil Web

Una aplicación móvil web moderna para capturar, procesar y gestionar imágenes utilizando inteligencia artificial.

## 🚀 Características

- **📱 Interfaz Móvil Optimizada**: Diseño responsivo optimizado para dispositivos móviles
- **📷 Captura de Cámara**: Acceso directo a la cámara del dispositivo con controles intuitivos
- **🔄 Cambio de Cámara**: Alterna entre cámara frontal y trasera
- **📤 Subida de Archivos**: Permite cargar imágenes desde la galería del dispositivo
- **🤖 Procesamiento con IA**: Extracción automática de texto e información usando Gemini AI
- **🖼️ Optimización de Imágenes**: Compresión y optimización automática para mejor calidad
- **💾 Almacenamiento Local**: Galería local de imágenes procesadas
- **🔄 Conversión HEIC**: Soporte completo para imágenes HEIC de iOS
- **📱 PWA Ready**: Instalable como aplicación nativa
- **⚡ Offline Support**: Funciona sin conexión para funciones básicas

## 🛠️ Tecnologías Utilizadas

### Frontend
- **HTML5** con APIs modernas (Camera, File)
- **CSS3** con diseño responsivo y animaciones
- **JavaScript ES6+** con módulos nativos
- **PWA** (Progressive Web App)
- **Service Worker** para funcionalidad offline

### Backend
- **Node.js** con Express
- **Google Gemini AI** para procesamiento de imágenes
- **Sharp** para optimización de imágenes
- **heic-convert** para conversión de formatos
- **Multer** para manejo de archivos

## 📦 Instalación

1. **Clona el repositorio**:
   ```bash
   git clone <tu-repositorio>
   cd mies-conservacion
   ```

2. **Instala las dependencias**:
   ```bash
   npm install
   ```

3. **Configura las variables de entorno**:
   ```bash
   cp .env.example .env
   ```
   
   Edita el archivo `.env` y agrega tu API key de Gemini:
   ```
   GEMINI_API_KEY=tu_api_key_aqui
   ```

4. **Inicia el servidor de desarrollo**:
   ```bash
   npm run dev
   ```

5. **Abre la aplicación**:
   - Navega a `http://localhost:3000`
   - O escanea el código QR para acceso móvil

## 🔧 Scripts Disponibles

- `npm run dev` - Inicia el servidor de desarrollo
- `npm start` - Inicia el servidor en producción
- `npm run build` - Construye la aplicación
- `npm run process-cli` - Ejecuta el procesamiento CLI original

## 📱 Uso de la Aplicación

### Captura de Fotos
1. **Permite el acceso a la cámara** cuando se solicite
2. **Encuadra tu objeto** dentro del marco de referencia
3. **Toca el botón de captura** (círculo blanco grande)
4. **Revisa la imagen** en la vista previa
5. **Procesa la imagen** para extraer información

### Subida de Imágenes
1. **Toca el ícono de carpeta** en los controles de cámara
2. **Selecciona una imagen** de tu galería
3. **Procesa la imagen** normalmente

### Cambio de Cámara
- **Toca el ícono de cámara** para alternar entre frontal y trasera

### Galería
- **Visualiza todas las imágenes procesadas** en la galería
- **Toca cualquier imagen** para verla en pantalla completa
- **Descarga las imágenes** procesadas

## 🏗️ Estructura del Proyecto

```
mies-conservacion/
├── public/                 # Archivos estáticos de la web app
│   ├── index.html         # Página principal
│   ├── styles.css         # Estilos de la aplicación
│   ├── app.js            # Lógica del frontend
│   ├── manifest.json     # Manifiesto PWA
│   ├── sw.js            # Service Worker
│   └── processed/       # Imágenes procesadas públicas
├── server.js             # Servidor Express
├── imageProcessor.js     # Procesador de imágenes
├── index.ts             # CLI original (mantenido)
├── fotos/               # Directorio de entrada
├── fotos_resultado/     # Resultados del procesamiento
└── package.json         # Configuración del proyecto
```

## 🔧 Configuración Avanzada

### Variables de Entorno

```env
# API de Gemini (Requerido)
GEMINI_API_KEY=tu_api_key_aqui

# Configuración del servidor
PORT=3000
NODE_ENV=development

# Límites de archivos
MAX_FILE_SIZE=10485760  # 10MB
ALLOWED_FILE_TYPES=image/jpeg,image/jpg,image/png,image/heic,image/webp
```

### API Key de Gemini

1. Ve a [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Crea una nueva API key
3. Copia la key al archivo `.env`

## 📱 Instalación como PWA

### En dispositivos móviles:
1. **Abre la app en tu navegador móvil**
2. **Busca la opción "Agregar a pantalla de inicio"**
3. **Confirma la instalación**
4. **La app aparecerá como una aplicación nativa**

### En desktop:
1. **Abre la app en Chrome/Edge**
2. **Busca el ícono de instalación** en la barra de direcciones
3. **Haz clic en "Instalar"**

## 🔍 API Endpoints

### POST `/api/process-image`
Procesa una imagen subida:
```javascript
// Multipart/form-data con campo 'image'
FormData: {
  image: File
}

// Respuesta
{
  success: true,
  extractedTitle: "Texto extraído",
  newName: "MIES-TEXTO-2024-01-01.jpg",
  processedImageUrl: "/processed/imagen.jpg",
  originalSize: 1234567,
  processedSize: 987654,
  format: "jpeg"
}
```

### GET `/api/images`
Obtiene lista de imágenes procesadas:
```javascript
[
  {
    filename: "imagen.jpg",
    url: "/processed/imagen.jpg",
    name: "imagen"
  }
]
```

### GET `/api/health`
Verifica el estado del servidor:
```javascript
{
  status: "ok",
  timestamp: "2024-01-01T00:00:00.000Z"
}
```

## 🎨 Personalización

### Colores
Modifica las variables CSS en `styles.css`:
```css
:root {
  --primary-color: #2563eb;
  --secondary-color: #667eea;
  --success-color: #059669;
  --error-color: #dc2626;
}
```

### Configuración de Cámara
Ajusta las restricciones en `app.js`:
```javascript
const constraints = {
  video: {
    facingMode: this.currentFacingMode,
    width: { ideal: 1920 },
    height: { ideal: 1080 }
  }
};
```

## 🔄 Formatos Soportados

- **JPEG/JPG** - Formato estándar
- **PNG** - Con transparencia
- **HEIC** - Imágenes de iOS (convertidas automáticamente)
- **WebP** - Formato moderno optimizado

## 📊 Optimizaciones

- **Compresión inteligente** con Sharp
- **Conversión automática** de HEIC a JPEG
- **Caching** con Service Worker
- **Lazy loading** de imágenes
- **Responsive images** para diferentes dispositivos

## 🚀 Despliegue

### Desarrollo Local
```bash
npm run dev
```

### Producción
```bash
npm start
```

### Docker (Opcional)
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

## 🐛 Solución de Problemas

### La cámara no funciona
- **Verifica permisos** del navegador
- **Usa HTTPS** (requerido para cámara)
- **Verifica compatibilidad** del dispositivo

### Error de API de Gemini
- **Verifica tu API key** en `.env`
- **Comprueba límites** de la API
- **Revisa la conexión** a internet

### Imágenes HEIC no se procesan
- **Verifica la instalación** de heic-convert
- **Comprueba la compatibilidad** del sistema

## 📜 Licencia

Este proyecto está bajo la [Licencia MIT](LICENSE).

## 🤝 Contribuciones

Las contribuciones son bienvenidas. Por favor:

1. Fork el proyecto
2. Crea una rama para tu feature
3. Commit tus cambios
4. Push a la rama
5. Abre un Pull Request

## 📞 Soporte

Para soporte técnico o preguntas:
- Abre un issue en el repositorio
- Contacta al equipo de desarrollo

---

**MIES Conservación** - Procesamiento inteligente de imágenes 📱🤖
