const { sendEmail } = require('./email');

/**
 * Registration confirmation email with ticket and QR code
 */
const sendRegistrationEmail = async (user, event, registration) => {
    const html = `
    <div style="font-family: 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; background: #1a1a2e; color: #fff; border-radius: 12px; overflow: hidden;">
      <div style="background: linear-gradient(135deg, #667eea, #764ba2); padding: 30px; text-align: center;">
        <h1 style="margin: 0; font-size: 24px;">🎪 Felicity</h1>
        <p style="margin: 5px 0 0; opacity: 0.9;">Registration Confirmed!</p>
      </div>
      <div style="padding: 30px;">
        <p>Hi <strong>${user.firstName}</strong>,</p>
        <p>You've successfully registered for:</p>
        <div style="background: rgba(255,255,255,0.05); border-radius: 10px; padding: 20px; margin: 15px 0;">
          <h2 style="margin: 0 0 10px; color: #667eea;">${event.name}</h2>
          <p style="margin: 5px 0; opacity: 0.7;">📅 ${new Date(event.startDate).toLocaleString()}</p>
          <p style="margin: 5px 0; opacity: 0.7;">🎫 Ticket ID: <strong>${registration.ticketId}</strong></p>
          ${event.registrationFee ? `<p style="margin: 5px 0; opacity: 0.7;">💰 Fee: ₹${event.registrationFee}</p>` : ''}
        </div>
        ${registration.qrCode ? `
          <div style="text-align: center; margin: 20px 0;">
            <p style="margin-bottom: 10px; opacity: 0.7;">Your QR Code (show at entry):</p>
            <img src="${registration.qrCode}" alt="QR Code" style="width: 200px; height: 200px; border-radius: 8px;" />
          </div>
        ` : ''}
        <p style="opacity: 0.5; font-size: 12px; margin-top: 20px;">This is an automated email from Felicity Event Management System.</p>
      </div>
    </div>
  `;

    try {
        await sendEmail(user.email, `🎫 Registration Confirmed: ${event.name}`, html);
    } catch (err) {
        console.log('Email send failed (non-critical):', err.message);
    }
};

/**
 * Password reset notification email (for organizers)
 */
const sendPasswordResetEmail = async (email, organizerName, newPassword) => {
    const html = `
    <div style="font-family: 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; background: #1a1a2e; color: #fff; border-radius: 12px; overflow: hidden;">
      <div style="background: linear-gradient(135deg, #667eea, #764ba2); padding: 30px; text-align: center;">
        <h1 style="margin: 0; font-size: 24px;">🔑 Password Reset</h1>
      </div>
      <div style="padding: 30px;">
        <p>Hi <strong>${organizerName}</strong>,</p>
        ${newPassword
            ? `<p>Your password has been reset by the administrator.</p>
        <div style="background: rgba(255,255,255,0.05); border-radius: 10px; padding: 20px; margin: 15px 0; text-align: center;">
          <p style="margin: 0 0 5px; opacity: 0.7;">Your new password:</p>
          <p style="margin: 0; font-size: 24px; font-family: monospace; color: #2ed573; letter-spacing: 2px;">${newPassword}</p>
        </div>
        <p style="color: #ff6b7a;">⚠️ Please change this password after logging in.</p>`
            : `<p>Your password reset request has been approved by the administrator.</p>
        <p>You now have one-time permission to set a new password from your organizer profile.</p>`
        }
        <p style="opacity: 0.5; font-size: 12px; margin-top: 20px;">This is an automated email from Felicity Event Management System.</p>
      </div>
    </div>
  `;

    try {
        await sendEmail(email, '🔑 Your Password Has Been Reset — Felicity', html);
    } catch (err) {
        console.log('Email send failed (non-critical):', err.message);
    }
};

module.exports = { sendRegistrationEmail, sendPasswordResetEmail };
