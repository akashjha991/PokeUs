const { Resend } = require('resend');

// Initialize Resend
const resend = new Resend(process.env.RESEND_API_KEY);

const sendEmail = async (options) => {
  try {
    const data = await resend.emails.send({
      from: process.env.FROM_EMAIL || 'PokeUs <noreply@pokeus.app>',
      to: options.email,
      subject: options.subject,
      html: options.html,
    });

    return data;
  } catch (error) {
    console.error('Email sending error:', error);
    throw new Error('Email could not be sent');
  }
};

module.exports = sendEmail;
