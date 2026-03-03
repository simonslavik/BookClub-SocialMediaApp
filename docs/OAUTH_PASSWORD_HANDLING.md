# OAuth User Password Management - Implementation Summary

## Problem

Users who sign in with Google OAuth don't have passwords in our system (their `password` field is `null` and `authProvider` is set to `'google'`). They shouldn't be able to access password management features like:

- Change Password
- Forgot Password / Reset Password

## Solution Implemented ✅

### Backend Changes

#### 1. Change Password Protection

**File**: `user-service/src/services/auth.service.ts`

Updated `changePassword()` method:

```typescript
// Check if user signed up with OAuth (Google, etc.)
if (!user.password || user.authProvider === "google") {
  throw new Error("OAUTH_USER_NO_PASSWORD");
}
```

**File**: `user-service/src/controllers/authController.ts`

Added error handling:

```typescript
if (error.message === "OAUTH_USER_NO_PASSWORD") {
  return res.status(400).json({
    message:
      "You signed in with Google. Password changes are not available for OAuth accounts.",
  });
}
```

#### 2. Forgot Password Protection

**File**: `user-service/src/services/auth.service.ts`

Updated `requestPasswordReset()` method:

```typescript
// Check if user signed up with OAuth
if (!user.password || user.authProvider === "google") {
  logger.warn({
    type: "PASSWORD_RESET_REQUESTED_OAUTH_USER",
    email,
    authProvider: user.authProvider,
  });
  // Don't reveal that this is an OAuth account for security
  return { resetToken: null };
}
```

This silently prevents OAuth users from getting reset tokens (same response as non-existent email for security).

#### 3. Include authProvider in Login Response

**File**: `user-service/src/services/auth.service.ts`

Updated login response to include `authProvider`:

```typescript
return {
  user: {
    id: user.id,
    name: user.name,
    email: user.email,
    profileImage: user.profileImage,
    authProvider: user.authProvider || "local", // NEW
  },
  accessToken,
  refreshToken,
};
```

### Frontend Changes

#### 1. Conditional Change Password Button

**File**: `react-project/src/pages/ChangeProfile/index.jsx`

Added conditional rendering:

```jsx
{
  auth?.user?.authProvider !== "google" ? (
    <button onClick={() => setShowChangePassword(true)}>
      <FiLock />
      Change Password
    </button>
  ) : (
    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
      <div className="flex items-center gap-2 text-blue-700">
        <svg>...</svg>
        <span>You're signed in with Google</span>
      </div>
      <p className="text-xs text-blue-600 mt-1">
        Password changes are managed through your Google account.
      </p>
    </div>
  );
}
```

#### 2. Enhanced Error Handling

**File**: `react-project/src/components/common/modals/ChangePasswordModal.jsx`

Added special error handling for OAuth users:

```javascript
const errorMessage = err.response?.data?.message || "Failed to change password";

if (errorMessage.includes("OAuth") || errorMessage.includes("Google")) {
  setError(
    "You signed in with Google. Password changes are not available for OAuth accounts.",
  );
} else {
  setError(errorMessage);
}
```

## How It Works

### For Local (Email/Password) Users

✅ Can see "Change Password" button in profile settings  
✅ Can change their password  
✅ Can use "Forgot Password" to reset password

### For Google OAuth Users

❌ See informational message instead of "Change Password" button  
❌ Cannot access change password functionality  
❌ Forgot password silently fails (no token generated)  
✅ Can still update their profile (name, image)

## User Experience

### Google OAuth User Profile Page

Instead of a "Change Password" button, they see:

```
┌─────────────────────────────────────────┐
│ ℹ️  You're signed in with Google       │
│                                         │
│ Password changes are managed through    │
│ your Google account.                    │
└─────────────────────────────────────────┘
```

### If OAuth User Somehow Tries to Change Password

They receive a clear error message:

> "You signed in with Google. Password changes are not available for OAuth accounts."

### Forgot Password for OAuth Users

- Form accepts email submission
- Returns generic success message (for security)
- No reset token is generated
- Does not reveal account exists or uses OAuth

## Security Considerations

1. **No Information Disclosure**: Forgot password doesn't reveal if an account uses OAuth
2. **Proper Validation**: Both client and server validate auth provider
3. **Clear Messaging**: Users understand why password features are unavailable
4. **Fallback Protection**: Even if UI is bypassed, backend blocks OAuth password changes

## Database Schema

Users table includes:

```prisma
authProvider  String  @default("local")  // 'local' or 'google'
password      String? // NULL for OAuth users
googleId      String? @unique // Google user ID for OAuth
```

## API Response Structure

### Login Response

```json
{
  "user": {
    "id": "uuid",
    "name": "John Doe",
    "email": "john@example.com",
    "profileImage": "/path/to/image.jpg",
    "authProvider": "google" // or "local"
  },
  "accessToken": "jwt...",
  "refreshToken": "jwt..."
}
```

### Google OAuth Response

```json
{
  "user": {
    "id": "uuid",
    "name": "John Doe",
    "email": "john@example.com",
    "authProvider": "google",
    "googleId": "google-user-id",
    "profileImage": "https://..."
  },
  "accessToken": "jwt...",
  "refreshToken": "jwt..."
}
```

## Files Modified

**Backend** (3 files):

- `user-service/src/services/auth.service.ts` - Added OAuth checks to changePassword and requestPasswordReset
- `user-service/src/controllers/authController.ts` - Added OAUTH_USER_NO_PASSWORD error handling
- `user-service/src/services/auth.service.ts` - Added authProvider to login response

**Frontend** (2 files):

- `react-project/src/pages/ChangeProfile/index.jsx` - Conditional rendering based on authProvider
- `react-project/src/components/common/modals/ChangePasswordModal.jsx` - Enhanced error handling

## Testing Scenarios

### Test Case 1: Local User

1. Register with email/password
2. Login ✅
3. Access profile settings ✅
4. See "Change Password" button ✅
5. Can change password ✅
6. Can use forgot password ✅

### Test Case 2: Google OAuth User

1. Sign in with Google ✅
2. Access profile settings ✅
3. See informational message instead of button ✅
4. Cannot access change password (UI blocked) ✅
5. If API called directly, returns error ✅
6. Forgot password silently fails (no token) ✅

### Test Case 3: Account Linking

1. User registers with email/password
2. Later signs in with Google (same email)
3. Account linked, authProvider updated to 'google'
4. Password features become unavailable ✅

## Future Enhancements (Optional)

1. **Set Password for OAuth Users**
   - Allow OAuth users to optionally set a password
   - Enables email/password login as backup

2. **Multiple Auth Providers**
   - Support linking multiple OAuth providers
   - Apple, Facebook, Microsoft, etc.

3. **Unlink OAuth**
   - Allow users to disconnect OAuth account
   - Require password to be set first

4. **Account Migration**
   - Convert OAuth account to local account
   - Require email verification

---

**Implementation Complete!** ✅

OAuth users are now properly prevented from accessing password management features, with clear user-friendly messaging explaining why.
