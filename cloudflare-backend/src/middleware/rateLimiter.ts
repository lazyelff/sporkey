import { createMiddleware } from 'hono/factory';
import { drizzle } from 'drizzle-orm/d1';
import { eq, sql } from 'drizzle-orm';
import * as schema from '../db/schema';

// Creates a rate limiter middleware for a given time window and max requests
export const rateLimiter = (windowMs: number, max: number) => {
  return createMiddleware<{ Bindings: { DB: D1Database } }>(async (c, next) => {
    const ip = c.req.header('cf-connecting-ip') || 'Unknown IP';
    if (ip === 'Unknown IP') return await next();

    const db = drizzle(c.env.DB, { schema });
    const now = Date.now();
    const resetAt = now + windowMs;

    // Check existing limit
    const record = await db.query.rateLimits.findFirst({ where: eq(schema.rateLimits.ip, ip) });
    
    if (record) {
      if (now > record.resetAt) {
        // Reset window
        await db.update(schema.rateLimits)
          .set({ count: 1, resetAt })
          .where(eq(schema.rateLimits.ip, ip));
      } else {
        if (record.count >= max) {
          return c.json({ success: false, message: 'Too many requests, please try again later.' }, 429);
        }
        // Increment
        await db.update(schema.rateLimits)
          .set({ count: record.count + 1 })
          .where(eq(schema.rateLimits.ip, ip));
      }
    } else {
      await db.insert(schema.rateLimits).values({
        ip,
        count: 1,
        resetAt
      });
    }

    await next();
  });
};
