import crypto from 'crypto';
import { Request, Response, NextFunction } from 'express';
import { supabaseAdmin } from '../lib/supabase';
import { UserModel } from '../models';

export interface AuthRequest extends Request {
  userId?: string;
}

/**
 * Extract Bearer token from Authorization header.
 */
function extractToken(req: Request): string {
  const authHeader = req.headers.authorization;
  return (typeof authHeader === 'string' && authHeader.startsWith('Bearer '))
    ? authHeader.substring(7)
    : '';
}

/**
 * Sanitize a raw string to valid nickname chars and generate a unique nickname.
 * Appends _XXX (3 random alphanumeric chars) if the nickname is already taken.
 */
async function generateUniqueNickname(raw: string): Promise<string> {
  const sanitized = raw.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 20) || 'player';

  const existing = await UserModel.findOne({ nickname: sanitized });
  if (!existing) return sanitized;

  for (let i = 0; i < 5; i++) {
    const suffix = crypto.randomBytes(2).toString('hex').slice(0, 3);
    const candidate = `${sanitized.slice(0, 16)}_${suffix}`;
    const taken = await UserModel.findOne({ nickname: candidate });
    if (!taken) return candidate;
  }

  // Fallback: use a longer random suffix
  return `${sanitized.slice(0, 12)}_${crypto.randomBytes(4).toString('hex')}`;
}

/**
 * Verify a Supabase access token and find-or-create the corresponding MongoDB user.
 * Returns the MongoDB _id string on success, or null on failure.
 */
async function resolveUser(token: string): Promise<string | null> {
  if (!token) return null;

  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data.user) return null;

  const supabaseId = data.user.id;

  // Returning user — skip nickname logic
  const existingUser = await UserModel.findOne({ supabaseId });
  if (existingUser) return existingUser._id.toString();

  // New user — derive and deduplicate nickname
  const email = data.user.email ?? '';
  const rawNickname = data.user.user_metadata?.nickname
    || data.user.user_metadata?.full_name
    || email.split('@')[0]
    || 'player';

  const nickname = await generateUniqueNickname(rawNickname);

  try {
    const user = await UserModel.create({
      supabaseId,
      email,
      nickname,
      createdAt: new Date(),
    });
    return user._id.toString();
  } catch (err: any) {
    // E11000 race condition on supabaseId — another request created the user first
    if (err?.code === 11000) {
      const raced = await UserModel.findOne({ supabaseId });
      return raced?._id.toString() ?? null;
    }
    throw err;
  }
}

/**
 * Optional authentication middleware.
 * Sets req.userId if a valid token is provided, otherwise continues without auth.
 */
export async function optionalAuth(req: AuthRequest, _res: Response, next: NextFunction): Promise<void> {
  req.userId = undefined;
  const token = extractToken(req);
  if (token) {
    req.userId = (await resolveUser(token)) ?? undefined;
  }
  next();
}

/**
 * Required authentication middleware.
 * Returns 401 if no valid token or user cannot be resolved.
 */
export async function requireAuth(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  req.userId = undefined;
  const token = extractToken(req);
  const userId = await resolveUser(token);

  if (!userId) {
    res.status(401).json({ error: 'Invalid or missing authentication token' });
    return;
  }

  req.userId = userId;
  next();
}
