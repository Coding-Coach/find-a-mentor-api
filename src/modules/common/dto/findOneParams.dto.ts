import { IsMongoId } from 'class-validator';

export class FindOneParams {
  @IsMongoId()
  id: string;
}
