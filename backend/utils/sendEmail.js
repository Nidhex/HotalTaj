const nodemailer = require('nodemailer');

/**
 * Utility function to send an email using Nodemailer.
 * Configured using environment SMTP settings.
 * @param {Object} options Configuration options
 * @param {String} options.email Receiver email address
 * @param {String} options.subject Email subject line
 * @param {String} options.message Plain text message fallback
 * @param {String} options.html HTML email template body
 */
const sendEmail = async (options) => {
  // Create transporter using SMTP credentials in environment
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'sandbox.smtp.mailtrap.io',
    port: process.env.SMTP_PORT || 2525,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  // Compose email packet
  const mailOptions = {
    from: `"${process.env.FROM_NAME || 'RajMahal Palace & Resorts'}" <${process.env.FROM_EMAIL || 'noreply@rajmahalpalace.com'}>`,
    to: options.email,
    subject: options.subject,
    text: options.message,
    html: options.html,
  };

  // Dispatch email
  const info = await transporter.sendMail(mailOptions);

  console.log(`[Email Sent] Message sent successfully to ${options.email} (ID: ${info.messageId})`);
};

module.exports = sendEmail;
