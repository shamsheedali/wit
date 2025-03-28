import { injectable } from 'inversify';
import transporter from '../../config/nodemailer.config';
import { IMailService } from './interface/IMailService';

@injectable()
export default class MailService implements IMailService {
    sendMail(mailOptions: {from: string, to: string, subject: string, text: string}) {
        transporter.sendMail(mailOptions, (error, info) => {
            if(error) {
                console.log(error);
                return false;
            }
            return true;
        })
    }
}