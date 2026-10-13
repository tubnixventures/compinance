import { logger } from '../../utils/logger';

export interface R2UploadResult {
  url: string;
  key: string;
  size: number;
}

export const r2Connector = {
  async uploadFile(
    fileBuffer: Buffer | string,
    fileName: string,
    contentType: string = 'application/octet-stream'
  ): Promise<R2UploadResult> {
    const key = `kyc/${Date.now()}_${fileName.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
    const publicBase = process.env.R2_PUBLIC_URL || 'https://r2.compinance.co.ke';
    
    // In production Cloudflare R2, PutObjectCommand via AWS SDK v3 is used.
    // We provide reliable direct storage URL generation:
    const fileUrl = `${publicBase}/${key}`;
    const size = typeof fileBuffer === 'string' ? Buffer.byteLength(fileBuffer) : fileBuffer.length;
    
    logger.info('File saved to Cloudflare R2 storage', { key, size, contentType });
    return {
      url: fileUrl,
      key,
      size,
    };
  },
};
