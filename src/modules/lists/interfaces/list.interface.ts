import { Document, ObjectID } from 'mongoose';
import { User } from '../../common/interfaces/user.interface';

export interface List extends Document {
  readonly _id: ObjectID;
  readonly user: ObjectID;
  readonly name: string;
  readonly public: boolean;
  readonly mentors: User[];
  readonly createdAt: Date;
  readonly updatedAt: Date;
}
