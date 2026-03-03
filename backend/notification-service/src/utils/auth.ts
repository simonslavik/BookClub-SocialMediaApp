import jwt from 'jsonwebtoken';

interface TokenPayload {
  userId: string;
  email: string;
  iat: number;
  exp: number;
}

interface VerifyResult {
  valid: boolean;
  userId?: string;
  email?: string;
  error?: string;
}

export const verifyToken = (token: string | null): VerifyResult => {
  if (!token) {
    return { valid: false, error: 'No token provided' };
  }

  try {
    const JWT_SECRET = process.env.JWT_SECRET;
    if (!JWT_SECRET) {
      return { valid: false, error: 'JWT_SECRET not set' };
    }

    const decoded = jwt.verify(token, JWT_SECRET) as TokenPayload;

    if (!decoded.userId || !decoded.email) {
      return { valid: false, error: 'Invalid token payload' };
    }

    return { valid: true, userId: decoded.userId, email: decoded.email };
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      return { valid: false, error: 'Token expired' };
    }
    if (error.name === 'JsonWebTokenError') {
      return { valid: false, error: 'Invalid token' };
    }
    return { valid: false, error: `Token verification failed: ${error.message}` };
  }
};
