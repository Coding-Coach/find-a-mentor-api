import { Document, ObjectID } from 'mongoose';

export enum Status {
  APPROVED = 'Approved',
  PENDING = 'Pending',
  REJECTED = 'Rejected',
}

export interface Application extends Document {
  readonly _id: ObjectID;
  readonly status: Status;
  readonly user: ObjectID;
  readonly reason: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}
