import { Request, Response } from 'express';
export declare const sendFriendRequest: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const acceptFriendRequest: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const rejectFriendRequest: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const removeFriend: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const listFriends: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const listFriendRequests: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
//# sourceMappingURL=friendsController.d.ts.map