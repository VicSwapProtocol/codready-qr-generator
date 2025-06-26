import PDFDocument from 'pdfkit';
import ExcelJS from 'exceljs';
import QRCode from 'qrcode';
import nodemailer from 'nodemailer';

export const config = {
  api: {
    bodyParser: false,
  },
};

async function createPDF(email, packageName) {
  const doc = new PDFDocument();
  const chunks = [];
  doc.on('data', (chunk) => chunks.push(chunk));
  doc.text(`Certificate for ${email}`);
  doc.text(`Package: ${packageName}`);
  doc.end();

  return new Promise((resolve) => {
    doc.on('end', () => resolve(Buffer.concat(chunks)));
  });
}

async function createExcel(email, packageName) {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Sheet1');
  sheet.addRow(['Email', 'Package']);
  sheet.addRow([email, packageName]);

  return workbook.xlsx.writeBuffer();
}

async function createQR(email, packageName) {
  const data = `Email: ${email}, Package: ${packageName}`;
  return QRCode.toBuffer(data);
}

async function sendEmail(email, attachments) {
  let transporter = nodemailer.createTransport({
    service: 'gmail', // Можно заменить на любой SMTP
    auth: {
      user: process.env.EMAIL_USER,    // Укажи в Vercel переменную окружения
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  await transporter.sendMail({
    from: `"CodReady" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Your Codes and Certificates',
    text: 'Please find attached your files.',
    attachments: attachments,
  });
}

async function generateFiles(email, packageName) {
  const pdf = await createPDF(email, packageName);
  const excel = await createExcel(email, packageName);
  const qr = await createQR(email, packageName);

  await sendEmail(email, [
    { filename: 'certificate.pdf', content: pdf },
    { filename: 'codes.xlsx', content: excel },
    { filename: 'qrcode.png', content: qr },
  ]);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end('Method Not Allowed');

  let buf = [];
  for await (const chunk of req) {
    buf.push(chunk);
  }
  const rawBody = Buffer.concat(buf).toString();

  let event;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return res.status(400).end('Invalid JSON');
  }

  if (event.type === 'payment_success') {
    const { email, package: packageName } = event.data;

    try {
      await generateFiles(email, packageName);
      return res.status(200).json({ received: true });
    } catch (err) {
      console.error(err);
      return res.status(500).end('Error generating files or sending email');
    }
  }

  return res.status(400).end();
}
