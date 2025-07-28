import * as sharp from 'sharp';
import * as fs from 'fs';
import * as path from 'path';
import * as pdf from 'pdf-parse';
import * as mammoth from 'mammoth';
import * as ExcelJS from 'exceljs';
import * as csv from 'csv-parser';
import { FileMetadata, ThumbnailConfig, TextExtractionConfig } from '../types';
import { FileError } from '../services/file-service';

export class FileProcessor {
  /**
   * Generate thumbnails for image files
   */
  async generateThumbnails(
    file: FileMetadata,
    config: { thumbnailSizes: Array<{ width: number; height: number; quality?: number }> }
  ): Promise<any> {
    try {
      if (file.category !== 'image') {
        throw new FileError('File is not an image');
      }

      console.log(`[File Processor] Generating thumbnails for ${file.filename}`);

      const thumbnails = [];
      const inputBuffer = await this.getFileBuffer(file);

      for (const size of config.thumbnailSizes) {
        try {
          const thumbnailBuffer = await sharp(inputBuffer)
            .resize(size.width, size.height, {
              fit: 'inside',
              withoutEnlargement: true
            })
            .jpeg({ quality: size.quality || 80 })
            .toBuffer();

          // Save thumbnail
          const thumbnailPath = this.generateThumbnailPath(file, size);
          await this.saveFile(thumbnailPath, thumbnailBuffer);

          thumbnails.push({
            size: `${size.width}x${size.height}`,
            path: thumbnailPath,
            url: this.generateThumbnailUrl(file, size),
            width: size.width,
            height: size.height
          });

          console.log(`[File Processor] Generated ${size.width}x${size.height} thumbnail`);
        } catch (error) {
          console.error(`Error generating ${size.width}x${size.height} thumbnail:`, error);
        }
      }

      // Get image metadata
      const metadata = await sharp(inputBuffer).metadata();

      return {
        thumbnails,
        metadata: {
          dimensions: {
            width: metadata.width || 0,
            height: metadata.height || 0
          },
          format: metadata.format,
          space: metadata.space,
          channels: metadata.channels,
          depth: metadata.depth,
          density: metadata.density,
          hasAlpha: metadata.hasAlpha,
          isAnimated: metadata.pages && metadata.pages > 1
        }
      };
    } catch (error) {
      console.error(`Error generating thumbnails for ${file.filename}:`, error);
      throw new FileError('Failed to generate thumbnails', error);
    }
  }

  /**
   * Extract text and metadata from documents
   */
  async extractContent(
    file: FileMetadata,
    config: { extractText?: boolean; extractMetadata?: boolean }
  ): Promise<any> {
    try {
      console.log(`[File Processor] Extracting content from ${file.filename}`);

      let extractedText = '';
      let metadata: any = {};

      const inputBuffer = await this.getFileBuffer(file);

      switch (file.mimeType) {
        case 'application/pdf':
          const pdfResult = await this.extractFromPDF(inputBuffer, config);
          extractedText = pdfResult.text;
          metadata = pdfResult.metadata;
          break;

        case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
        case 'application/msword':
          const docxResult = await this.extractFromDOCX(inputBuffer, config);
          extractedText = docxResult.text;
          metadata = docxResult.metadata;
          break;

        case 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':
        case 'application/vnd.ms-excel':
          const excelResult = await this.extractFromExcel(inputBuffer, config);
          extractedText = excelResult.text;
          metadata = excelResult.metadata;
          break;

        case 'text/csv':
          const csvResult = await this.extractFromCSV(inputBuffer, config);
          extractedText = csvResult.text;
          metadata = csvResult.metadata;
          break;

        case 'text/plain':
        case 'text/html':
        case 'application/json':
        case 'application/xml':
          extractedText = inputBuffer.toString('utf-8');
          metadata = {
            encoding: 'utf-8',
            lineCount: extractedText.split('\\n').length,
            characterCount: extractedText.length
          };
          break;

        default:
          console.log(`[File Processor] Unsupported file type for text extraction: ${file.mimeType}`);
      }

      // Truncate text if too long
      if (extractedText.length > 100000) {
        extractedText = extractedText.substring(0, 100000) + '... [truncated]';
      }

      return {
        extractedText: config.extractText ? extractedText : undefined,
        metadata: config.extractMetadata ? metadata : undefined,
        success: true
      };
    } catch (error) {
      console.error(`Error extracting content from ${file.filename}:`, error);
      throw new FileError('Failed to extract content', error);
    }
  }

  /**
   * Convert file format
   */
  async convertFormat(
    file: FileMetadata,
    config: { targetFormat: string; quality?: number }
  ): Promise<any> {
    try {
      console.log(`[File Processor] Converting ${file.filename} to ${config.targetFormat}`);

      const inputBuffer = await this.getFileBuffer(file);
      let outputBuffer: Buffer;
      let outputMimeType: string;

      // Image conversions
      if (file.category === 'image') {
        outputBuffer = await this.convertImage(inputBuffer, config.targetFormat, config.quality);
        outputMimeType = `image/${config.targetFormat}`;
      } else {
        throw new FileError(`Format conversion not supported for ${file.category} files`);
      }

      // Save converted file
      const convertedPath = this.generateConvertedFilePath(file, config.targetFormat);
      await this.saveFile(convertedPath, outputBuffer);

      return {
        convertedFile: {
          path: convertedPath,
          format: config.targetFormat,
          mimeType: outputMimeType,
          size: outputBuffer.length
        },
        success: true
      };
    } catch (error) {
      console.error(`Error converting ${file.filename}:`, error);
      throw new FileError('Failed to convert file format', error);
    }
  }

  /**
   * Compress file
   */
  async compressFile(
    file: FileMetadata,
    config: { compressionLevel?: number; targetSize?: number }
  ): Promise<any> {
    try {
      console.log(`[File Processor] Compressing ${file.filename}`);

      const inputBuffer = await this.getFileBuffer(file);
      let outputBuffer: Buffer;

      if (file.category === 'image') {
        // Image compression
        let quality = 80;
        if (config.compressionLevel) {
          quality = Math.max(10, Math.min(100, 100 - config.compressionLevel));
        }

        outputBuffer = await sharp(inputBuffer)
          .jpeg({ quality, progressive: true, mozjpeg: true })
          .toBuffer();

        // If target size specified, iteratively reduce quality to meet it
        if (config.targetSize && outputBuffer.length > config.targetSize) {
          let currentQuality = quality;
          while (outputBuffer.length > config.targetSize && currentQuality > 10) {
            currentQuality -= 10;
            outputBuffer = await sharp(inputBuffer)
              .jpeg({ quality: currentQuality, progressive: true, mozjpeg: true })
              .toBuffer();
          }
        }
      } else {
        // For other file types, use generic compression (gzip)
        const zlib = require('zlib');
        outputBuffer = zlib.gzipSync(inputBuffer);
      }

      const compressionRatio = (1 - outputBuffer.length / inputBuffer.length) * 100;

      return {
        compressedSize: outputBuffer.length,
        originalSize: inputBuffer.length,
        compressionRatio: Math.round(compressionRatio * 100) / 100,
        success: true
      };
    } catch (error) {
      console.error(`Error compressing ${file.filename}:`, error);
      throw new FileError('Failed to compress file', error);
    }
  }

  /**
   * Add watermark to image
   */
  async addWatermark(
    file: FileMetadata,
    config: {
      text?: string;
      image?: string;
      position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center';
      opacity?: number;
    }
  ): Promise<any> {
    try {
      if (file.category !== 'image') {
        throw new FileError('Watermark can only be applied to images');
      }

      console.log(`[File Processor] Adding watermark to ${file.filename}`);

      const inputBuffer = await this.getFileBuffer(file);
      const { width, height } = await sharp(inputBuffer).metadata();

      if (!width || !height) {
        throw new FileError('Could not determine image dimensions');
      }

      let watermarkBuffer: Buffer;

      if (config.text) {
        // Create text watermark
        const svg = this.createTextWatermarkSVG(config.text, width, height, config.position, config.opacity);
        watermarkBuffer = Buffer.from(svg);
      } else if (config.image) {
        // Load image watermark
        watermarkBuffer = fs.readFileSync(config.image);
      } else {
        throw new FileError('Either text or image must be provided for watermark');
      }

      const outputBuffer = await sharp(inputBuffer)
        .composite([{
          input: watermarkBuffer,
          gravity: this.getSharpGravity(config.position),
          blend: 'over'
        }])
        .toBuffer();

      return {
        watermarkedSize: outputBuffer.length,
        originalSize: inputBuffer.length,
        success: true
      };
    } catch (error) {
      console.error(`Error adding watermark to ${file.filename}:`, error);
      throw new FileError('Failed to add watermark', error);
    }
  }

  /**
   * Private helper methods
   */
  private async getFileBuffer(file: FileMetadata): Promise<Buffer> {
    // In a real implementation, this would fetch the file from storage
    // For now, assume file is available locally
    const filePath = file.path;
    
    if (fs.existsSync(filePath)) {
      return fs.readFileSync(filePath);
    } else {
      // If not local, would fetch from S3 or other storage
      throw new FileError('File not found in storage');
    }
  }

  private async saveFile(filePath: string, buffer: Buffer): Promise<void> {
    // Ensure directory exists
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(filePath, buffer);
  }

  private generateThumbnailPath(file: FileMetadata, size: { width: number; height: number }): string {
    const ext = path.extname(file.filename);
    const baseName = path.basename(file.filename, ext);
    return `${path.dirname(file.path)}/thumbnails/${baseName}_${size.width}x${size.height}.jpg`;
  }

  private generateThumbnailUrl(file: FileMetadata, size: { width: number; height: number }): string {
    return `/files/thumbnails/${file.id}/${size.width}x${size.height}.jpg`;
  }

  private generateConvertedFilePath(file: FileMetadata, targetFormat: string): string {
    const baseName = path.basename(file.filename, path.extname(file.filename));
    return `${path.dirname(file.path)}/converted/${baseName}.${targetFormat}`;
  }

  private async extractFromPDF(buffer: Buffer, config: any): Promise<{ text: string; metadata: any }> {
    try {
      const data = await pdf(buffer);
      
      return {
        text: data.text,
        metadata: {
          pageCount: data.numpages,
          title: data.info?.Title,
          author: data.info?.Author,
          subject: data.info?.Subject,
          creator: data.info?.Creator,
          producer: data.info?.Producer,
          creationDate: data.info?.CreationDate,
          modificationDate: data.info?.ModDate,
          version: data.version
        }
      };
    } catch (error) {
      console.error('Error extracting from PDF:', error);
      return { text: '', metadata: {} };
    }
  }

  private async extractFromDOCX(buffer: Buffer, config: any): Promise<{ text: string; metadata: any }> {
    try {
      const result = await mammoth.extractRawText({ buffer });
      
      return {
        text: result.value,
        metadata: {
          warnings: result.messages,
          hasImages: result.value.includes('[image]'),
          extractedImages: 0 // mammoth would provide this
        }
      };
    } catch (error) {
      console.error('Error extracting from DOCX:', error);
      return { text: '', metadata: {} };
    }
  }

  private async extractFromExcel(buffer: Buffer, config: any): Promise<{ text: string; metadata: any }> {
    try {
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(buffer);

      let text = '';
      const worksheetData: any[] = [];

      workbook.eachSheet((worksheet, sheetId) => {
        const sheetData: any[] = [];
        
        worksheet.eachRow((row, rowNumber) => {
          const rowData: any[] = [];
          row.eachCell((cell, colNumber) => {
            const cellValue = cell.value?.toString() || '';
            rowData.push(cellValue);
            text += cellValue + ' ';
          });
          sheetData.push(rowData);
        });

        worksheetData.push({
          name: worksheet.name,
          rows: sheetData.length,
          columns: sheetData[0]?.length || 0,
          data: sheetData.slice(0, 10) // First 10 rows for preview
        });

        text += '\\n';
      });

      return {
        text: text.trim(),
        metadata: {
          worksheetCount: workbook.worksheets.length,
          worksheets: worksheetData,
          creator: workbook.creator,
          lastModifiedBy: workbook.lastModifiedBy,
          created: workbook.created,
          modified: workbook.modified
        }
      };
    } catch (error) {
      console.error('Error extracting from Excel:', error);
      return { text: '', metadata: {} };
    }
  }

  private async extractFromCSV(buffer: Buffer, config: any): Promise<{ text: string; metadata: any }> {
    return new Promise((resolve, reject) => {
      const results: any[] = [];
      let text = '';
      let columnCount = 0;

      const stream = require('stream');
      const bufferStream = new stream.PassThrough();
      bufferStream.end(buffer);

      bufferStream
        .pipe(csv())
        .on('data', (data) => {
          results.push(data);
          if (columnCount === 0) {
            columnCount = Object.keys(data).length;
          }
          // Add row data to text
          text += Object.values(data).join(' ') + '\\n';
        })
        .on('end', () => {
          resolve({
            text: text.trim(),
            metadata: {
              rowCount: results.length,
              columnCount,
              columns: results.length > 0 ? Object.keys(results[0]) : [],
              preview: results.slice(0, 10) // First 10 rows
            }
          });
        })
        .on('error', (error) => {
          console.error('Error extracting from CSV:', error);
          resolve({ text: '', metadata: {} });
        });
    });
  }

  private async convertImage(
    inputBuffer: Buffer,
    targetFormat: string,
    quality?: number
  ): Promise<Buffer> {
    let sharpInstance = sharp(inputBuffer);

    switch (targetFormat.toLowerCase()) {
      case 'jpeg':
      case 'jpg':
        return sharpInstance.jpeg({ quality: quality || 80 }).toBuffer();
      case 'png':
        return sharpInstance.png({ quality: quality || 80 }).toBuffer();
      case 'webp':
        return sharpInstance.webp({ quality: quality || 80 }).toBuffer();
      case 'avif':
        return sharpInstance.avif({ quality: quality || 80 }).toBuffer();
      case 'tiff':
        return sharpInstance.tiff().toBuffer();
      default:
        throw new FileError(`Unsupported target format: ${targetFormat}`);
    }
  }

  private createTextWatermarkSVG(
    text: string,
    imageWidth: number,
    imageHeight: number,
    position: string,
    opacity: number = 0.5
  ): string {
    const fontSize = Math.min(imageWidth, imageHeight) * 0.05;
    let x = 10;
    let y = fontSize + 10;

    switch (position) {
      case 'top-right':
        x = imageWidth - 10;
        y = fontSize + 10;
        break;
      case 'bottom-left':
        x = 10;
        y = imageHeight - 10;
        break;
      case 'bottom-right':
        x = imageWidth - 10;
        y = imageHeight - 10;
        break;
      case 'center':
        x = imageWidth / 2;
        y = imageHeight / 2;
        break;
    }

    return `
      <svg width="${imageWidth}" height="${imageHeight}">
        <text x="${x}" y="${y}" 
              font-family="Arial, sans-serif" 
              font-size="${fontSize}" 
              fill="white" 
              fill-opacity="${opacity}"
              text-anchor="${position.includes('right') ? 'end' : (position === 'center' ? 'middle' : 'start')}"
              stroke="black" 
              stroke-width="1" 
              stroke-opacity="${opacity * 0.5}">
          ${text}
        </text>
      </svg>
    `;
  }

  private getSharpGravity(position: string): any {
    switch (position) {
      case 'top-left': return 'northwest';
      case 'top-right': return 'northeast';
      case 'bottom-left': return 'southwest';
      case 'bottom-right': return 'southeast';
      case 'center': return 'center';
      default: return 'center';
    }
  }
}