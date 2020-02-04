import * as fs from 'fs';
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
}
