import { injectable } from 'inversify';
import transporter from '../../config/nodemailer.config';
import { IMailService } from './interface/IMailService';
import log from '../../utils/logger';

@injectable()
export default class MailService implements IMailService {
  sendMail(mailOptions: { from: string; to: string; subject: string; text: string }) {
    transporter.sendMail(mailOptions, (error, _info) => {
      if (error) {
        log.info(error);
        return false;
      }
      return true;
    });
  }
}
