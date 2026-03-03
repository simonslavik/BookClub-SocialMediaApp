import { Request, Response } from 'express';
/**
 * Verify Google OAuth token and create/login user
 */
export declare const googleAuth: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
//# sourceMappingURL=googleAuthController.d.ts.map