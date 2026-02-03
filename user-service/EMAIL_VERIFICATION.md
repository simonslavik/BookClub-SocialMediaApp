# Email Verification System

## Overview

Complete email verification system for user registration and password reset flows using Nodemailer.

## How It Works

### 1. **User Registration Flow**

```
User Signs Up → Token Generated → Email Sent → User Clicks Link → Email Verified → Can Login
```

**Step-by-step:**

1. User creates account with email/password
2. Backend generates random 32-byte token
3. Token is hashed (SHA-256) and stored in database with 24-hour expiration
4. **Email is sent** with verification link: `https://yourapp.com/verify-email?token=abc123`
5. User clicks link in email
6. Frontend calls `GET /api/auth/verify-email?token=abc123`
7. Backend validates token, marks email as verified
8. User is redirected to login page

### 2. **Password Reset Flow**

```
User Forgets Password → Requests Reset → Email Sent → Clicks Link → Sets New Password
```

**Step-by-step:**

1. User clicks "Forgot Password" and enters email
2. Backend generates random 32-byte token
3. Token is hashed and stored with 1-hour expiration
4. **Email is sent** with reset link: `https://yourapp.com/reset-password?token=xyz789`
5. User clicks link, enters new password
6. Backend validates token, updates password, invalidates token
7. User can login with new password

## Email Configuration

### Development Mode (No Email Config)

- **Emails are logged** to console but NOT sent
- **Tokens are returned** in API response for testing
- No SMTP credentials required
- Perfect for local development

### Production Mode (With Email Config)

- **Emails are actually sent** via SMTP
- **Tokens are NOT returned** in API (security)
- Requires SMTP credentials
- Supports Gmail, SendGrid, AWS SES, etc.

## Setup Instructions

### Option 1: Gmail (Easy for Testing)

1. **Enable 2-Factor Authentication** on your Gmail account
2. **Generate App Password:**
   - Go to: https://myaccount.google.com/apppasswords
   - Select "Mail" and your device
   - Copy the 16-character password

3. **Update `.env` file:**
   ```env
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=your-16-char-app-password
   EMAIL_FROM=noreply@yourapp.com
   FRONTEND_URL=http://localhost:5173
   ```

### Option 2: SendGrid (Production Recommended)

```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=your-sendgrid-api-key
EMAIL_FROM=verified-email@yourdomain.com
```

### Option 3: AWS SES

```env
SMTP_HOST=email-smtp.us-east-1.amazonaws.com
SMTP_PORT=587
SMTP_USER=your-ses-smtp-username
SMTP_PASS=your-ses-smtp-password
EMAIL_FROM=verified-email@yourdomain.com
```

## Testing in Development

### Without Email Config (Default)

When you register a user, check the logs:

```bash
docker logs user-service
```

You'll see:

```
[user-service] info: {
  "type": "EMAIL_VERIFICATION_LOGGED",
  "to": "user@example.com",
  "subject": "Verify Your Email Address",
  "note": "Email not sent - configure SMTP credentials to enable email delivery"
}
```

The API response will include the token:

```json
{
  "user": {...},
  "accessToken": "...",
  "refreshToken": "...",
  "verificationToken": "abc123..."  // Only in dev mode
}
```

You can manually visit: `http://localhost:5173/verify-email?token=abc123...`

### With Email Config

1. Add SMTP credentials to `.env`
2. Restart Docker: `docker compose down && docker compose up`
3. Register a new user
4. Check your inbox for verification email
5. Click the link to verify

## API Endpoints

### POST /api/auth/register

Registers user and sends verification email

```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePass123!"
}
```

### GET /api/auth/verify-email?token=xxx

Verifies email address

- Success: `{ "message": "Email verified successfully!" }`
- Error: `{ "message": "Invalid or expired verification token" }`

### POST /api/auth/resend-verification

Resends verification email

```json
{
  "email": "john@example.com"
}
```

### POST /api/auth/forgot-password

Requests password reset email

```json
{
  "email": "john@example.com"
}
```

### POST /api/auth/reset-password

Resets password with token

```json
{
  "token": "xyz789...",
  "password": "NewSecurePass123!"
}
```

## Email Templates

### Verification Email

- **Subject:** "Verify Your Email Address"
- **Design:** Branded header, call-to-action button, 24-hour expiration notice
- **Features:** HTML + plain text fallback, responsive design

### Password Reset Email

- **Subject:** "Reset Your Password"
- **Design:** Warning-styled header, security notes, 1-hour expiration
- **Features:** Security warnings, one-time use notice, HTML + plain text

## Security Features

1. **Token Hashing:** Tokens are hashed (SHA-256) before storing in database
2. **Expiration:** Verification tokens expire in 24 hours, reset tokens in 1 hour
3. **One-time Use:** Tokens are deleted after successful use
4. **No Email Enumeration:** API returns success even if email doesn't exist
5. **Rate Limiting:** Password reset limited to 3 attempts per hour per IP
6. **Secure Development:** Tokens only returned in dev mode, never in production

## Database Schema

```prisma
model User {
  id                          String    @id @default(uuid())
  email                       String    @unique
  emailVerified               Boolean   @default(false)
  emailVerificationToken      String?   @unique
  emailVerificationExpires    DateTime?
  passwordResetToken          String?   @unique
  passwordResetExpires        DateTime?
  // ... other fields
}
```

## Frontend Routes

- `/verify-email?token=xxx` - Email verification page
- `/reset-password?token=xxx` - Password reset page
- `/resend-verification` - Request new verification email (optional)

## Troubleshooting

### Emails Not Sending

1. Check SMTP credentials in `.env`
2. Verify SMTP host and port
3. Check firewall/network allows SMTP connections
4. Review logs: `docker logs user-service`
5. For Gmail: Ensure App Password (not regular password)

### Token Expired

- Verification: User must request new email
- Password Reset: User must request new reset link
- Tokens cannot be extended for security

### Email Lands in Spam

- Use verified domain for `EMAIL_FROM`
- Consider SPF/DKIM/DMARC records
- Use established provider (SendGrid, SES)
- Add unsubscribe link (optional but recommended)

## Production Checklist

- [ ] Configure SMTP credentials
- [ ] Use verified sender domain
- [ ] Set up SPF/DKIM/DMARC
- [ ] Remove token from API responses (already done)
- [ ] Test email delivery
- [ ] Monitor email logs
- [ ] Set up bounce handling
- [ ] Consider email queue for reliability
- [ ] Add unsubscribe mechanism (if required)
- [ ] Test spam score

## Future Enhancements

- [ ] Email verification reminder (after 24 hours)
- [ ] Welcome email after verification
- [ ] Email preferences (notifications on/off)
- [ ] Email templates in database (not hardcoded)
- [ ] Multi-language email support
- [ ] Email analytics (open rates, click rates)
- [ ] Queue system for email sending (Bull, RabbitMQ)
- [ ] Resend verification from profile page
