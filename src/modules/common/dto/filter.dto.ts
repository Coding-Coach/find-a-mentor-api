
export class Filter {
  readonly id: string;
  readonly label: string;

  constructor(values) {
    Object.assign(this, values);
  }
}
