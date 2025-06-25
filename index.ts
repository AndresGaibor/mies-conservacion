import 'dotenv/config';
import { GoogleGenerativeAI } from '@google/generative-ai';
import heicConvert from 'heic-convert';
import sharp from 'sharp';
import * as XLSX from 'xlsx';
import { readdir, readFile, writeFile, copyFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { join, extname, basename } from 'path';

// Configuración
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const FOTOS_DIR = './fotos';
const RESULTADO_DIR = './fotos_resultado';
const EXCEL_FILE = './titulos_imagenes.xlsx';

interface ImageData {
  originalName: string;
  extractedTitle: string;
  newName: string;
  processed: boolean;
  error?: string;
}

class ImageProcessor {
  private genAI: GoogleGenerativeAI;
  private model: any;
  private results: ImageData[] = [];

  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY no está configurada. Por favor, configura tu API key de Gemini.');
    }
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  }

  async init() {
    // Crear directorio de resultado si no existe
    if (!existsSync(RESULTADO_DIR)) {
      await mkdir(RESULTADO_DIR, { recursive: true });
    }
  }

  async convertHeicToJpeg(heicBuffer: Buffer): Promise<Buffer> {
    try {
      const jpegBuffer = await heicConvert({
        buffer: heicBuffer,
        format: 'JPEG',
        quality: 1
      });
      return Buffer.from(jpegBuffer);
    } catch (error) {
      console.error('Error convirtiendo HEIC a JPEG:', error);
      throw error;
    }
  }

  async extractCodeWithGemini(imageBuffer: Buffer): Promise<string> {
    try {
      const prompt = `
        Analiza esta imagen y extrae el TÍTULO o CÓDIGO principal que aparece en ella.
        
        Busca específicamente:
        - Códigos que empiecen con "MIES" (ej: MIES-CZ3-CAF-006)
        - Cualquier texto grande o prominente que parezca ser un título o identificador
        - Números de serie o códigos de identificación
        - Títulos principales o encabezados
        
        Características del texto a buscar:
        - Suele ser el texto más grande o prominente en la imagen
        - Puede tener formato MIES-XXX-XXX-XXX donde XXX pueden ser letras o números
        - Puede estar en la parte superior o central de la imagen
        - Es el texto más importante que identifica la imagen
        
        INSTRUCCIONES:
        - Responde ÚNICAMENTE con el título/código encontrado
        - NO agregues explicaciones ni texto adicional
        - Si no encuentras ningún título claro, responde "SIN_TITULO"
        - Mantén el formato exacto como aparece en la imagen
      `;

      const imagePart = {
        inlineData: {
          data: imageBuffer.toString('base64'),
          mimeType: 'image/jpeg',
        },
      };

      const result = await this.model.generateContent([prompt, imagePart]);
      const response = await result.response;
      const text = response.text().trim();
      
      console.log(`📋 Título extraído: ${text}`);
      
      return text === 'SIN_TITULO' ? '' : text;
    } catch (error) {
      console.error('Error extrayendo título con Gemini:', error);
      return '';
    }
  }

  async processImage(filename: string): Promise<ImageData> {
    const imageData: ImageData = {
      originalName: filename,
      extractedTitle: '',
      newName: '',
      processed: false
    };

    try {
      console.log(`\nProcesando: ${filename}`);
      
      // Leer imagen HEIC
      const heicPath = join(FOTOS_DIR, filename);
      const heicBuffer = await readFile(heicPath);
      
      // Convertir HEIC a JPEG para Gemini
      console.log('Convirtiendo HEIC a JPEG...');
      const jpegBuffer = await this.convertHeicToJpeg(heicBuffer);
      
      // Extraer código con Gemini
      console.log('Extrayendo título con Gemini...');
      const extractedTitle = await this.extractCodeWithGemini(jpegBuffer);
      
      if (!extractedTitle) {
        imageData.error = 'No se pudo extraer título de la imagen';
        console.log('❌ No se encontró título en la imagen');
        return imageData;
      }

      imageData.extractedTitle = extractedTitle;
      imageData.newName = `${extractedTitle}.heic`;
      
      // Verificar si ya existe un archivo con ese nombre
      const newPath = join(RESULTADO_DIR, imageData.newName);
      if (existsSync(newPath)) {
        imageData.error = 'Archivo duplicado, se omite';
        console.log(`⚠️  Archivo duplicado: ${imageData.newName}`);
        return imageData;
      }

      // Copiar archivo original con nuevo nombre
      await copyFile(heicPath, newPath);
      imageData.processed = true;
      
      console.log(`✅ Procesado: ${filename} → ${imageData.newName}`);
      
    } catch (error: any) {
      imageData.error = `Error: ${error?.message || 'Error desconocido'}`;
      console.error(`❌ Error procesando ${filename}:`, error);
    }

    return imageData;
  }

  async processAllImages() {
    try {
      console.log('Iniciando procesamiento de imágenes...\n');
      
      const files = await readdir(FOTOS_DIR);
      const heicFiles = files.filter(file => extname(file).toLowerCase() === '.heic');
      
      console.log(`Encontradas ${heicFiles.length} imágenes HEIC`);
      
      for (const file of heicFiles) {
        const result = await this.processImage(file);
        this.results.push(result);
      }
      
      await this.generateExcelReport();
      
    } catch (error) {
      console.error('Error en el procesamiento:', error);
    }
  }

  async generateExcelReport() {
    console.log('\n📊 Generando reporte Excel con títulos extraídos...');
    
    const workbook = XLSX.utils.book_new();
    
    // Filtrar solo las imágenes que tienen título extraído
    const imagesWithTitles = this.results.filter(result => result.extractedTitle);
    
    const worksheetData = [
      ['Título Extraído', 'Nombre Original', 'Estado'],
      ...imagesWithTitles.map(result => [
        result.extractedTitle,
        result.originalName,
        result.processed ? 'Procesado exitosamente' : (result.error || 'Error desconocido')
      ])
    ];
    
    // Si no hay títulos extraídos, agregar una fila indicándolo
    if (imagesWithTitles.length === 0) {
      worksheetData.push(['No se encontraron títulos en las imágenes', '', '']);
    }
    
    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
    
    // Ajustar ancho de columnas
    const colWidths = [
      { width: 30 }, // Título Extraído
      { width: 25 }, // Nombre Original
      { width: 25 }  // Estado
    ];
    worksheet['!cols'] = colWidths;
    
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Títulos de Imágenes');
    
    XLSX.writeFile(workbook, EXCEL_FILE);
    
    console.log(`✅ Reporte guardado en: ${EXCEL_FILE}`);
    console.log(`📋 Total de títulos extraídos: ${imagesWithTitles.length}`);
    
    // Mostrar todos los títulos encontrados
    if (imagesWithTitles.length > 0) {
      console.log('\n📝 Títulos extraídos:');
      imagesWithTitles.forEach((result, index) => {
        console.log(`   ${index + 1}. ${result.extractedTitle}`);
      });
    }
    
    // Mostrar resumen
    const processed = this.results.filter(r => r.processed).length;
    const duplicates = this.results.filter(r => r.error?.includes('duplicado')).length;
    const errors = this.results.filter(r => r.error && !r.error.includes('duplicado')).length;
    
    console.log('\n📈 Resumen del procesamiento:');
    console.log(`   - Imágenes procesadas exitosamente: ${processed}`);
    console.log(`   - Duplicados omitidos: ${duplicates}`);
    console.log(`   - Errores: ${errors}`);
    console.log(`   - Total de imágenes: ${this.results.length}`);
  }
}

async function main() {
  try {
    console.log('🚀 Iniciando procesador de imágenes MIES\n');
    
    const processor = new ImageProcessor(GEMINI_API_KEY);
    await processor.init();
    await processor.processAllImages();
    
    console.log('\n🎉 Procesamiento completado!');
    
  } catch (error: any) {
    console.error('❌ Error en la aplicación:', error?.message || 'Error desconocido');
    process.exit(1);
  }
}

// Ejecutar si es el archivo principal
if (import.meta.main) {
  main();
}