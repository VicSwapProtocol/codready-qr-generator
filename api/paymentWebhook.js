import { buffer } from 'micro';
import paypal from '@paypal/checkout-server-sdk';
import { generateFiles } from './generateDocuments';

// Настройка PayPal среды
const environment = new paypal.core.SandboxEnvironment(
  process.env.PAYPAL_CLIENT_ID,
  process.env.PAYPAL_CLIENT_SECRET
);
const client = new paypal.core.PayPalHttpClient(environment);

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end('Method Not Allowed');

  const buf = await buffer(req);
  const rawBody = buf.toString();

  // Заголовки для проверки подписи
  const transmissionId = req.headers['paypal-transmission-id'];
  const transmissionTime = req.headers['paypal-transmission-time'];
  const certUrl = req.headers['paypal-cert-url'];
  const authAlgo = req.headers['paypal-auth-algo'];
  const transmissionSig = req.headers['paypal-transmission-sig'];
  const webhookId = process.env.PAYPAL_WEBHOOK_ID;

  // Проверка подписи webhook
  const verifyReq = new paypal.notifications.VerifyWebhookSignatureRequest();
  verifyReq.requestBody({
    auth_algo: authAlgo,
    cert_url: certUrl,
    transmission_id: transmissionId,
    transmission_sig: transmissionSig,
    transmission_time: transmissionTime,
    webhook_id: webhookId,
    webhook_event: JSON.parse(rawBody),
  });

  try {
    const verifyResponse = await client.execute(verifyReq);
    if (verifyResponse.result.verification_status !== 'SUCCESS') {
      return res.status(400).end('Invalid webhook signature');
    }
  } catch (error) {
    console.error('Webhook signature verification error:', error);
    return res.status(500).end('Error verifying webhook signature');
  }

  let event;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return res.status(400).end('Invalid JSON');
  }

  if (event.event_type === 'PAYMENT.CAPTURE.COMPLETED') {
    const email = event.resource.payer.email_address;
    const packageName = event.resource.custom_id || 'default_package';

    try {
      await generateFiles(email, packageName);
      return res.status(200).json({ received: true });
    } catch (err) {
      console.error('Error generating files:', err);
      return res.status(500).end('Error generating files');
    }
  }

  res.status(400).end();
}
