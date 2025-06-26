import { buffer } from 'micro';

export const config = {
  api: {
    bodyParser: false,
  },
};

// Здесь нужно импортировать или подключить логику генерации файлов и отправки email
import { generateFiles, sendEmail } from './generateDocuments';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).end('Method Not Allowed');
  }

  const buf = await buffer(req);
  const rawBody = buf.toString();

  // TODO: Добавить проверку подписи webhook от PayPal (с помощью их SDK или по документации)

  let event;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return res.status(400).end('Invalid JSON');
  }

  if (event.event_type === 'PAYMENT.CAPTURE.COMPLETED') {
    const email = event.resource.payer.email_address;
    const packageName = event.resource.custom_id; // Или другой параметр, где у тебя название пакета

    try {
      await generateFiles(email, packageName);
      await sendEmail(email);
      return res.status(200).json({ received: true });
    } catch (err) {
      console.error(err);
      return res.status(500).end('Error generating files or sending email');
    }
  }

  res.status(400).end();
}
