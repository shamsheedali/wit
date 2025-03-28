export interface IMailService {
    sendMail(mailOptions: {
      from: string;
      to: string;
      subject: string;
      text: string;
    }): void;
  }