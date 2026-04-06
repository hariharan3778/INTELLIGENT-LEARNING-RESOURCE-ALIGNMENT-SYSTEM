const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  // Create reusable transporter object using the default SMTP transport
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.mailtrap.io',
    port: process.env.EMAIL_PORT || 2525,
    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  // Setup email data
  const message = {
    from: `${process.env.FROM_NAME || 'ILRAS Team'} <${process.env.FROM_EMAIL || 'noreply@ilras.com'}>`,
    to: options.email,
    subject: options.subject,
    text: options.message,
    html: options.html, // Support HTML emails
  };

  // Send email
  try {
    const info = await transporter.sendMail(message);
    console.log('Message sent: %s', info.messageId);
  } catch (error) {
    console.error('Error sending email. Please check your credentials: ', error.message);
    throw new Error('Email could not be sent');
  }
};

module.exports = sendEmail;
