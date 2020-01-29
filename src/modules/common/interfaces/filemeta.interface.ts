export interface FileMeta extends Document {
  readonly fieldname: String;
  readonly originalname: String;
  readonly encoding: String;
  readonly mimetype: String;
  readonly destination: String;
  readonly filename: String;
  readonly path: String;
  readonly size: Number;
}
