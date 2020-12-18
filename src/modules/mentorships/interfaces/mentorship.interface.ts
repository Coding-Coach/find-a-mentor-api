import { Document, ObjectID } from 'mongoose';

export enum Status {
  NEW = 'New',
  VIEWED = 'Viewed',
  APPROVED = 'Approved',
  REJECTED = 'Rejected',
  TERMINATED = 'Terminated',
}

export interface Mentorship extends Document {
  readonly _id: ObjectID;
  readonly mentor: ObjectID;
  readonly mentee: ObjectID;
  readonly status: Status;
  readonly message: String;
  readonly goals: String[];
  readonly expectation: String;
  readonly background: String;
  readonly reason: String;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}
