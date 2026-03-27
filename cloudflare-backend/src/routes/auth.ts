import { Hono } from 'hono';
import { drizzle } from 'drizzle-orm/d1';
import { eq, or } from 'drizzle-orm';
import * as schema from '../db/schema';
import * as bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';

type Bindings = {
  DB: D1Database;
  JWT_SECRET: string;
  REFRESH_TOKEN_SECRET: string;
};

import { rateLimiter } from '../middleware/rateLimiter';

const auth = new Hono<{ Bindings: Bindings }>();
// Rate limiter disabled for testing
// auth.use('/register', rateLimiter(15 * 60 * 1000, 10));
// auth.use('/login', rateLimiter(15 * 60 * 1000, 10));

// Helper for Web Crypto SHA-256
async function sha256(message: string) {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

const getSecret = (env: Bindings, key: 'JWT_SECRET'|'REFRESH_TOKEN_SECRET') => {
  return new TextEncoder().encode(env[key] || `fallback_${key.toLowerCase()}`);
}

// POST /api/auth/register
auth.post('/register', zValidator('json', z.object({
  username: z.string().min(1, 'Username is required'),
  email: z.string().email('Valid email is required'),
  password: z.string().min(6, 'Password must be at least 6 characters')
})), async (c) => {
  try {
    const { username, email, password } = c.req.valid('json');
    const db = drizzle(c.env.DB, { schema });

    const existingUser = await db.query.users.findFirst({
      where: or(eq(schema.users.email, email), eq(schema.users.username, username))
    });

    if (existingUser) {
      return c.json({ success: false, message: 'User already exists' }, 409);
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const [insertedUser] = await db.insert(schema.users).values({
      username,
      email,
      password: hashedPassword
    }).returning();

    const payload = {
      user: {
        id: insertedUser.id,
        username: insertedUser.username,
        role: insertedUser.role
      }
    };

    const token = await new SignJWT(payload)
      .setProtectedHeader({ alg: 'HS256' })
      .setJti(crypto.randomUUID())
      .setExpirationTime('15m')
      .sign(getSecret(c.env, 'JWT_SECRET'));

    const refreshToken = await new SignJWT(payload)
      .setProtectedHeader({ alg: 'HS256' })
      .setJti(crypto.randomUUID())
      .setExpirationTime('7d')
      .sign(getSecret(c.env, 'REFRESH_TOKEN_SECRET'));

    const tokenHash = await sha256(token);
    await db.insert(schema.userSessions).values({
      userId: insertedUser.id,
      tokenHash,
      isActive: true,
      lastUsedAt: new Date().toISOString()
    });

    return c.json({
      success: true,
      message: 'User registered successfully',
      data: {
        token,
        refreshToken,
        user: payload.user
      }
    }, 201);
  } catch (err) {
    console.error('Registration error:', err);
    return c.json({ success: false, message: 'Server error during registration' }, 500);
  }
});

// POST /api/auth/login
auth.post('/login', zValidator('json', z.object({
  email: z.string().email('Valid email is required'),
  password: z.string().min(1, 'Password is required')
})), async (c) => {
  try {
    const { email, password } = c.req.valid('json');
    const db = drizzle(c.env.DB, { schema });

    const user = await db.query.users.findFirst({
      where: eq(schema.users.email, email)
    });

    if (!user) {
      console.log('Login failed: User not found', email);
      return c.json({ success: false, message: 'Invalid credentials' }, 401);
    }

    const isMatch = await bcrypt.compare(password, user.password);
    console.log('Login attempt:', { email, isMatch });
    if (!isMatch) {
      return c.json({ success: false, message: 'Invalid credentials' }, 401);
    }

    const payload = {
      user: {
        id: user.id,
        username: user.username,
        role: user.role
      }
    };

    const token = await new SignJWT(payload)
      .setProtectedHeader({ alg: 'HS256' })
      .setJti(crypto.randomUUID())
      .setExpirationTime('15m')
      .sign(getSecret(c.env, 'JWT_SECRET'));

    const refreshToken = await new SignJWT(payload)
      .setProtectedHeader({ alg: 'HS256' })
      .setJti(crypto.randomUUID())
      .setExpirationTime('7d')
      .sign(getSecret(c.env, 'REFRESH_TOKEN_SECRET'));

    const tokenHash = await sha256(token);
    const deviceInfo = c.req.header('user-agent') || 'Unknown Device';
    const ipAddress = c.req.header('cf-connecting-ip') || 'Unknown IP';

    await db.insert(schema.userSessions).values({
      userId: user.id,
      tokenHash,
      deviceInfo,
      ipAddress,
      isActive: true,
      lastUsedAt: new Date().toISOString()
    });

    return c.json({
      success: true,
      data: {
        token,
        refreshToken,
        user: payload.user
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    return c.json({ success: false, message: 'Server error during login' }, 500);
  }
});

// POST /api/auth/refresh
auth.post('/refresh', zValidator('json', z.object({
  refreshToken: z.string()
})), async (c) => {
  const { refreshToken } = c.req.valid('json');
  try {
    const { payload: decoded } = await jwtVerify(refreshToken, getSecret(c.env, 'REFRESH_TOKEN_SECRET'));
    
    // cast payload back
    const userPayload = decoded as { user: { id: number, username: string, role: string } };

    const payload = {
      user: {
        id: userPayload.user.id,
        username: userPayload.user.username,
        role: userPayload.user.role
      }
    };

    const newToken = await new SignJWT(payload)
      .setProtectedHeader({ alg: 'HS256' })
      .setJti(crypto.randomUUID())
      .setExpirationTime('15m')
      .sign(getSecret(c.env, 'JWT_SECRET'));

    return c.json({ success: true, data: { token: newToken } });
  } catch (err) {
    return c.json({ success: false, message: 'Invalid refresh token' }, 403);
  }
});

export default auth;
