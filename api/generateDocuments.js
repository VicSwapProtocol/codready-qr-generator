import PDFDocument from 'pdfkit';
import ExcelJS from 'exceljs';
import QRCode from 'qrcode';
import nodemailer from 'nodemailer';

async function createPDF(email, packageName) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument();
      const chunks = [];

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.text(`Certificate for ${email}`);
      doc.text(`Package: ${packageName}`);
      doc.end();

      doc.on('end', () => {
        const result = Buffer.concat(chunks);
        resolve(result);
      });
    } catch (err) {
      reject(err);
    }
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
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,       // из .env
      pass: process.env.EMAIL_PASSWORD,   // из .env
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

export async function generateFiles(email, packageName) {
  const pdf = await createPDF(email, packageName);
  const excel = await createExcel(email, packageName);
  const qr = await createQR(email, packageName);

  await sendEmail(email, [
    { filename: 'certificate.pdf', content: pdf },
    { filename: 'codes.xlsx', content: excel },
    { filename: 'qrcode.png', content: qr },
  ]);
}

export async function sendEmail(email) {
  // Можно убрать, так как отправка внутри generateFiles
}
