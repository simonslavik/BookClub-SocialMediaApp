import nodemailer from 'nodemailer';
import logger from '../utils/logger.js';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

let transporter: nodemailer.Transporter | null = null;

/**
 * Initialize the email transporter with SMTP settings.
 * Supports any SMTP provider (Gmail, SendGrid, Mailgun, AWS SES, etc.)
 *
 * Required env vars:
 *   SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS
 * Optional:
 *   SMTP_FROM (default: "BookClubs <noreply@bookclubs.app>")
 *   SMTP_SECURE (default: true for port 465, false otherwise)
 */
function getTransporter(): nodemailer.Transporter {
  if (transporter) return transporter;

  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    logger.warn('SMTP not configured — emails will be logged but not sent');
    // Create a no-op transporter that just logs
    transporter = {
      sendMail: async (opts: any) => {
        logger.info(`[EMAIL DRY-RUN] To: ${opts.to} | Subject: ${opts.subject}`);
        return { messageId: 'dry-run', accepted: [opts.to] };
      },
    } as any;
    return transporter!;
  }

  const secure = process.env.SMTP_SECURE
    ? process.env.SMTP_SECURE === 'true'
    : port === 465;

  transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
  });

  logger.info(`📧 Email transporter configured (${host}:${port})`);
  return transporter;
}

/**
 * Send an email. Returns true if sent, false on failure.
 */
export async function sendEmail(options: EmailOptions): Promise<boolean> {
  const from = process.env.SMTP_FROM || 'BookClubs <noreply@bookclubs.app>';

  try {
    const transport = getTransporter();
    const result = await transport.sendMail({
      from,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text || stripHtml(options.html),
    });

    logger.info(`Email sent to ${options.to}: ${result.messageId}`);
    return true;
  } catch (err) {
    logger.error(`Failed to send email to ${options.to}:`, err);
    return false;
  }
}

/**
 * Verify the SMTP connection on startup
 */
export async function verifyEmailConnection(): Promise<boolean> {
  const host = process.env.SMTP_HOST;
  if (!host) {
    logger.info('SMTP not configured — skipping email verification');
    return false;
  }

  try {
    const transport = getTransporter();
    await (transport as any).verify();
    logger.info('✅ SMTP connection verified');
    return true;
  } catch (err) {
    logger.error('❌ SMTP connection failed:', err);
    return false;
  }
}

/**
 * Simple HTML tag stripper for plain-text fallback
 */
function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
