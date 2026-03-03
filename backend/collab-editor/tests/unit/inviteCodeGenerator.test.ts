import { generateInviteCode } from '../../src/utils/inviteCodeGenerator';

describe('generateInviteCode', () => {
  it('should generate code with default length of 8', () => {
    const code = generateInviteCode();
    expect(code).toHaveLength(8);
  });

  it('should generate code with custom length', () => {
    const code = generateInviteCode(12);
    expect(code).toHaveLength(12);
  });

  it('should only contain alphanumeric characters', () => {
    const code = generateInviteCode(100);
    expect(code).toMatch(/^[A-Za-z0-9]+$/);
  });

  it('should generate unique codes', () => {
    const codes = new Set(Array.from({ length: 50 }, () => generateInviteCode()));
    // With 62^8 possibilities, collisions are extremely unlikely
    expect(codes.size).toBe(50);
  });

  it('should handle length of 1', () => {
    const code = generateInviteCode(1);
    expect(code).toHaveLength(1);
    expect(code).toMatch(/^[A-Za-z0-9]$/);
  });
});
