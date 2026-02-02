import logger from "../utils/logger.js";
import { Request, Response, NextFunction} from "express";

const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  // Log full error details
  logger.error({
    message: err.message,
    stack: err.stack,
    requestId: (req as any).id,
    path: req.path
  });

  // Don't leak error details in production
  const isDevelopment = process.env.NODE_ENV === 'development';

  res.status(err.status || 500).json({
    message: err.message || "Internal server error",
    ...(isDevelopment && { stack: err.stack })
  });
};

export default errorHandler;