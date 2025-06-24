import QRCode from "qrcode";

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).send('Only POST allowed');
  }

  const { link } = req.body;

  if (!link) {
    return res.status(400).json({ error: 'No link provided' });
  }

  try {
    const qr = await QRCode.toDataURL(link);
    res.status(200).json({ qr });
  } catch (err) {
    res.status(500).json({ error: 'QR generation failed' });
  }
}
