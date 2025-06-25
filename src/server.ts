import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import multer, { MulterError } from 'multer';
import type { FileFilterCallback } from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';
import { config } from 'dotenv';
import { ImageProcessor } from './services/imageProcessor';

// Load environment variables
config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Initialize image processor
const imageProcessor = new ImageProcessor(process.env.GEMINI_API_KEY || '');

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// Types for request with file
interface MulterFile {
  originalname: string;
  size: number;
  mimetype: string;
  buffer: Buffer;
}

interface MulterRequest extends Request {
  file?: Express.Multer.File;
}

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/heic', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Tipo de archivo no soportado'));
    }
  }
});

// Initialize image processor
async function initializeApp(): Promise<void> {
  try {
    await imageProcessor.init();
    console.log('Image processor initialized successfully');
  } catch (error) {
    console.error('Failed to initialize image processor:', error);
  }
}

// Routes
app.get('/', (req: Request, res: Response) => {
  res.sendFile(path.join(__dirname, '../public', 'index.html'));
});

// Desktop version route
app.get('/desktop', (req: Request, res: Response) => {
  res.sendFile(path.join(__dirname, '../public', 'desktop.html'));
});

app.get('/desktop.html', (req: Request, res: Response) => {
  res.sendFile(path.join(__dirname, '../public', 'desktop.html'));
});

// Health check endpoint
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Process image endpoint
app.post('/api/process-image', upload.single('image'), async (req: MulterRequest, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No se proporcionó ninguna imagen' });
    }

    console.log('Processing image:', {
      originalName: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype
    });

    // Process the image
    const result = await imageProcessor.processImage(req.file.buffer, req.file.originalname);
    
    res.json({
      success: true,
      extractedTitle: result.extractedTitle,
      newName: result.newName,
      processedImageUrl: result.processedImageUrl,
      originalSize: req.file.size,
      processedSize: result.processedSize,
      format: result.format,
      metadata: result.metadata
    });

  } catch (error) {
    console.error('Error processing image:', error);
    res.status(500).json({
      error: 'Error al procesar la imagen',
      details: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
});

// Get processed images
app.get('/api/images', async (req: Request, res: Response) => {
  try {
    const images = await imageProcessor.getProcessedImages();
    res.json(images);
  } catch (error) {
    console.error('Error getting images:', error);
    res.status(500).json({ error: 'Error al obtener las imágenes' });
  }
});

// Download processed image
app.get('/api/download/:filename', (req: Request, res: Response) => {
  try {
    const { filename } = req.params;
    
    if (!filename) {
      return res.status(400).json({ error: 'Nombre de archivo requerido' });
    }
    
    const filePath = path.join(__dirname, '../fotos_resultado', filename);
    
    res.download(filePath, filename, (err: NodeJS.ErrnoException | null) => {
      if (err) {
        console.error('Download error:', err);
        res.status(404).json({ error: 'Archivo no encontrado' });
      }
    });
  } catch (error) {
    console.error('Error downloading file:', error);
    res.status(500).json({ error: 'Error al descargar el archivo' });
  }
});

// Serve processed images
app.use('/processed', express.static(path.join(__dirname, '../fotos_resultado')));

// Error handling middleware
app.use((error: any, req: Request, res: Response, next: NextFunction) => {
  if (error instanceof MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'El archivo es demasiado grande (máximo 10MB)' });
    }
  }
  
  console.error('Unhandled error:', error);
  res.status(500).json({ error: 'Error interno del servidor' });
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({ error: 'Endpoint no encontrado' });
});

// Start server
async function startServer(): Promise<void> {
  await initializeApp();
  
  app.listen(PORT, () => {
    console.log(`🚀 Servidor ejecutándose en http://localhost:${PORT}`);
    console.log(`📱 Aplicación móvil disponible en http://localhost:${PORT}`);
    console.log(`🔗 API disponible en http://localhost:${PORT}/api`);
  });
}

startServer().catch(console.error);

export default app;
