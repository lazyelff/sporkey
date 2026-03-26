import { Hono } from 'hono';
import { cors } from 'hono/cors';
import auth from './routes/auth';
import account from './routes/account';

type Bindings = {
  DB: D1Database;
  AVATARS_BUCKET: R2Bucket;
};

const app = new Hono<{ Bindings: Bindings }>();

app.use('*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  exposeHeaders: ['Content-Length'],
  maxAge: 600,
  credentials: true,
}));

app.get('/', (c: any) => {
  return c.text('Hello Cloudflare Workers!');
});

app.route('/api/auth', auth);
app.route('/api/account', account);

export default app;
