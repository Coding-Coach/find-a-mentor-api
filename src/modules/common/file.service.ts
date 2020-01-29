import { Injectable } from '@nestjs/common';
import { FileMeta } from './interfaces/user.interface';

@Injectable()
export class FileService {
  async removeFile(file: FileMeta) {}
}
