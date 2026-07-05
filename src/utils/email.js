import nodemailer from 'nodemailer';

// Creates a transporter using environment variables.
// For testing/dev: fallback to a simple SMTP or Ethereal (auto-generated if no real credentials set).
const createTransporter = () => {
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
        return nodemailer.createTransport({
            service: process.env.EMAIL_SERVICE || 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });
    }

    // Fallback: log-only transport for development without real SMTP credentials
    return {
        sendMail: async (opts) => {
            console.log('\n📧 [DEV EMAIL] --- Would send email ---');
            console.log(`To: ${opts.to}`);
            console.log(`Subject: ${opts.subject}`);
            console.log(`Body: ${opts.text || opts.html}`);
            console.log('--------------------------------------\n');
            return { messageId: 'dev-mode' };
        }
    };
};

/**
 * Send a 6-digit OTP email to the user.
 * @param {string} toEmail - Recipient's email address
 * @param {string} otp     - 6-digit OTP code
 * @param {string} name    - Recipient's name for personalisation
 */
export const sendOTPEmail = async (toEmail, otp, name) => {
    const transporter = createTransporter();

    const html = `
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: auto; padding: 24px;
                border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff;">
        <h2 style="color: #6c63ff;">CoFound — Verify Your Email</h2>
        <p>Hi <strong>${name}</strong>,</p>
        <p>Use the OTP below to verify your college email address. It expires in <strong>10 minutes</strong>.</p>
        <div style="font-size: 36px; font-weight: bold; letter-spacing: 8px; text-align: center;
                    padding: 16px; background: #f0edff; border-radius: 8px; color: #4f46e5; margin: 20px 0;">
            ${otp}
        </div>
        <p style="color: #64748b; font-size: 13px;">If you didn't request this, please ignore this email.</p>
        <p style="color: #64748b; font-size: 13px;">— The CoFound Team</p>
    </div>`;

    await transporter.sendMail({
        from: process.env.EMAIL_USER || 'noreply@cofound.app',
        to: toEmail,
        subject: 'CoFound — Your Email Verification OTP',
        html,
        text: `Your CoFound OTP is: ${otp}. It expires in 10 minutes.`
    });
};
