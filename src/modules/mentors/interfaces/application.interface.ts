import { Document } from 'mongoose';

export enum Status {
  ACCEPTED = 'Accepted',
  PENDING = 'Pending',
  REJECTED = 'Rejected',
};

export interface Application extends Document {
  readonly _id: string;
  readonly status: Status;
  readonly reason: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}
