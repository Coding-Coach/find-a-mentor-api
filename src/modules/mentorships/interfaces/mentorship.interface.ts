import { Document } from 'mongoose';
import { ObjectID } from 'mongodb';

export enum Status {
  NEW = 'New',
  VIEWED = 'Viewed',
  APPROVED = 'Approved',
  REJECTED = 'Rejected',
  CANCELLED = 'Cancelled',
  TERMINATED = 'Terminated',
}

export interface Mentorship extends Document {
  readonly _id: ObjectID;
  readonly mentor: ObjectID;
  readonly mentee: ObjectID;
  status: Status;
  readonly message: string;
  readonly goals: string[];
  readonly expectation: string;
  readonly background: string;
  reason: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly reminderSentAt?: Date;
}
