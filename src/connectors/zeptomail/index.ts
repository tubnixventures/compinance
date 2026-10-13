import { logger } from '../../utils/logger';

export interface EmailParams {
  toEmail: string;
  toName: string;
  subject: string;
  htmlContent: string;
}

export const zeptomailConnector = {
  async sendEmail(params: EmailParams): Promise<{ success: boolean; messageId: string }> {
    const token = process.env.ZEPTOMAIL_API_TOKEN;
    const sender = process.env.ZEPTOMAIL_SENDER_EMAIL || 'noreply@compinance.co.ke';
    const senderName = process.env.ZEPTOMAIL_SENDER_NAME || 'Compinance Loans';

    if (token && token !== 'zeptomail_api_token') {
      try {
        const res = await fetch('https://api.zeptomail.com/v1.1/email', {
          method: 'POST',
          headers: {
            Authorization: `Zoho-enczapikey ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: { address: sender, name: senderName },
            to: [{ email_address: { address: params.toEmail, name: params.toName } }],
            subject: params.subject,
            htmlbody: params.htmlContent,
          }),
        });
        if (res.ok) {
          logger.info('ZeptoMail email dispatched', { to: params.toEmail, subject: params.subject });
          return { success: true, messageId: `zm_${Date.now()}` };
        }
      } catch (err) {
        logger.error('ZeptoMail API error', err);
      }
    }

    logger.info('[Simulated ZeptoMail Delivery]', {
      to: params.toEmail,
      subject: params.subject,
    });
    return { success: true, messageId: `sim_zm_${Date.now()}` };
  },
};
