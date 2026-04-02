const nodemailer = require("nodemailer");
const crypto = require("crypto");

let transporter;

if (process.env.SMTP_HOST && process.env.SMTP_PORT) {
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
} else {
  // Mock transporter logging to console
  transporter = {
    sendMail: async (mailOptions) => {
      console.log("\n--- Mock Email Sent ---");
      console.log("To:", mailOptions.to);
      console.log("Subject:", mailOptions.subject);
      console.log("Text Body:", mailOptions.text);
      console.log("HTML Body:", mailOptions.html);
      console.log("------------------------\n");
      return true;
    }
  };
}

exports.sendVerificationEmail = async (email, token) => {
  const verifyLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email?token=${token}`;
  
  await transporter.sendMail({
    from: process.env.SMTP_FROM || '"Milliy Sertifikat" <noreply@milliysertifikat.uz>',
    to: email,
    subject: "Elektron pochtangizni tasdiqlang - Milliy Sertifikat",
    text: `Pochtangizni tasdiqlash uchun ushbu havolaga o'ting: ${verifyLink}`,
    html: `
      <h2>Xush kelibsiz!</h2>
      <p>Pochtangizni tasdiqlash uchun quyidagi tugmani bosing:</p>
      <a href="${verifyLink}" style="padding:10px 20px; background:#007bff; color:#fff; text-decoration:none; border-radius:5px;">Tasdiqlash</a>
      <p>Yoki havoladan foydalaning: <a href="${verifyLink}">${verifyLink}</a></p>
    `,
  });
};

exports.sendPasswordResetEmail = async (email, token) => {
  const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${token}`;
  
  await transporter.sendMail({
    from: process.env.SMTP_FROM || '"Milliy Sertifikat" <noreply@milliysertifikat.uz>',
    to: email,
    subject: "Parolni tiklash - Milliy Sertifikat",
    text: `Parolni tiklash uchun ushbu havolaga o'ting: ${resetLink}. U 1 soat davomida amal qiladi.`,
    html: `
      <h2>Parolingizni tiklash</h2>
      <p>Yangi parol o'rnatish uchun quyidagi tugmani bosing:</p>
      <a href="${resetLink}" style="padding:10px 20px; background:#ff4444; color:#fff; text-decoration:none; border-radius:5px;">Parolni tiklash</a>
      <p>Yoki havoladan foydalaning: <a href="${resetLink}">${resetLink}</a></p>
      <p>Ushbu havola 1 soatdan so'ng o'z kuchini yo'qotadi.</p>
    `,
  });
};

exports.generateToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

exports.generateOtp = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

exports.sendOtpEmail = async (email, otpCode) => {
  await transporter.sendMail({
    from: process.env.SMTP_FROM || '"Milliy Sertifikat" <noreply@milliysertifikat.uz>',
    to: email,
    subject: "Tasdiqlash kodi - Milliy Sertifikat",
    text: `Sizning tasdiqlash kodingiz: ${otpCode}. Kod 5 daqiqa amal qiladi.`,
    html: `
      <div style="font-family:Inter,Arial,sans-serif; text-align:center; padding:40px;">
        <h2 style="margin-bottom:8px;">🔐 Tasdiqlash kodi</h2>
        <p style="color:#64748b;">Tizimga kirish uchun quyidagi kodni kiriting:</p>
        <div style="display:inline-block; padding:16px 40px; background:#f8fafc; border:2px dashed #3b82f6; border-radius:16px; margin:20px 0;">
          <h1 style="font-size:36px; letter-spacing:8px; color:#0f172a; margin:0;">${otpCode}</h1>
        </div>
        <p style="color:#94a3b8; font-size:13px;">Kod 5 daqiqa davomida amal qiladi.</p>
      </div>
    `,
  });
};

