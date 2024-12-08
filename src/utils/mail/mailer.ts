import nodemailer from 'nodemailer';
import SMTPTransport from 'nodemailer/lib/smtp-transport';

const sendPasswordResetEmail = async (email: string, resetToken: string) => {
    const resetPasswordLink = `${process.env.FRONTEND_URL}/new-password/${resetToken}`;
    const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_SERVICE,
        port: process.env.EMAIL_PORT,
        secure: true,
        tls: {
            // must provide server name, otherwise TLS certificate check will fail
            servername: process.env.EMAIL_SERVICE,
        },
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASSWORD,
        },
    } as SMTPTransport.Options);

    // Define email message
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email, // Recipient email address
        subject: 'Password Reset Request', // Email subject
        text: `Click the following link to reset your password: ${resetPasswordLink}`,    };

    // Send the email
    await transporter.sendMail(mailOptions);

    console.log('Password reset email sent successfully');
};

async function sendVerifyEmail(
    email: string,
    verificationToken: string,
): Promise<void> {
    const verifyEmailLink = `${process.env.FRONTEND_URL}/verify-email/${verificationToken}`;
    const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_SERVICE,
        port: process.env.EMAIL_PORT,
        secure: true,
        tls: {
            // must provide server name, otherwise TLS certificate check will fail
            servername: process.env.EMAIL_SERVICE,
        },
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASSWORD,
        },
    } as SMTPTransport.Options);
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Verify Email',
        text: `Click the following link to verify your email: ${verifyEmailLink}`,
    };
    try {
        await transporter.sendMail(mailOptions);
    } catch (error) {
        throw new Error('Error sending email verification mail');
    }
}

async function sendResetPasswordEmail(
    email: string,
    resetToken: string,
): Promise<void> {
    const resetPasswordLink = `${process.env.FRONTEND_URL}/new-password/${resetToken}`;
    const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_SERVICE,
        port: process.env.EMAIL_PORT,
        secure: true,
        tls: {
            // must provide server name, otherwise TLS certificate check will fail
            servername: process.env.EMAIL_SERVICE,
        },
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASSWORD,
        },
    } as SMTPTransport.Options);
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Password Reset',
        text: `Click the following link to reset your password: ${resetPasswordLink}`,
    };
    try {
        await transporter.sendMail(mailOptions);
        console.log(`Password reset email sent to ${email}`);
    } catch (error) {
        console.error('Error sending password reset email:', error);
        throw new Error('Error sending password reset email');
    }
}
export { sendPasswordResetEmail, sendVerifyEmail, sendResetPasswordEmail };
