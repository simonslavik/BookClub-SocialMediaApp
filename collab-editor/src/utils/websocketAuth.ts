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

/**
 * Verify JWT token for WebSocket connections
 * 
 * Properly validates:
 * 1. Token signature
 * 2. Token expiration
 * 3. Token structure
 * 
 * @param token - JWT token to verify
 * @returns Verification result with user data or error
 */
export const verifyWebSocketToken = (token: string | null): VerifyResult => {
    if (!token) {
        return {
            valid: false,
            error: 'No token provided'
        };
    }

    try {
        const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this';
        
        // jwt.verify automatically checks expiration
        const decoded = jwt.verify(token, JWT_SECRET) as TokenPayload;
        
        // Additional validation
        if (!decoded.userId || !decoded.email) {
            return {
                valid: false,
                error: 'Invalid token payload - missing required fields'
            };
        }

        // Check if token is expired (extra safety check, jwt.verify does this too)
        const now = Math.floor(Date.now() / 1000);
        if (decoded.exp && decoded.exp < now) {
            return {
                valid: false,
                error: 'Token expired'
            };
        }

        return {
            valid: true,
            userId: decoded.userId,
            email: decoded.email
        };
    } catch (error: any) {
        if (error.name === 'TokenExpiredError') {
            return {
                valid: false,
                error: 'Token expired - please reconnect with a fresh token'
            };
        }
        
        if (error.name === 'JsonWebTokenError') {
            return {
                valid: false,
                error: 'Invalid token'
            };
        }

        return {
            valid: false,
            error: `Token verification failed: ${error.message}`
        };
    }
};
