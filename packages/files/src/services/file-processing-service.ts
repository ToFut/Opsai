import { createWorker } from 'tesseract.js'
import * as pdfjsLib from 'pdfjs-dist'
import { prisma } from '@opsai/database'
import { FileProcessingError } from '../errors'

export interface FileMetadata {
  id: string
  name: string
  size: number
  type: string
  url: string
  tenantId: string
  uploadedBy: string
  uploadedAt: Date
  processedAt?: Date
  ocrText?: string
  extractedData?: any
  tags?: string[]
}

export interface ProcessingResult {
  success: boolean
  text?: string
  data?: any
  error?: string
}

export interface DocumentExtraction {
  type: 'receipt' | 'contract' | 'invoice' | 'general'
  data: {
    amount?: number
    date?: string
    vendor?: string
    items?: Array<{ name: string; quantity: number; price: number }>
    total?: number
    tax?: number
    [key: string]: any
  }
  confidence: number
}

export class FileProcessingService {
  private tesseractWorker: any
  private isInitialized = false

  constructor() {
    this.initializeTesseract()
  }

  /**
   * Initialize Tesseract OCR
   */
  private async initializeTesseract(): Promise<void> {
    try {
      this.tesseractWorker = await createWorker('eng')
      this.isInitialized = true
      console.log('✅ Tesseract OCR initialized')
    } catch (error) {
      console.error('❌ Failed to initialize Tesseract:', error)
      throw new FileProcessingError('OCR initialization failed')
    }
  }

  /**
   * Upload and process file
   */
  async uploadAndProcess(
    file: File,
    tenantId: string,
    uploadedBy: string,
    options?: {
      enableOCR?: boolean
      extractData?: boolean
      documentType?: 'receipt' | 'contract' | 'invoice' | 'general'
    }
  ): Promise<FileMetadata> {
    try {
      // Upload file to storage
      const fileUrl = await this.uploadFile(file, tenantId)

      // Create file record in database
      const fileRecord = await prisma.file.create({
        data: {
          name: file.name,
          size: file.size,
          type: file.type,
          url: fileUrl,
          tenantId,
          uploadedBy,
          metadata: {
            originalName: file.name,
            contentType: file.type,
            lastModified: file.lastModified
          }
        }
      })

      // Process file if needed
      if (options?.enableOCR || options?.extractData) {
        await this.processFile(fileRecord.id, fileUrl, options)
      }

      return {
        id: fileRecord.id,
        name: fileRecord.name,
        size: fileRecord.size,
        type: fileRecord.type,
        url: fileRecord.url,
        tenantId: fileRecord.tenantId,
        uploadedBy: fileRecord.uploadedBy,
        uploadedAt: fileRecord.createdAt,
        processedAt: fileRecord.updatedAt,
        tags: []
      }
    } catch (error) {
      console.error('File upload and processing error:', error)
      throw new FileProcessingError(`File processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Upload file to storage
   */
  private async uploadFile(file: File, tenantId: string): Promise<string> {
    // This would integrate with your storage provider (Supabase, AWS S3, etc.)
    // For now, we'll simulate file upload
    const fileName = `${tenantId}/${Date.now()}-${file.name}`
    
    // In production, you would:
    // 1. Upload to Supabase Storage or AWS S3
    // 2. Get the public URL
    // 3. Return the URL
    
    return `https://storage.example.com/${fileName}`
  }

  /**
   * Process file with OCR and data extraction
   */
  async processFile(
    fileId: string,
    fileUrl: string,
    options?: {
      enableOCR?: boolean
      extractData?: boolean
      documentType?: 'receipt' | 'contract' | 'invoice' | 'general'
    }
  ): Promise<ProcessingResult> {
    try {
      let text = ''
      let extractedData: any = null

      // Download file
      const fileBuffer = await this.downloadFile(fileUrl)

      // Determine file type and process accordingly
      const fileType = this.getFileType(fileUrl)

      if (fileType === 'pdf') {
        text = await this.extractTextFromPDF(fileBuffer)
      } else if (fileType === 'image') {
        if (options?.enableOCR) {
          text = await this.extractTextFromImage(fileBuffer)
        }
      }

      // Extract structured data if requested
      if (options?.extractData && text) {
        extractedData = await this.extractDocumentData(text, options.documentType || 'general')
      }

      // Update file record with processing results
      await prisma.file.update({
        where: { id: fileId },
        data: {
          metadata: {
            ocrText: text,
            extractedData,
            processedAt: new Date(),
            documentType: options?.documentType
          }
        }
      })

      return {
        success: true,
        text,
        data: extractedData
      }
    } catch (error) {
      console.error('File processing error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Extract text from PDF
   */
  private async extractTextFromPDF(fileBuffer: Buffer): Promise<string> {
    try {
      const pdf = await pdfjsLib.getDocument({ data: fileBuffer }).promise
      let text = ''

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i)
        const textContent = await page.getTextContent()
        const pageText = textContent.items
          .map((item: any) => item.str)
          .join(' ')
        text += pageText + '\n'
      }

      return text.trim()
    } catch (error) {
      console.error('PDF text extraction error:', error)
      throw new FileProcessingError('PDF text extraction failed')
    }
  }

  /**
   * Extract text from image using OCR
   */
  private async extractTextFromImage(fileBuffer: Buffer): Promise<string> {
    try {
      if (!this.isInitialized) {
        await this.initializeTesseract()
      }

      const result = await this.tesseractWorker.recognize(fileBuffer)
      return result.data.text
    } catch (error) {
      console.error('OCR text extraction error:', error)
      throw new FileProcessingError('OCR text extraction failed')
    }
  }

  /**
   * Extract structured data from document text
   */
  private async extractDocumentData(text: string, documentType: string): Promise<DocumentExtraction> {
    try {
      switch (documentType) {
        case 'receipt':
          return this.extractReceiptData(text)
        case 'invoice':
          return this.extractInvoiceData(text)
        case 'contract':
          return this.extractContractData(text)
        default:
          return this.extractGeneralData(text)
      }
    } catch (error) {
      console.error('Document data extraction error:', error)
      return {
        type: 'general',
        data: { rawText: text },
        confidence: 0
      }
    }
  }

  /**
   * Extract receipt data
   */
  private extractReceiptData(text: string): DocumentExtraction {
    const amountRegex = /total[\s:]*\$?(\d+\.?\d*)/i
    const dateRegex = /(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/
    const vendorRegex = /(?:from|vendor|store)[\s:]*([^\n]+)/i

    const amountMatch = text.match(amountRegex)
    const dateMatch = text.match(dateRegex)
    const vendorMatch = text.match(vendorRegex)

    return {
      type: 'receipt',
      data: {
        amount: amountMatch ? parseFloat(amountMatch[1]) : undefined,
        date: dateMatch ? dateMatch[1] : undefined,
        vendor: vendorMatch ? vendorMatch[1].trim() : undefined,
        rawText: text
      },
      confidence: 0.7
    }
  }

  /**
   * Extract invoice data
   */
  private extractInvoiceData(text: string): DocumentExtraction {
    const invoiceNumberRegex = /invoice[\s#]*(\w+)/i
    const amountRegex = /(?:total|amount)[\s:]*\$?(\d+\.?\d*)/i
    const dateRegex = /(?:date|issued)[\s:]*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i

    const invoiceNumberMatch = text.match(invoiceNumberRegex)
    const amountMatch = text.match(amountRegex)
    const dateMatch = text.match(dateRegex)

    return {
      type: 'invoice',
      data: {
        invoiceNumber: invoiceNumberMatch ? invoiceNumberMatch[1] : undefined,
        amount: amountMatch ? parseFloat(amountMatch[1]) : undefined,
        date: dateMatch ? dateMatch[1] : undefined,
        rawText: text
      },
      confidence: 0.8
    }
  }

  /**
   * Extract contract data
   */
  private extractContractData(text: string): DocumentExtraction {
    const partiesRegex = /(?:between|parties)[\s:]*([^.]*)/i
    const dateRegex = /(?:date|effective)[\s:]*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i
    const amountRegex = /(?:amount|value)[\s:]*\$?(\d+\.?\d*)/i

    const partiesMatch = text.match(partiesRegex)
    const dateMatch = text.match(dateRegex)
    const amountMatch = text.match(amountRegex)

    return {
      type: 'contract',
      data: {
        parties: partiesMatch ? partiesMatch[1].trim() : undefined,
        date: dateMatch ? dateMatch[1] : undefined,
        amount: amountMatch ? parseFloat(amountMatch[1]) : undefined,
        rawText: text
      },
      confidence: 0.6
    }
  }

  /**
   * Extract general data
   */
  private extractGeneralData(text: string): DocumentExtraction {
    return {
      type: 'general',
      data: {
        rawText: text,
        wordCount: text.split(/\s+/).length,
        characterCount: text.length
      },
      confidence: 1.0
    }
  }

  /**
   * Download file from URL
   */
  private async downloadFile(url: string): Promise<Buffer> {
    try {
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error(`Failed to download file: ${response.statusText}`)
      }
      
      const arrayBuffer = await response.arrayBuffer()
      return Buffer.from(arrayBuffer)
    } catch (error) {
      console.error('File download error:', error)
      throw new FileProcessingError('File download failed')
    }
  }

  /**
   * Get file type from URL
   */
  private getFileType(url: string): string {
    const extension = url.split('.').pop()?.toLowerCase()
    
    if (extension === 'pdf') {
      return 'pdf'
    } else if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'tiff'].includes(extension || '')) {
      return 'image'
    } else {
      return 'unknown'
    }
  }

  /**
   * Get file metadata
   */
  async getFileMetadata(fileId: string, tenantId: string): Promise<FileMetadata | null> {
    try {
      const file = await prisma.file.findFirst({
        where: { id: fileId, tenantId }
      })

      if (!file) {
        return null
      }

      return {
        id: file.id,
        name: file.name,
        size: file.size,
        type: file.type,
        url: file.url,
        tenantId: file.tenantId,
        uploadedBy: file.uploadedBy,
        uploadedAt: file.createdAt,
        processedAt: file.updatedAt,
        ocrText: file.metadata?.ocrText,
        extractedData: file.metadata?.extractedData,
        tags: file.metadata?.tags || []
      }
    } catch (error) {
      console.error('Get file metadata error:', error)
      throw new FileProcessingError('Failed to get file metadata')
    }
  }

  /**
   * List files for tenant
   */
  async listFiles(
    tenantId: string,
    options?: {
      limit?: number
      offset?: number
      type?: string
      search?: string
    }
  ): Promise<FileMetadata[]> {
    try {
      const where: any = { tenantId }

      if (options?.type) {
        where.type = { contains: options.type }
      }

      if (options?.search) {
        where.OR = [
          { name: { contains: options.search } },
          { metadata: { path: ['ocrText'], string_contains: options.search } }
        ]
      }

      const files = await prisma.file.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: options?.limit || 50,
        skip: options?.offset || 0
      })

      return files.map(file => ({
        id: file.id,
        name: file.name,
        size: file.size,
        type: file.type,
        url: file.url,
        tenantId: file.tenantId,
        uploadedBy: file.uploadedBy,
        uploadedAt: file.createdAt,
        processedAt: file.updatedAt,
        ocrText: file.metadata?.ocrText,
        extractedData: file.metadata?.extractedData,
        tags: file.metadata?.tags || []
      }))
    } catch (error) {
      console.error('List files error:', error)
      throw new FileProcessingError('Failed to list files')
    }
  }

  /**
   * Delete file
   */
  async deleteFile(fileId: string, tenantId: string): Promise<void> {
    try {
      const file = await prisma.file.findFirst({
        where: { id: fileId, tenantId }
      })

      if (!file) {
        throw new FileProcessingError('File not found')
      }

      // Delete from storage (implement based on your storage provider)
      await this.deleteFileFromStorage(file.url)

      // Delete from database
      await prisma.file.delete({
        where: { id: fileId }
      })
    } catch (error) {
      console.error('Delete file error:', error)
      throw new FileProcessingError('Failed to delete file')
    }
  }

  /**
   * Delete file from storage
   */
  private async deleteFileFromStorage(url: string): Promise<void> {
    // Implement based on your storage provider (Supabase, AWS S3, etc.)
    console.log(`Deleting file from storage: ${url}`)
  }

  /**
   * Cleanup resources
   */
  async dispose(): Promise<void> {
    if (this.tesseractWorker) {
      await this.tesseractWorker.terminate()
    }
  }
} 