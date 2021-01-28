import { SendgridContact } from './contact.interface';

export interface SendgridSearchResult {
  contact_count: number;
  result: SendgridContact[];
}
