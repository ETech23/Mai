const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "Zoho",
  auth: {
    user: process.env.ZOHO_EMAIL,
    pass: process.env.ZOHO_PASSWORD,
  },
});

async function sendVerificationEmail(email, token) {
  const verificationLink = `${process.env.FRONTEND_URL}/email-verified.html?token=${token}`;

  await transporter.sendMail({
    from: process.env.ZOHO_EMAIL,
    to: email,
    subject: "Verify Your Email",
    html: `<p>Click the link below to verify your email:</p>
           <a href="${verificationLink}">${verificationLink}</a>
           <p>This link expires in 24 hours.</p>`,
  });
}

module.exports = { sendVerificationEmail };
