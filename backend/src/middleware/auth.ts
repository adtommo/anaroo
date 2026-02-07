import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends Request {
  userId?: string;
}

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required. Set it before starting the server.');
}

export function generateToken(userId: string): string {
  return jwt.sign({ userId }, JWT_SECRET as string, { expiresIn: '30d' });
}

export function verifyToken(token: string): { userId: string } | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET as string) as unknown;
    // Make sure decoded has a userId string
    if (decoded && typeof (decoded as any).userId === 'string') {
      return { userId: (decoded as any).userId };
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Optional authentication middleware
 * Safe: does not trust user headers blindly
 */
export function optionalAuth(req: AuthRequest, _res: Response, next: NextFunction): void {
  req.userId = undefined; // default to unauthenticated
  const authHeader = req.headers.authorization;

  if (authHeader && typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    const decoded = verifyToken(token);
    if (decoded) {
      req.userId = decoded.userId;
    }
  }

  next();
}

/**
 * Required authentication middleware
 */
export function requireAuth(req: AuthRequest, res: Response, next: NextFunction): void {
  req.userId = undefined; // default

  const authHeader = req.headers.authorization;
  if (!authHeader || typeof authHeader !== 'string' || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'No authentication token provided' });
    return;
  }

  const token = authHeader.substring(7);
  const decoded = verifyToken(token);
  if (!decoded) {
    res.status(401).json({ error: 'Invalid authentication token' });
    return;
  }

  req.userId = decoded.userId;
  next();
}
