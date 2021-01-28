import { SendgridSearchResult } from './searchResult.interface';
export interface SendgridResponse {
  statusCode: number;
  body: SendgridSearchResult;
}
