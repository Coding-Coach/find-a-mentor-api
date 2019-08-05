import Config from '../../config';
import * as sgMail from '@sendgrid/mail';
import {SendData} from './interfaces/email.interface'
import { Injectable } from '@nestjs/common';


const defaults = {
    from: 'Coding Coach <no-reply@mail.codingcoach.io>',
};


@Injectable
class EmailProvider {
    constructor() {
        sgMail.setApiKey(Config.sendGrid.API_KEY);
    }
    
    send(data: SendData) {
        const newData = Object.assign({}, defaults, data)
        return sgMail.send(newData);
    }
}

export default EmailProvider