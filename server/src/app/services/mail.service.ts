import { injectable } from 'inversify';
import transporter from '../../config/nodemailer.config';

@injectable()
export default class MailService {
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