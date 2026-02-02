import { Request, Response } from 'express';
/**
 * Get direct message conversation between two users
 */
export declare const getDirectMessages: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
/**
 * Send a direct message
 */
export declare const sendDirectMessage: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
/**
 * Get all DM conversations for current user
 */
export declare const getConversations: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
//# sourceMappingURL=directMessagesController.d.ts.map