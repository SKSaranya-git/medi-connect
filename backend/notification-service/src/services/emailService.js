import nodemailer from "nodemailer";

const isConfigured = () =>
  Boolean(
    process.env.SMTP_HOST &&
    process.env.SMTP_PORT &&
    process.env.SMTP_USER &&
    process.env.SMTP_PASS
  );

const stripHtml = (html) =>
  html
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

/**
 * Send an email.
 * @param {string} to - Recipient email address
 * @param {string} subject - Email subject
 * @param {string} html - Email HTML body
 * @param {{ from?: string, replyTo?: string }} [options]
 * @returns {{ success: boolean, messageId?: string, error?: string }}
 */
export const sendEmail = async (to, subject, html, options = {}) => {
  if (!isConfigured()) {
    console.log(`\n📧 [EMAIL STUB] To: ${to}`);
    console.log(`   Subject: ${subject}`);
    console.log(`   Body: ${html.substring(0, 200)}...`);
    return { success: true, messageId: `stub-${Date.now()}` };
  }

  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    const info = await transporter.sendMail({
      from: options.from || process.env.MAIL_FROM || process.env.SMTP_USER,
      to,
      subject,
      html,
      text: stripHtml(html),
      replyTo: options.replyTo || process.env.MAIL_REPLY_TO,
    });

    console.log(`📧 Email sent to ${to} via Nodemailer`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`📧 Email failed to ${to}:`, error.message);
    return { success: false, error: error.message };
  }
};

export default { sendEmail };
