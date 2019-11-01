import { Document } from 'mongoose';

export interface UpdateList extends Document {
  name?: string;
  public?: boolean;
}
