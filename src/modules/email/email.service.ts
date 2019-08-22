import Config from '../../config';
import * as sgMail from '@sendgrid/mail';
import * as sgClient from '@sendgrid/client';
import { SendData } from './interfaces/email.interface';
import { Injectable } from '@nestjs/common';
import { User } from '../common/interfaces/user.interface';

const defaults = {
  from: Config.email.FROM,
};

@Injectable()
export class EmailService {
  constructor() {
    sgMail.setApiKey(Config.sendGrid.API_KEY);
    sgClient.setApiKey(Config.sendGrid.API_KEY);
  }

  static TEMPLATE_IDS = {
    WELCOME_MESSAGE: 'd-1434be390e1b4288b8011507f1c8d786',
    MENTOR_APPLICATION_RECEIVED: 'd-bf78306901e747a7b3f92761b9884f2e',
    MENTOR_APPLICATION_APPROVED: 'd-88dc20e5dd164510a32f659f9347824e',
    MENTOR_APPLICATION_REJECTED: 'd-ad08366d02654587916a41bb3270afed',
  };

  static LIST_IDS = {
    MENTORS: '3e581cd7-9b14-4486-933e-1e752557433f',
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
        contacts: [{
          email: contact.email,
          first_name: contact.name,
          country: contact.country,
        }]
      }),
    };
    
    return await sgClient.request(request);
  }
}
