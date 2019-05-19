
export class UserDto {
  readonly email: string;
  readonly name: string;
  readonly avatar: string;
  readonly title: string;
  readonly description: string;
  readonly country: string;
  readonly spokenLanguages: Array<string>;
  readonly tags: Array<string>;
}
