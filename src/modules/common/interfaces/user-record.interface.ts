import { Document, ObjectID } from 'mongoose';

export enum UserRecordType {
  MentorNotResponding = 1,
}

export interface UserRecord extends Document {
  readonly _id: ObjectID;
  user: string;
  type: UserRecordType;
}
