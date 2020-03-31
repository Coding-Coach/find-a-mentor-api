import * as fs from 'fs';
import * as sharp from 'sharp';
import { Injectable } from '@nestjs/common';

@Injectable()
export class FileService {
  async removeFile(path: string): Promise<boolean> {
    try {
      if (fs.existsSync(path)) {
        fs.unlinkSync(path);
      }

      return Promise.resolve(true);
    } catch (error) {
      return Promise.resolve(false);
    }
  }

  async createThumbnail(
    source: string,
    destination: string,
    options: any,
  ): Promise<boolean> {
    const buffer = await sharp(source)
      .resize(options.width, options.height)
      .toBuffer();
    const img = buffer.toString('base64');

    fs.writeFileSync(destination, img, { encoding: 'base64' });

    return Promise.resolve(true);
  }
}
