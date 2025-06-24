import QRCode from "qrcode";

export default async function handler(req, res) {
  console.log('API generate-qr called');
  
  if (req.method !== 'POST') {
    console.log('Method not allowed:', req.method);
    return res.status(405).send('Only POST allowed');
  }

  const { link } = req.body;
  console.log('Link received:', link);

  if (!link) {
    console.log('No link provided');
    return res.status(400).json({ error: 'No link provided' });
  }

  try {
    const qr = await QRCode.toDataURL(link);
    console.log('QR generated successfully');
    res.status(200).json({ qr });
  } catch (err) {
    console.error('QR generation failed:', err);
    res.status(500).json({ error: 'QR generation failed' });
  }
}
