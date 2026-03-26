import { describe, it, expect, beforeAll } from 'vitest';
import app from '../src/index';
import { createD1Mock, SCHEMA_SQL } from './helpers';
import * as schema from '../src/db/schema';

describe('Auth Routes Test Suite', () => {
  let env: any;

  beforeAll(async () => {
    env = {
      DB: createD1Mock(),
      JWT_SECRET: 'testsecret',
      REFRESH_TOKEN_SECRET: 'testrefresh'
    };
    // Clear and migrate
    await env.DB.exec(SCHEMA_SQL);
  });

  it('1. POST /api/auth/register - Success', async () => {
    const res = await app.request('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'testuser', email: 'test@example.com', password: 'password123' })
    }, env);
    if (res.status !== 201) {
      console.log('Error Body:', await res.text());
    }
    expect(res.status).toBe(201);
    const body: any = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.token).toBeDefined();
    expect(body.data.user.username).toBe('testuser');
  });

  it('2. POST /api/auth/register - Missing fields', async () => {
    const res = await app.request('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'test@example.com' })
    }, env);
    expect(res.status).toBe(400);
    const body: any = await res.json();
    expect(body.success).toBe(false);
  });

  it('3. POST /api/auth/register - Minimum password length', async () => {
    const res = await app.request('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'shortpass', email: 'short@example.com', password: 'short' })
    }, env);
    expect(res.status).toBe(400);
  });

  it('4. POST /api/auth/register - Existing user conflict', async () => {
    const res = await app.request('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'testuser', email: 'test@example.com', password: 'password123' })
    }, env);
    expect(res.status).toBe(409);
  });

  it('5. POST /api/auth/login - Success', async () => {
    const res = await app.request('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'test@example.com', password: 'password123' })
    }, env);
    expect(res.status).toBe(200);
    const body: any = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.token).toBeDefined();
  });

  it('6. POST /api/auth/login - Non-existent email', async () => {
    const res = await app.request('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'doesnotexist@example.com', password: 'password123' })
    }, env);
    expect(res.status).toBe(401);
  });

  it('7. POST /api/auth/login - Incorrect password', async () => {
    const res = await app.request('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'test@example.com', password: 'wrongpassword' })
    }, env);
    expect(res.status).toBe(401);
  });

  it('8. POST /api/auth/login - Missing fields', async () => {
    const res = await app.request('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'test@example.com' })
    }, env);
    expect(res.status).toBe(400);
  });
});
