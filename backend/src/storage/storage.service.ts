import { Injectable, Logger } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class StorageService {
  private supabase!: SupabaseClient;
  private readonly logger = new Logger(StorageService.name);

  constructor() {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      this.logger.warn('SUPABASE_URL ou SUPABASE_KEY não configurados. Upload de arquivos não funcionará.');
    } else {
      this.supabase = createClient(supabaseUrl, supabaseKey);
    }
  }

  async uploadFile(file: Express.Multer.File, path: string, bucket: string = 'avatars'): Promise<string> {
    if (!this.supabase) {
      throw new Error('Serviço de storage não configurado.');
    }

    const { data, error } = await this.supabase.storage
      .from(bucket)
      .upload(path, file.buffer, {
        contentType: file.mimetype,
        upsert: true,
      });

    if (error) {
      this.logger.error(`Erro ao fazer upload para Supabase: ${error.message}`);
      throw error;
    }

    // Retorna a URL pública
    const { data: publicUrlData } = this.supabase.storage
      .from(bucket)
      .getPublicUrl(data.path);

    return publicUrlData.publicUrl;
  }
}
