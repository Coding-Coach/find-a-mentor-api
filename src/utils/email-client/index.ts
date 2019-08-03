import Config from '../../config';
import * as sgMail from '@sendgrid/mail';


const defaults = {
    from: 'Coding Coach <no-reply@mail.codingcoach.io>',
};

// TODO: Convert this to a service.
class EmailFacade {
    constructor() {
        sgMail.setApiKey(Config.sendGrid.API_KEY);
    }
    
    send(data: any) {
        const newData = Object.assign({}, defaults, data)
        return sgMail.send(newData);
    }
    
}

// No point in instantiating this thing more than once, 
// so it's safe to use a singleton here.  Also freeze the object
// so it can't be abused later.  👀
const emailClient = new EmailFacade()
Object.freeze(emailClient)


export default emailClient