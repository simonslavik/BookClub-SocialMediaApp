import { Request, Response } from 'express';
export declare const registerUser: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const loginUser: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
/**
 * Refresh access token using refresh token
 */
export declare const refreshAccessToken: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
/**
 * Logout user (revoke refresh token)
 */
export declare const logoutUser: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
/**
 * Logout from all devices (revoke all refresh tokens)
 */
export declare const logoutAllDevices: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
//# sourceMappingURL=userController.d.ts.map