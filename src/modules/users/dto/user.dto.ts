
export class UserDto {
  readonly id: string;
  readonly email: string;
  readonly name: string;
  readonly avatar: string;
  readonly title: string;
  readonly description: string;
  readonly country: string;
  readonly spokenLanguages: string[];
  readonly tags: string[];

  constructor(values) {
    Object.assign(this, values);
  }
}
