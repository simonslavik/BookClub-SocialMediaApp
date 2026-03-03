/**
 * Email templates for notification emails.
 * Uses a consistent layout with the BookClubs branding.
 */

const BRAND_COLOR = '#78716c'; // stone-500
const BRAND_DARK = '#44403c';  // stone-700
const BG_COLOR = '#fafaf9';    // stone-50
const TEXT_COLOR = '#292524';   // stone-800
const MUTED_COLOR = '#78716c'; // stone-500
const BORDER_COLOR = '#d6d3d1'; // stone-300
const APP_NAME = 'BookClubs';
const APP_URL = process.env.APP_URL || 'http://localhost:5173';

/**
 * Wraps content in the base email layout
 */
function baseLayout(content: string, preheader?: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${APP_NAME}</title>
  <style>
    body { margin: 0; padding: 0; background: ${BG_COLOR}; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
    .container { max-width: 600px; margin: 0 auto; background: #ffffff; }
  </style>
</head>
<body style="margin:0;padding:0;background:${BG_COLOR};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  ${preheader ? `<div style="display:none;max-height:0;overflow:hidden;">${preheader}</div>` : ''}
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BG_COLOR};">
    <tr>
      <td align="center" style="padding:24px 16px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid ${BORDER_COLOR};">
          <!-- Header -->
          <tr>
            <td style="background:${BRAND_DARK};padding:24px 32px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:700;letter-spacing:-0.5px;font-family:Georgia,'Times New Roman',serif;">
                📚 ${APP_NAME}
              </h1>
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="padding:32px;">
              ${content}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:24px 32px;border-top:1px solid ${BORDER_COLOR};text-align:center;">
              <p style="margin:0;color:${MUTED_COLOR};font-size:13px;line-height:1.5;">
                You received this because you're a member of a book club on ${APP_NAME}.
                <br/>
                <a href="${APP_URL}/settings/notifications" style="color:${BRAND_COLOR};text-decoration:underline;">Manage notification preferences</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/**
 * Meeting Created email
 */
export function meetingCreatedEmail(params: {
  userName: string;
  meetingTitle: string;
  clubName: string;
  scheduledAt: string;
  meetingUrl?: string;
  platform?: string;
}): { subject: string; html: string } {
  const date = new Date(params.scheduledAt);
  const formattedDate = date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const formattedTime = date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });

  const content = `
    <h2 style="margin:0 0 16px;color:${TEXT_COLOR};font-size:20px;font-family:Georgia,'Times New Roman',serif;">
      New Meeting Scheduled
    </h2>
    <p style="margin:0 0 24px;color:${MUTED_COLOR};font-size:15px;line-height:1.6;">
      Hi ${params.userName}, a new meeting has been scheduled for <strong style="color:${TEXT_COLOR};">${params.clubName}</strong>.
    </p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BG_COLOR};border-radius:8px;padding:20px;margin:0 0 24px;">
      <tr>
        <td style="padding:20px;">
          <p style="margin:0 0 8px;color:${MUTED_COLOR};font-size:13px;text-transform:uppercase;letter-spacing:0.5px;">Meeting</p>
          <p style="margin:0 0 16px;color:${TEXT_COLOR};font-size:17px;font-weight:600;">${params.meetingTitle}</p>
          <p style="margin:0 0 4px;color:${MUTED_COLOR};font-size:13px;text-transform:uppercase;letter-spacing:0.5px;">When</p>
          <p style="margin:0 0 16px;color:${TEXT_COLOR};font-size:15px;">${formattedDate} at ${formattedTime}</p>
          ${params.platform ? `
            <p style="margin:0 0 4px;color:${MUTED_COLOR};font-size:13px;text-transform:uppercase;letter-spacing:0.5px;">Platform</p>
            <p style="margin:0;color:${TEXT_COLOR};font-size:15px;">${params.platform}</p>
          ` : ''}
        </td>
      </tr>
    </table>
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto;">
      <tr>
        <td style="background:${BRAND_DARK};border-radius:8px;">
          <a href="${APP_URL}" style="display:inline-block;padding:12px 32px;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;">
            View Meeting Details
          </a>
        </td>
      </tr>
    </table>
  `;

  return {
    subject: `📅 New meeting: "${params.meetingTitle}" — ${params.clubName}`,
    html: baseLayout(content, `New meeting "${params.meetingTitle}" scheduled for ${params.clubName}`),
  };
}

/**
 * Meeting Updated email
 */
export function meetingUpdatedEmail(params: {
  userName: string;
  meetingTitle: string;
  clubName: string;
  scheduledAt?: string;
}): { subject: string; html: string } {
  const dateInfo = params.scheduledAt
    ? (() => {
        const d = new Date(params.scheduledAt);
        return `${d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })} at ${d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
      })()
    : null;

  const content = `
    <h2 style="margin:0 0 16px;color:${TEXT_COLOR};font-size:20px;font-family:Georgia,'Times New Roman',serif;">
      Meeting Updated
    </h2>
    <p style="margin:0 0 24px;color:${MUTED_COLOR};font-size:15px;line-height:1.6;">
      Hi ${params.userName}, the meeting <strong style="color:${TEXT_COLOR};">"${params.meetingTitle}"</strong> in ${params.clubName} has been updated.
    </p>
    ${dateInfo ? `
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BG_COLOR};border-radius:8px;margin:0 0 24px;">
        <tr>
          <td style="padding:20px;">
            <p style="margin:0 0 4px;color:${MUTED_COLOR};font-size:13px;text-transform:uppercase;letter-spacing:0.5px;">New Date & Time</p>
            <p style="margin:0;color:${TEXT_COLOR};font-size:15px;">${dateInfo}</p>
          </td>
        </tr>
      </table>
    ` : ''}
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto;">
      <tr>
        <td style="background:${BRAND_DARK};border-radius:8px;">
          <a href="${APP_URL}" style="display:inline-block;padding:12px 32px;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;">
            View Updated Meeting
          </a>
        </td>
      </tr>
    </table>
  `;

  return {
    subject: `📝 Meeting updated: "${params.meetingTitle}" — ${params.clubName}`,
    html: baseLayout(content, `Meeting "${params.meetingTitle}" has been updated`),
  };
}

/**
 * Meeting Cancelled email
 */
export function meetingCancelledEmail(params: {
  userName: string;
  meetingTitle: string;
  clubName: string;
}): { subject: string; html: string } {
  const content = `
    <h2 style="margin:0 0 16px;color:${TEXT_COLOR};font-size:20px;font-family:Georgia,'Times New Roman',serif;">
      Meeting Cancelled
    </h2>
    <p style="margin:0 0 24px;color:${MUTED_COLOR};font-size:15px;line-height:1.6;">
      Hi ${params.userName}, the meeting <strong style="color:${TEXT_COLOR};">"${params.meetingTitle}"</strong> in ${params.clubName} has been cancelled.
    </p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;margin:0 0 24px;">
      <tr>
        <td style="padding:16px 20px;">
          <p style="margin:0;color:#991b1b;font-size:14px;">This meeting is no longer taking place. No further action is needed.</p>
        </td>
      </tr>
    </table>
  `;

  return {
    subject: `❌ Meeting cancelled: "${params.meetingTitle}" — ${params.clubName}`,
    html: baseLayout(content, `Meeting "${params.meetingTitle}" has been cancelled`),
  };
}

/**
 * Meeting Reminder email (24h / 1h / starting now)
 */
export function meetingReminderEmail(params: {
  userName: string;
  meetingTitle: string;
  clubName: string;
  scheduledAt: string;
  reminderType: 'reminder_24h' | 'reminder_1h' | 'meeting_starting';
}): { subject: string; html: string } {
  const date = new Date(params.scheduledAt);
  const formattedDate = date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
  const formattedTime = date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });

  const reminderLabels: Record<string, { title: string; emoji: string; urgency: string }> = {
    reminder_24h: { title: 'Meeting Tomorrow', emoji: '📅', urgency: 'starts tomorrow' },
    reminder_1h: { title: 'Meeting in 1 Hour', emoji: '⏰', urgency: 'starts in 1 hour' },
    meeting_starting: { title: 'Meeting Starting Now', emoji: '🚀', urgency: 'is starting now' },
  };

  const label = reminderLabels[params.reminderType] || reminderLabels.reminder_24h;

  const content = `
    <h2 style="margin:0 0 16px;color:${TEXT_COLOR};font-size:20px;font-family:Georgia,'Times New Roman',serif;">
      ${label.emoji} ${label.title}
    </h2>
    <p style="margin:0 0 24px;color:${MUTED_COLOR};font-size:15px;line-height:1.6;">
      Hi ${params.userName}, your meeting <strong style="color:${TEXT_COLOR};">"${params.meetingTitle}"</strong> in ${params.clubName} ${label.urgency}!
    </p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BG_COLOR};border-radius:8px;margin:0 0 24px;">
      <tr>
        <td style="padding:20px;">
          <p style="margin:0 0 4px;color:${MUTED_COLOR};font-size:13px;text-transform:uppercase;letter-spacing:0.5px;">When</p>
          <p style="margin:0;color:${TEXT_COLOR};font-size:15px;font-weight:600;">${formattedDate} at ${formattedTime}</p>
        </td>
      </tr>
    </table>
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto;">
      <tr>
        <td style="background:${BRAND_DARK};border-radius:8px;">
          <a href="${APP_URL}" style="display:inline-block;padding:12px 32px;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;">
            Open ${APP_NAME}
          </a>
        </td>
      </tr>
    </table>
  `;

  return {
    subject: `${label.emoji} ${label.title}: "${params.meetingTitle}" — ${params.clubName}`,
    html: baseLayout(content, `Your meeting "${params.meetingTitle}" ${label.urgency}`),
  };
}
