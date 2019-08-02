import Config from '../../config';
import * as sgMail from '@sendgrid/mail';


const defaults = {
    from: 'Coding Coach <no-reply@mail.codingcoach.io>',
};


class EmailFacade {
    constructor() {
        sgMail.setApiKey(Config.sendGrid.API_KEY);
    }
    
    send(data: any) {
        const newData = Object.assign({}, defaults, data)
        return sgMail.send(newData);
    }
    
}


const emailClient = new EmailFacade()
Object.freeze(emailClient)


export default emailClient