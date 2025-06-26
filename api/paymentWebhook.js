import { buffer } from 'micro';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end('Method Not Allowed');

  const buf = await buffer(req);
  const rawBody = buf.toString();

  // Здесь добавь проверку подписи webhook от платёжной системы

  // Парсим данные оплаты
  const event = JSON.parse(rawBody);

  if (event.type === 'payment_success') {
    const { email, package } = event.data;

    // Запускаем генерацию PDF/Excel/QR
    // Вызов функции генерации (пиши свою логику)

    // Отправляем email клиенту

    return res.status(200).json({ received: true });
  }

  res.status(400).end();
}
