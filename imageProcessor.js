import 'dotenv/config';
import { GoogleGenerativeAI } from '@google/generative-ai';
import heicConvert from 'heic-convert';
import sharp from 'sharp';
import { writeFile, mkdir, readdir } from 'fs/promises';
import { existsSync } from 'fs';
import { join, extname } from 'path';

const RESULTADO_DIR = './fotos_resultado';
const PROCESSED_DIR = './public/processed';

export class ImageProcessor {
  constructor(apiKey) {
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY no está configurada. Por favor, configura tu API key de Gemini.');
    }
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  }

  async init() {
    // Crear directorios si no existen
    if (!existsSync(RESULTADO_DIR)) {
      await mkdir(RESULTADO_DIR, { recursive: true });
    }
    if (!existsSync(PROCESSED_DIR)) {
      await mkdir(PROCESSED_DIR, { recursive: true });
    }
  }

  async convertHeicToJpeg(heicBuffer) {
    try {
      const jpegBuffer = await heicConvert({
        buffer: heicBuffer,
        format: 'JPEG',
        quality: 1
      });
      return jpegBuffer;
    } catch (error) {
      console.error('Error converting HEIC to JPEG:', error);
      throw new Error('Error al convertir imagen HEIC');
    }
  }

  async optimizeImage(imageBuffer, format = 'jpeg') {
    try {
      const sharpImage = sharp(imageBuffer);
      const metadata = await sharpImage.metadata();
      
      // Optimize based on format
      let optimized;
      if (format.toLowerCase() === 'png') {
        optimized = await sharpImage
          .png({ quality: 90, compressionLevel: 6 })
          .toBuffer();
      } else {
        optimized = await sharpImage
          .jpeg({ quality: 90, progressive: true })
          .toBuffer();
      }

      return {
        buffer: optimized,
        metadata: {
          width: metadata.width,
          height: metadata.height,
          format: metadata.format,
          size: optimized.length,
          originalSize: imageBuffer.length
        }
      };
    } catch (error) {
      console.error('Error optimizing image:', error);
      throw new Error('Error al optimizar la imagen');
    }
  }

  async extractTitleWithGemini(imageBuffer) {
    try {
      // Convert buffer to base64
      const base64Image = imageBuffer.toString('base64');
      const mimeType = await this.detectMimeType(imageBuffer);

      const prompt = `
        Analiza esta imagen y extrae cualquier texto visible, especialmente títulos, etiquetas o información relevante.
        
        Instrucciones:
        1. Si hay texto visible en la imagen, extráelo completamente
        2. Si es una placa, etiqueta o cartel, transcribe el texto principal
        3. Si no hay texto visible, describe brevemente el contenido principal de la imagen
        4. Responde únicamente con el texto extraído o descripción, sin explicaciones adicionales
        5. Si hay múltiples textos, prioriza el más prominente o relevante
        
        Formato de respuesta: Solo el texto extraído o descripción breve.
      `;

      const result = await this.model.generateContent([
        prompt,
        {
          inlineData: {
            data: base64Image,
            mimeType: mimeType
          }
        }
      ]);

      const response = await result.response;
      let extractedText = response.text().trim();
      
      // Clean up the response
      extractedText = extractedText.replace(/[^\w\s\-áéíóúñüÁÉÍÓÚÑÜ]/g, ' ');
      extractedText = extractedText.replace(/\s+/g, ' ').trim();
      
      return extractedText || 'Sin texto detectado';
    } catch (error) {
      console.error('Error extracting title with Gemini:', error);
      return 'Error en extracción';
    }
  }

  async detectMimeType(buffer) {
    const metadata = await sharp(buffer).metadata();
    const formatMap = {
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'webp': 'image/webp',
      'tiff': 'image/tiff',
      'gif': 'image/gif'
    };
    return formatMap[metadata.format] || 'image/jpeg';
  }

  generateFileName(extractedTitle, originalName) {
    try {
      let baseName = 'MIES';
      
      if (extractedTitle && extractedTitle !== 'Sin texto detectado' && extractedTitle !== 'Error en extracción') {
        // Clean and format the extracted title
        let cleanTitle = extractedTitle
          .toUpperCase()
          .replace(/[^\w\s\-áéíóúñüÁÉÍÓÚÑÜ]/g, '')
          .replace(/\s+/g, '-')
          .substring(0, 50); // Limit length
        
        if (cleanTitle.length > 3) {
          baseName = `MIES-${cleanTitle}`;
        }
      }
      
      // Add timestamp to ensure uniqueness
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);
      const extension = this.getFileExtension(originalName);
      
      return `${baseName}-${timestamp}${extension}`;
    } catch (error) {
      console.error('Error generating filename:', error);
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);
      return `MIES-${timestamp}.jpg`;
    }
  }

  getFileExtension(filename) {
    const ext = extname(filename).toLowerCase();
    const supportedExtensions = ['.jpg', '.jpeg', '.png', '.webp'];
    return supportedExtensions.includes(ext) ? ext : '.jpg';
  }

  async processImage(imageBuffer, originalName) {
    try {
      console.log('Starting image processing for:', originalName);
      
      let processedBuffer = imageBuffer;
      
      // Convert HEIC to JPEG if needed
      if (originalName.toLowerCase().endsWith('.heic')) {
        console.log('Converting HEIC to JPEG...');
        processedBuffer = await this.convertHeicToJpeg(imageBuffer);
      }
      
      // Optimize image
      console.log('Optimizing image...');
      const optimizedResult = await this.optimizeImage(processedBuffer);
      processedBuffer = optimizedResult.buffer;
      
      // Extract title using Gemini AI
      console.log('Extracting title with AI...');
      const extractedTitle = await this.extractTitleWithGemini(processedBuffer);
      
      // Generate new filename
      const newFileName = this.generateFileName(extractedTitle, originalName);
      
      // Save processed image
      const outputPath = join(RESULTADO_DIR, newFileName);
      const publicPath = join(PROCESSED_DIR, newFileName);
      
      await writeFile(outputPath, processedBuffer);
      await writeFile(publicPath, processedBuffer);
      
      console.log('Image processed successfully:', {
        extractedTitle,
        newFileName,
        originalSize: imageBuffer.length,
        processedSize: processedBuffer.length
      });
      
      return {
        extractedTitle,
        newName: newFileName,
        processedImageUrl: `/processed/${newFileName}`,
        processedSize: processedBuffer.length,
        format: optimizedResult.metadata.format,
        metadata: optimizedResult.metadata,
        processed: true
      };
      
    } catch (error) {
      console.error('Error processing image:', error);
      throw new Error(`Error al procesar la imagen: ${error.message}`);
    }
  }

  async getProcessedImages() {
    try {
      if (!existsSync(PROCESSED_DIR)) {
        return [];
      }
      
      const files = await readdir(PROCESSED_DIR);
      const imageFiles = files.filter(file => 
        /\.(jpg|jpeg|png|webp)$/i.test(file)
      );
      
      return imageFiles.map(file => ({
        filename: file,
        url: `/processed/${file}`,
        name: file.replace(/\.[^/.]+$/, ""), // Remove extension
      }));
    } catch (error) {
      console.error('Error getting processed images:', error);
      return [];
    }
  }
}
