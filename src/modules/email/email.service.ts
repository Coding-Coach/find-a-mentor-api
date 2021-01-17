import Config from '../../config';
import * as sgMail from '@sendgrid/mail';
import * as sgClient from '@sendgrid/client';
import { SendData } from './interfaces/email.interface';
import { Injectable } from '@nestjs/common';
import { User } from '../common/interfaces/user.interface';

const isProduction = process.env.NODE_ENV === 'production';
const defaults = {
  from: Config.email.FROM,
};

const DEV_TESTING_LIST = '423467cd-c4bd-410c-ad52-adcd8dfbc389';

@Injectable()
export class EmailService {
  constructor() {
    sgMail.setApiKey(Config.sendGrid.API_KEY);
    sgClient.setApiKey(Config.sendGrid.API_KEY);
  }

  static LIST_IDS = {
    // We are adding all dev/testing contacts to a dev list, so we can remove them easly
    MENTORS: isProduction
      ? '3e581cd7-9b14-4486-933e-1e752557433f'
      : DEV_TESTING_LIST,
    NEWSLETTER: isProduction
      ? '6df91cab-90bd-4eaa-9710-c3804f8aba01'
      : DEV_TESTING_LIST,
  };

  async send<TemplateParams>(data: SendData<TemplateParams>) {
    const newData = Object.assign({}, defaults, data);
    return await sgMail.send(newData);
  }

  async addMentor(contact: User) {
    const request = {
      json: undefined, // <--- I spent hours finding out why Sendgrid was returning 400 error, this fixed the issue
      method: 'PUT',
      url: '/v3/marketing/contacts',
      body: JSON.stringify({
        list_ids: [EmailService.LIST_IDS.MENTORS],
        contacts: [
          {
            email: contact.email,
            first_name: contact.name,
            country: contact.country,
            custom_fields: {
              // We can clean our list in SG with this field
              e2_T: isProduction ? 'production' : 'development',
            },
          },
        ],
      }),
    };

    return await sgClient.request(request);
  }

  async getContactId(email: string): Promise<SendgridSearchResult> {
    const request = {
      json: undefined,
      method: 'POST',
      url: '/v3/marketing/contacts/search',
      body: JSON.stringify({
        query: `email = '${email}'`,
      }),
    };

    const response: [ClientResponse, any] = await sgClient.request(request);

    if (response[0].statusCode == 200) {
      const sendgridResponse: SendgridSearchResult = JSON.parse(
        response[0].body,
      );
      return sendgridResponse;
    }

    Promise.resolve(null);
  }

  async deleteContact(contactId: string) {
    const request = {
      json: undefined,
      method: 'DELETE',
      url: '/v3/marketing/contacts?ids=' + contactId,
    };

    const response: [ClientResponse, any] = await sgClient.request(request);
  }
}
