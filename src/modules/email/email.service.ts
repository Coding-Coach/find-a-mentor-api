import Config from '../../config';
import * as sgMail from '@sendgrid/mail';
import * as sgClient from '@sendgrid/client';
import { EmailParams, SendData } from './interfaces/email.interface';
import { Injectable } from '@nestjs/common';
import { User } from '../common/interfaces/user.interface';
import { promises } from 'fs';
import { compile } from 'ejs';

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

  private getTemplateContent(name: string) {
    return promises.readFile(`content/email_templates/${name}.html`, {
      encoding: 'utf8',
    });
  }

  get layout() {
    return this.getTemplateContent('layout');
  }

  async send<TemplateParams>(data: SendData<TemplateParams>) {
    const newData = Object.assign({}, defaults, data);
    return await sgMail.send(newData);
  }

  async sendLocalTemplate(params: EmailParams) {
    const { to, subject, data = {}, name } = params;
    const content = await this.injectData(name, data);
    try {
      await sgMail.send({
        to,
        subject,
        html: content,
        from: Config.email.FROM,
      });
    } catch (error) {
      // tslint:disable-next-line:no-console
      console.log('Send email error', params, JSON.stringify(error, null, 2));
    }
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

  private async injectData(name: string, data: Record<string, string>) {
    const template = await this.getTemplateContent(name);
    const layout = await this.layout;
    const content = compile(template)(data);
    return compile(layout)({ content });
  }
}
