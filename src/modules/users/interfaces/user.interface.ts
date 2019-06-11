import { Document, ObjectID } from 'mongoose';

export enum Role {
  ADMIN = 'Admin',
  MENTOR = 'Mentor',
  MEMBER = 'Member',
}

export interface User extends Document {
  readonly _id: ObjectID;
  readonly auth0Id: string;
  readonly email: string;
  readonly name: string;
  readonly avatar: string;
  readonly title: string;
  readonly description: string;
  readonly country: string;
  readonly spokenLanguages: string[];
  readonly tags: string[];
  readonly roles: Role[];
}
