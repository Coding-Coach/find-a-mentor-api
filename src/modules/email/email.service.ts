import Config from '../../config';
import * as sgMail from '@sendgrid/mail';
import {SendData} from './interfaces/email.interface'
import { Injectable } from '@nestjs/common';


const defaults = {
    from: Config.email.FROM,
};


@Injectable()
export class EmailService {
    constructor() {
        sgMail.setApiKey(Config.sendGrid.API_KEY);
    }

    static TEMPLATE_IDS = {
        WELCOME_MESSAGE: 'd-1434be390e1b4288b8011507f1c8d786',
        MENTOR_APPLICATION_RECEIVED: 'd-bf78306901e747a7b3f92761b9884f2e',
        MENTOR_APPLICATION_APPROVED: 'd-88dc20e5dd164510a32f659f9347824e',
        MENTOR_APPLICATION_REJECTED: 'd-ad08366d02654587916a41bb3270afed',
    }
    
    send(data: SendData) {
        const newData = Object.assign({}, defaults, data)
        return sgMail.send(newData);
    }
}
