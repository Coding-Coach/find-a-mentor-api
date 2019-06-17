import { Document } from 'mongoose';

export enum Role {
  ADMIN = 'Admin',
  MENTOR = 'Mentor',
  MEMBER = 'Member',
};

export enum Channel {
  EMAIL = 'email', 
  SLACK = 'slack',
  LINKED = 'linkedin', 
  FACEBOOK = 'facebook',
  TWITTER = 'twitter',
  GITHUB = 'github', 
  WEBSITE = 'website',
}

export interface User extends Document {
  readonly id: string;
  readonly email: string;
  readonly name: string;
  readonly avatar: string;
  readonly title: string;
  readonly description: string;
  readonly country: string;
  readonly spokenLanguages: string[];
  readonly tags: string[];
  readonly roles: Role[];
  readonly channels: Channel[];
}
