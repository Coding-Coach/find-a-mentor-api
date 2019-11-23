export class FilterDto {
  readonly id: string;
  readonly label: string;

  constructor(values) {
    Object.assign(this, values);
  }
}
