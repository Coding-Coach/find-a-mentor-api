
const regexp: RegExp = /^[0-9a-fA-F]{24}$/;

export function isObjectId(value: string = ''): boolean {
  return regexp.test(value);
}
