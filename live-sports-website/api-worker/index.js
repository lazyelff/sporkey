export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    // Diagnostic log for incoming requests
    console.log(`[REQ] ${request.method} ${url.pathname}`);
    const path = url.pathname;
    
    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };
    
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }
    
    // Route handling
    try {
      if (path.startsWith('/api/auth/')) {
        return await handleAuth(request, env, corsHeaders);
      }
      return new Response(JSON.stringify({ message: 'Not found' }), { 
        status: 404, 
        headers: { 'Content-Type': 'application/json', ...corsHeaders } 
      });
    } catch (err) {
      return new Response(JSON.stringify({ error: err.message }), { 
        status: 500, 
        headers: { 'Content-Type': 'application/json', ...corsHeaders } 
      });
    }
  }
};

async function handleAuth(request, env, corsHeaders) {
  const path = new URL(request.url).pathname;
  const method = request.method;
  
  // POST /api/auth/login
  if (path === '/api/auth/login' && method === 'POST') {
    const { email, password } = await request.json();
    
    if (!email || !password) {
      return new Response(JSON.stringify({ message: 'Email and password required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }
    
    // Query user from D1 by email
    const stmt = env.sporkey_db.prepare('SELECT * FROM Users WHERE email = ? LIMIT 1');
    const user = await stmt.bind(email).first();
    // (debug logged removed for production)
    
    if (!user) {
      return new Response(JSON.stringify({ message: 'Invalid credentials' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }
    
    // Debug: log looked-up user (avoid in production)
    // console.log('LOOKUP_USER', user);
    // Password verification using PBKDF2 with per-user salt
    const derivedHash = await derivePasswordHash(password, user.salt);
    console.log('DEBUG_LOGIN', { email, derivedHash, storedHash: user.password, salt: user.salt });
    const passwordValid = (derivedHash === user.password);
    
    if (!passwordValid) {
      return new Response(JSON.stringify({ message: 'Invalid credentials' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }
    
    // Generate JWT
    const jwt = await generateToken({ id: user.id, username: user.username, role: user.role }, env.JWT_SECRET || 'fallback_secret');
    const refreshToken = await generateToken({ id: user.id, username: user.username, role: user.role }, env.REFRESH_SECRET || 'fallback_refresh', '7d');
    
    // Create session
    const tokenHash = await hashToken(jwt);
    await env.sporkey_db.prepare(
      'INSERT INTO UserSessions (userId, tokenHash, deviceInfo, ipAddress, isActive, lastUsedAt, createdAt, updatedAt) VALUES (?, ?, ?, ?, 1, ?, ?, ?)'
    ).bind(
      user.id, tokenHash, request.headers.get('User-Agent') || 'Unknown', 
      request.headers.get('CF-Connecting-IP') || 'Unknown', 
      new Date().toISOString(), new Date().toISOString(), new Date().toISOString()
    ).run();
    
    return new Response(JSON.stringify({
      token: jwt,
      refreshToken: refreshToken,
      user: { id: user.id, username: user.username, role: user.role }
    }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
  
  // POST /api/auth/register
  if (path === '/api/auth/register' && method === 'POST') {
    const { username, email, password } = await request.json();
    
    if (!username || !email || !password) {
      return new Response(JSON.stringify({ message: 'All fields required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }
    
    // Check if user exists
    const existing = await env.sporkey_db.prepare('SELECT id FROM Users WHERE email = ? OR username = ?').bind(email, username).first();
    
    if (existing) {
      return new Response(JSON.stringify({ message: 'User already exists' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }
    
    // Hash password with PBKDF2 and per-user salt
    const saltBytes = new Uint8Array(16);
    crypto.getRandomValues(saltBytes);
    const saltHex = Array.from(saltBytes).map(b => b.toString(16).padStart(2, '0')).join('');
    const hashedPassword = await derivePasswordHash(password, saltHex, 100000, 32);

    const now = new Date().toISOString();
    const result = await env.sporkey_db.prepare(
      'INSERT INTO Users (username, email, password, salt, role, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?)'
    ).bind(username, email, hashedPassword, saltHex, 'user', now, now).run();
    
    return new Response(JSON.stringify({ message: 'User registered successfully' }), {
      status: 201,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
  
  return new Response(JSON.stringify({ message: 'Method not allowed' }), {
    status: 405,
    headers: { 'Content-Type': 'application/json', ...corsHeaders }
  });
}

// Simple JWT-like token generation (for demo - use proper JWT in production)
async function generateToken(payload, secret, expiresIn = '15m') {
  const toBase64Url = (input) => {
    try {
      return typeof Buffer !== 'undefined'
        ? Buffer.from(input).toString('base64url')
        : (typeof btoa === 'function'
            ? btoa(unescape(encodeURIComponent(input))).replace(/\+/g, '-')
              .replace(/\//g, '_').replace(/=+$/, '')
            : '');
    } catch {
      return (typeof btoa === 'function')
        ? btoa(unescape(encodeURIComponent(input))).replace(/\+/g, '-')
          .replace(/\//g, '_').replace(/=+$/, '')
        : '';
    }
  };
  const header = toBase64Url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const expMs = expiresIn === '7d' ? 7 * 24 * 60 * 60 * 1000 : 15 * 60 * 1000;
  const payloadWithExp = { ...payload, exp: Date.now() + expMs };
  const payloadStr = toBase64Url(JSON.stringify(payloadWithExp));
  const signature = await hashToken(`${header}.${payloadStr}.${secret}`);
  return `${header}.${payloadStr}.${signature}`;
}

async function hashToken(data) {
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
  return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
}

// PBKDF2-based password hashing (with per-user salt) - used for production-grade security
function hexToBytes(hex) {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
  }
  return bytes;
}

async function derivePasswordHash(password, saltHex, iterations = 100000, dkLen = 32) {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey('raw', enc.encode(password), { name: 'PBKDF2' }, false, ['deriveBits']);
  const saltBytes = hexToBytes(saltHex);
  const derived = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: saltBytes,
      iterations,
      hash: { name: 'SHA-256' }
    },
    keyMaterial,
    dkLen * 8
  );
  const out = new Uint8Array(derived);
  return Array.from(out).map(b => b.toString(16).padStart(2, '0')).join('');
}

async function verifyPassword(password, storedHash, salt) {
  if (!salt) return false;
  const hash = await derivePasswordHash(password, salt);
  return hash === storedHash;
}
