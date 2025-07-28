import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { StorageProvider } from '../types';

export class S3Storage implements StorageProvider {
  constructor(
    private s3Client: S3Client,
    private bucketName: string
  ) {}

  async upload(filePath: string, buffer: Buffer, mimeType?: string): Promise<void> {
    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: filePath,
      Body: buffer,
      ContentType: mimeType
    });

    await this.s3Client.send(command);
  }

  async download(filePath: string): Promise<Buffer> {
    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: filePath
    });

    const response = await this.s3Client.send(command);
    
    if (!response.Body) {
      throw new Error('File not found');
    }

    const chunks: Uint8Array[] = [];
    for await (const chunk of response.Body as any) {
      chunks.push(chunk);
    }
    
    return Buffer.concat(chunks);
  }

  async delete(filePath: string): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: this.bucketName,
      Key: filePath
    });

    await this.s3Client.send(command);
  }

  async exists(filePath: string): Promise<boolean> {
    try {
      const command = new HeadObjectCommand({
        Bucket: this.bucketName,
        Key: filePath
      });
      
      await this.s3Client.send(command);
      return true;
    } catch (error: any) {
      if (error.name === 'NotFound') {
        return false;
      }
      throw error;
    }
  }

  async getSize(filePath: string): Promise<number> {
    const command = new HeadObjectCommand({
      Bucket: this.bucketName,
      Key: filePath
    });

    const response = await this.s3Client.send(command);
    return response.ContentLength || 0;
  }
}