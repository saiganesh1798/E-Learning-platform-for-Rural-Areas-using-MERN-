const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
    // 1) Create a transporter
    // For production, you would use a service like SendGrid, Mailgun, or Gmail
    // For now, setting up a flexible transporter. 
    // If SMTP_HOST is not provided, it will log to console as a fallback.

    if (!process.env.SMTP_HOST) {
        console.log('--- EMAIL SIMULATION ---');
        console.log(`To: ${options.email}`);
        console.log(`Subject: ${options.subject}`);
        console.log(`Message: ${options.message}`);
        console.log('------------------------');
        return;
    }

    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
        }
    });

    // 2) Define the email options
    const mailOptions = {
        from: `E-Learning Platform <${process.env.FROM_EMAIL || 'noreply@elearning.com'}>`,
        to: options.email,
        subject: options.subject,
        text: options.message,
        // html: options.html // can be added if needed
    };

    // 3) Actually send the email
    await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;
