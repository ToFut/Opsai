import { SupabaseClient } from '@supabase/supabase-js';
import { StorageProvider } from '../types';

export class SupabaseStorage implements StorageProvider {
  constructor(
    private supabaseClient: SupabaseClient,
    private bucketName: string
  ) {}

  async upload(filePath: string, buffer: Buffer, mimeType?: string): Promise<void> {
    const { data, error } = await this.supabaseClient
      .storage
      .from(this.bucketName)
      .upload(filePath, buffer, {
        contentType: mimeType,
        upsert: true
      });

    if (error) {
      throw new Error(`Failed to upload to Supabase Storage: ${error.message}`);
    }
  }

  async download(filePath: string): Promise<Buffer> {
    const { data, error } = await this.supabaseClient
      .storage
      .from(this.bucketName)
      .download(filePath);

    if (error) {
      throw new Error(`Failed to download from Supabase Storage: ${error.message}`);
    }

    if (!data) {
      throw new Error('File not found');
    }

    return Buffer.from(await data.arrayBuffer());
  }

  async delete(filePath: string): Promise<void> {
    const { error } = await this.supabaseClient
      .storage
      .from(this.bucketName)
      .remove([filePath]);

    if (error) {
      throw new Error(`Failed to delete from Supabase Storage: ${error.message}`);
    }
  }

  async exists(filePath: string): Promise<boolean> {
    const { data, error } = await this.supabaseClient
      .storage
      .from(this.bucketName)
      .list(filePath.substring(0, filePath.lastIndexOf('/')), {
        limit: 1,
        search: filePath.substring(filePath.lastIndexOf('/') + 1)
      });

    if (error) {
      return false;
    }

    return data && data.length > 0;
  }

  async getSize(filePath: string): Promise<number> {
    const { data, error } = await this.supabaseClient
      .storage
      .from(this.bucketName)
      .list(filePath.substring(0, filePath.lastIndexOf('/')), {
        limit: 1,
        search: filePath.substring(filePath.lastIndexOf('/') + 1)
      });

    if (error || !data || data.length === 0) {
      throw new Error('File not found');
    }

    return data[0].metadata?.size || 0;
  }
}