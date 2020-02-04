export interface FileMeta extends Document {
  readonly fieldname: string;
  readonly originalname: string;
  readonly encoding: string;
  readonly mimetype: string;
  readonly destination: string;
  readonly filename: string;
  readonly path: string;
  readonly size: number;
}
