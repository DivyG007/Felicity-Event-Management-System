const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: false,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

/**
 * Send an email
 * @param {string} to - Recipient email
 * @param {string} subject - Email subject
 * @param {string} html - Email body (HTML)
 * @param {Array} attachments - Optional attachments
 */
const sendEmail = async (to, subject, html, attachments = []) => {
    const mailOptions = {
        from: `"Felicity Events" <${process.env.SMTP_USER}>`,
        to,
        subject,
        html,
        attachments,
    };

    await transporter.sendMail(mailOptions);
};

module.exports = { sendEmail };
