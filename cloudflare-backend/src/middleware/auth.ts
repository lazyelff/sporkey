import { createMiddleware } from 'hono/factory';
import { jwtVerify } from 'jose';

type Bindings = {
  DB: D1Database;
  JWT_SECRET: string;
};

type Variables = {
  user: {
    id: number;
    username: string;
    role: string;
  };
};

export const authMiddleware = createMiddleware<{ Bindings: Bindings; Variables: Variables }>(async (c, next) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ message: 'No token, authorization denied' }, 401);
  }

  const token = authHeader.split(' ')[1];
  try {
    const secret = new TextEncoder().encode(c.env.JWT_SECRET || 'fallback_jwt_secret');
    const { payload } = await jwtVerify(token, secret);
    
    // Type casting the payload
    const decoded = payload as unknown as { user: Variables['user'] };
    
    // Check if user still exists in DB (required by some tests)
    const { drizzle } = await import('drizzle-orm/d1');
    const schema = await import('../db/schema');
    const db = drizzle(c.env.DB, { schema });
    const user = await db.query.users.findFirst({
      where: (table, { eq }) => eq(table.id, decoded.user.id)
    });

    if (!user) {
      return c.json({ message: 'User no longer exists' }, 401);
    }

    c.set('user', decoded.user);
    
    await next();
  } catch (err) {
    return c.json({ message: 'Token is not valid' }, 401);
  }
});
