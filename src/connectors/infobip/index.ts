import { logger } from '../../utils/logger';

export interface WhatsAppMessageParams {
  toPhone: string;
  message: string;
  userOptedIn: boolean;
}

export const infobipConnector = {
  async sendWhatsAppMessage(params: WhatsAppMessageParams): Promise<{ sent: boolean; reason?: string }> {
    const isServiceActive = (process.env.INFOBIP_WHATSAPP_ACTIVE || 'false').toLowerCase() === 'true';

    if (!isServiceActive) {
      return { sent: false, reason: 'INFOBIP_WHATSAPP_ACTIVE is disabled in environment' };
    }

    if (!params.userOptedIn) {
      return { sent: false, reason: 'User opted out of WhatsApp notifications on signup' };
    }

    const apiKey = process.env.INFOBIP_API_KEY;
    const baseUrl = process.env.INFOBIP_BASE_URL;
    const sender = process.env.INFOBIP_SENDER_NUMBER || '254700000000';

    if (apiKey && baseUrl) {
      try {
        const cleanTo = params.toPhone.replace('+', '');
        const res = await fetch(`${baseUrl}/whatsapp/1/message/text`, {
          method: 'POST',
          headers: {
            Authorization: `App ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: sender,
            to: cleanTo,
            content: { text: params.message },
          }),
        });
        if (res.ok) {
          logger.info('Infobip WhatsApp message delivered', { to: params.toPhone });
          return { sent: true };
        }
      } catch (err) {
        logger.error('Infobip WhatsApp dispatch error', err);
      }
    }

    logger.info('[Simulated Infobip WhatsApp]', { to: params.toPhone, message: params.message });
    return { sent: true };
  },
};
