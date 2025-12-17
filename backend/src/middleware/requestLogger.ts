import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      requestId: string;
      startTime: number;
    }
  }
}

export function requestLogger(req: Request, res: Response, next: NextFunction) {
  // Assign unique request ID
  req.requestId = (req.headers['x-request-id'] as string) || randomUUID();
  req.startTime = Date.now();

  // Log request
  console.log(
    JSON.stringify({
      timestamp: new Date().toISOString(),
      level: 'info',
      message: 'Request started',
      requestId: req.requestId,
      method: req.method,
      path: req.path,
    })
  );

  // Log response when finished
  res.on('finish', () => {
    const duration = Date.now() - req.startTime;
    const level = res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'info';

    console.log(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        level,
        message: 'Request completed',
        requestId: req.requestId,
        method: req.method,
        path: req.path,
        statusCode: res.statusCode,
        duration,
      })
    );
  });

  // Add request ID to response headers
  res.setHeader('X-Request-ID', req.requestId);

  next();
}
