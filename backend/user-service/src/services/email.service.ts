import nodemailer from 'nodemailer';
import { logger } from '../utils/logger.js';

// Email configuration
const SMTP_HOST = process.env.SMTP_HOST || 'smtp.gmail.com';
const SMTP_PORT = parseInt(process.env.SMTP_PORT || '587');
const SMTP_USER = process.env.SMTP_USER || '';
const SMTP_PASS = process.env.SMTP_PASS || '';
const EMAIL_FROM = process.env.EMAIL_FROM || process.env.SMTP_USER || 'noreply@example.com';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// Create reusable transporter
let transporter: nodemailer.Transporter | null = null;

const getTransporter = () => {
  if (!transporter) {
    // In development without email config, use ethereal (test email service)
    if (process.env.NODE_ENV === 'development' && !SMTP_USER) {
      logger.warn({
        type: 'EMAIL_CONFIG_WARNING',
        message: 'No SMTP credentials configured - emails will be logged only (not sent)'
      });
      return null;
    }

    transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_PORT === 465, // true for 465, false for other ports
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS,
      },
    });

    logger.info({
      type: 'EMAIL_SERVICE_INITIALIZED',
      host: SMTP_HOST,
      port: SMTP_PORT,
      user: SMTP_USER,
    });
  }
  
  return transporter;
};

/**
 * Send email verification
 */
export const sendVerificationEmail = async (email: string, token: string, name: string) => {
  const verificationUrl = `${FRONTEND_URL}/verify-email?token=${token}`;
  
  const mailOptions = {
    from: EMAIL_FROM,
    to: email,
    subject: 'Verify Your Email Address',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Verify Email</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #4F46E5; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
          .button { display: inline-block; padding: 12px 30px; background: #4F46E5; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to Our Platform!</h1>
          </div>
          <div class="content">
            <p>Hi ${name},</p>
            <p>Thank you for creating an account! Please verify your email address to get started.</p>
            <p style="text-align: center;">
              <a href="${verificationUrl}" class="button">Verify Email Address</a>
            </p>
            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #6b7280; font-size: 14px;">${verificationUrl}</p>
            <p><strong>This link will expire in 24 hours.</strong></p>
            <p>If you didn't create an account, you can safely ignore this email.</p>
          </div>
          <div class="footer">
            <p>This is an automated email. Please do not reply to this message.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
      Hi ${name},
      
      Thank you for creating an account! Please verify your email address by clicking the link below:
      
      ${verificationUrl}
      
      This link will expire in 24 hours.
      
      If you didn't create an account, you can safely ignore this email.
    `,
  };

  return sendEmail(mailOptions, 'EMAIL_VERIFICATION');
};

/**
 * Send password reset email
 */
export const sendPasswordResetEmail = async (email: string, token: string, name: string) => {
  const resetUrl = `${FRONTEND_URL}/reset-password?token=${token}`;
  
  const mailOptions = {
    from: EMAIL_FROM,
    to: email,
    subject: 'Reset Your Password',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Reset Password</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #DC2626; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
          .button { display: inline-block; padding: 12px 30px; background: #DC2626; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .warning { background: #FEF3C7; border-left: 4px solid #F59E0B; padding: 12px; margin: 20px 0; }
          .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Password Reset Request</h1>
          </div>
          <div class="content">
            <p>Hi ${name},</p>
            <p>We received a request to reset your password. Click the button below to create a new password:</p>
            <p style="text-align: center;">
              <a href="${resetUrl}" class="button">Reset Password</a>
            </p>
            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #6b7280; font-size: 14px;">${resetUrl}</p>
            <div class="warning">
              <strong>⚠️ Security Note:</strong>
              <ul style="margin: 5px 0;">
                <li>This link will expire in 1 hour</li>
                <li>The link can only be used once</li>
                <li>If you didn't request this, please ignore this email</li>
              </ul>
            </div>
          </div>
          <div class="footer">
            <p>This is an automated email. Please do not reply to this message.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
      Hi ${name},
      
      We received a request to reset your password. Click the link below to create a new password:
      
      ${resetUrl}
      
      This link will expire in 1 hour and can only be used once.
      
      If you didn't request this password reset, please ignore this email.
    `,
  };

  return sendEmail(mailOptions, 'PASSWORD_RESET');
};

/**
 * Send email helper
 */
const sendEmail = async (mailOptions: nodemailer.SendMailOptions, type: string) => {
  const transport = getTransporter();
  
  // In development without email config, just log
  if (!transport) {
    logger.info({
      type: `${type}_EMAIL_LOGGED`,
      to: mailOptions.to,
      subject: mailOptions.subject,
      note: 'Email not sent - configure SMTP credentials to enable email delivery'
    });
    return { logged: true };
  }

  try {
    const info = await transport.sendMail(mailOptions);
    
    logger.info({
      type: `${type}_EMAIL_SENT`,
      to: mailOptions.to,
      messageId: info.messageId,
    });
    
    return info;
  } catch (error: any) {
    logger.error({
      type: `${type}_EMAIL_FAILED`,
      to: mailOptions.to,
      error: error.message,
      stack: error.stack,
    });
    throw error;
  }
};

/**
 * Verify email configuration
 */
export const verifyEmailConfig = async () => {
  const transport = getTransporter();
  
  if (!transport) {
    return { configured: false, verified: false };
  }

  try {
    await transport.verify();
    logger.info({ type: 'EMAIL_CONFIG_VERIFIED' });
    return { configured: true, verified: true };
  } catch (error: any) {
    logger.error({
      type: 'EMAIL_CONFIG_INVALID',
      error: error.message,
    });
    return { configured: true, verified: false, error: error.message };
  }
};
