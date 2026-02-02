import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
describe('Password Utilities', () => {
    describe('hashPassword', () => {
        it('should hash a password', async () => {
            const password = 'testpassword123';
            const hashed = await bcrypt.hash(password, 10);
            expect(hashed).toBeDefined();
            expect(hashed).not.toBe(password);
            expect(hashed.length).toBeGreaterThan(0);
        });
        it('should generate different hashes for same password', async () => {
            const password = 'testpassword123';
            const hash1 = await bcrypt.hash(password, 10);
            const hash2 = await bcrypt.hash(password, 10);
            expect(hash1).not.toBe(hash2);
        });
    });
    describe('comparePassword', () => {
        it('should return true for matching password', async () => {
            const password = 'testpassword123';
            const hashed = await bcrypt.hash(password, 10);
            const isMatch = await bcrypt.compare(password, hashed);
            expect(isMatch).toBe(true);
        });
        it('should return false for non-matching password', async () => {
            const password = 'testpassword123';
            const wrongPassword = 'wrongpassword';
            const hashed = await bcrypt.hash(password, 10);
            const isMatch = await bcrypt.compare(wrongPassword, hashed);
            expect(isMatch).toBe(false);
        });
        it('should handle empty passwords', async () => {
            const password = '';
            const hashed = await bcrypt.hash(password, 10);
            const isMatch = await bcrypt.compare(password, hashed);
            expect(isMatch).toBe(true);
        });
    });
});
describe('JWT Utilities', () => {
    const secret = 'test-secret';
    describe('generateToken', () => {
        it('should generate a valid JWT token', () => {
            const payload = { userId: '123', email: 'test@example.com' };
            const token = jwt.sign(payload, secret, { expiresIn: '1h' });
            expect(token).toBeDefined();
            expect(typeof token).toBe('string');
            expect(token.split('.')).toHaveLength(3);
        });
        it('should include payload in token', () => {
            const payload = { userId: '123', email: 'test@example.com', role: 'user' };
            const token = jwt.sign(payload, secret);
            const decoded = jwt.verify(token, secret);
            expect(decoded).toMatchObject(payload);
        });
        it('should create tokens that expire', () => {
            const payload = { userId: '123' };
            const token = jwt.sign(payload, secret, { expiresIn: '1ms' });
            // Wait for token to expire
            return new Promise(resolve => setTimeout(resolve, 10)).then(() => {
                expect(() => jwt.verify(token, secret)).toThrow();
            });
        });
    });
    describe('verifyToken', () => {
        it('should verify valid token', () => {
            const payload = { userId: '123', email: 'test@example.com' };
            const token = jwt.sign(payload, secret);
            const decoded = jwt.verify(token, secret);
            expect(decoded).toMatchObject(payload);
        });
        it('should reject invalid token', () => {
            const invalidToken = 'invalid.token.here';
            expect(() => jwt.verify(invalidToken, secret)).toThrow();
        });
        it('should reject token with wrong secret', () => {
            const payload = { userId: '123' };
            const token = jwt.sign(payload, 'wrong-secret');
            expect(() => jwt.verify(token, secret)).toThrow();
        });
        it('should reject expired token', async () => {
            const payload = { userId: '123' };
            const token = jwt.sign(payload, secret, { expiresIn: '1ms' });
            await new Promise(resolve => setTimeout(resolve, 10));
            expect(() => jwt.verify(token, secret)).toThrow();
        });
    });
});
//# sourceMappingURL=auth.test.js.map