const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

const sendEmail = async (options) => {
  // If API key is not configured, fallback to console logging
  if (!process.env.RESEND_API_KEY) {
    console.log('\n=================== EMAIL FALLBACK ===================');
    console.log(`To: ${options.email}`);
    console.log(`Subject: ${options.subject}`);
    console.log(`Message:\n${options.message}`);
    console.log('======================================================\n');
    return;
  }

  try {
    const { data, error } = await resend.emails.send({
      // Using Resend's default testing domain since a custom domain is not yet verified
      from: 'onboarding@resend.dev',
      to: options.email,
      subject: options.subject,
      text: options.message,
      html: options.html,
    });

    if (error) {
      console.error('Resend API Error:', error.message);
      console.error('\n⚠️ IMPORTANT: On the Resend free plan, you can ONLY send emails to the email address you signed up with.');
      console.error('Sending to any other email address will fail unless you verify a custom domain.\n');
      throw new Error(error.message);
    }

    console.log('Message sent successfully. ID:', data?.id);
    return data;
  } catch (err) {
    console.error('Failed to send email:', err.message);
    throw err;
  }
};

module.exports = sendEmail;
