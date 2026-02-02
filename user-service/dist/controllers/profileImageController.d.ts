import multer from 'multer';
import { Request, Response } from 'express';
export declare const upload: multer.Multer;
export declare const addProfileImage: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const deleteProfileImage: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
//# sourceMappingURL=profileImageController.d.ts.map