import { Document } from 'mongoose';

export interface User extends Document {
  readonly id: string;
  readonly email: string;
  readonly name: string;
  readonly avatar: string;
  readonly title: string;
  readonly description: string;
  readonly country: string;
  readonly spokenLanguages: Array<string>;
  readonly tags: Array<string>;
}
