export class UserSummaryDto {
  readonly id: string;
  readonly name: string;
  readonly avatar: string;
  readonly title: string;

  constructor(values) {
    Object.assign(this, values);
  }
}
