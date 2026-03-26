process.env.NODE_ENV = 'test';
const request = require('supertest');
const assert = require('assert').strict;
const app = require('../server');
const sequelize = require('../db');
const User = require('../models/User');
const UserSession = require('../models/UserSession');
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const speakeasy = require('speakeasy');

let user;
let token;
let sessionId;

function hashToken(rawToken) {
    return crypto.createHash('sha256').update(rawToken).digest('hex');
}

async function runTests() {
  console.log('--- STARTING SESSIONS & 2FA TESTS (STRICT TDD) ---');
  let passed = 0;
  let failed = 0;
  let errors = [];

  try {
    await sequelize.sync({ force: true });
    
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('password123', salt);
    
    // Create base user directly
    user = await User.create({
      username: 'sessionuser',
      email: 'session@example.com',
      password: hashedPassword,
      role: 'user'
    });

    // Test 1: login creates a session row
    console.log('Testing: 1. /api/auth/login inserts new active session...');
    try {
      const loginRes = await request(app).post('/api/auth/login').send({ email: 'session@example.com', password: 'password123' });
      assert.strictEqual(loginRes.status, 200, loginRes.body.message);
      assert.ok(loginRes.body.token);
      token = loginRes.body.token;
      
      const sessionRow = await UserSession.findOne({ where: { tokenHash: hashToken(token) } });
      assert.ok(sessionRow, 'Session row not found in DB');
      assert.strictEqual(sessionRow.isActive, true);
      assert.strictEqual(sessionRow.userId, user.id);
      sessionId = sessionRow.id;
      passed++;
    } catch (e) {
      console.error('❌ TEST 1 FAILED:', e.message);
      errors.push('TEST 1 FAILED: ' + e.message);
      failed++;
    }

    // Test 2: GET /api/account/sessions
    console.log('Testing: 2. GET /api/account/sessions returns active sessions...');
    try {
      const res = await request(app).get('/api/account/sessions').set('Authorization', 'Bearer ' + token);
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);
      assert.ok(Array.isArray(res.body.data));
      assert.strictEqual(res.body.data.length, 1);
      assert.strictEqual(res.body.data[0].id, sessionId);
      assert.strictEqual(res.body.data[0].isCurrent, true);
      assert.strictEqual(res.body.data[0].tokenHash, undefined, 'Must not expose tokenHash');
      passed++;
    } catch (e) {
      console.error('❌ TEST 2 FAILED:', e.message);
      errors.push('TEST 2 FAILED: ' + e.message);
      failed++;
    }

    // Mocking a second session to test revoke
    let token2;
    try {
      const loginRes2 = await request(app).post('/api/auth/login').send({ email: 'session@example.com', password: 'password123' });
      token2 = loginRes2.body.token;
    } catch(e) {}
    
    const sessionRow2 = await UserSession.findOne({ where: { tokenHash: hashToken(token2) } });

    // Test 3: DELETE /api/account/sessions/:id (revoke one)
    console.log('Testing: 3. Revoke one session by ID...');
    try {
      const res = await request(app).delete(`/api/account/sessions/${sessionRow2.id}`).set('Authorization', 'Bearer ' + token);
      assert.strictEqual(res.status, 200);
      // Ensure token2 is now invalid
      const resVal = await request(app).get('/api/account/sessions').set('Authorization', 'Bearer ' + token2);
      assert.strictEqual(resVal.status, 401, 'Token2 should be revoked');
      passed++;
    } catch (e) {
      console.error('❌ TEST 3 FAILED:', e.message);
      errors.push('TEST 3 FAILED: ' + e.message);
      failed++;
    }

    // Mock a third to test revoke all
    let token3;
    try {
      const loginRes3 = await request(app).post('/api/auth/login').send({ email: 'session@example.com', password: 'password123' });
      token3 = loginRes3.body.token;
    } catch(e) {}

    // Test 4: DELETE /api/account/sessions (revoke all except current)
    console.log('Testing: 4. Revoke all sessions except current...');
    try {
      const res = await request(app).delete('/api/account/sessions').set('Authorization', 'Bearer ' + token);
      assert.strictEqual(res.status, 200);
      const activeCount = await UserSession.count({ where: { userId: user.id, isActive: true } });
      assert.strictEqual(activeCount, 1); // Only `token` should remain
      passed++;
    } catch (e) {
      console.error('❌ TEST 4 FAILED:', e.message);
      errors.push('TEST 4 FAILED: ' + e.message);
      failed++;
    }

    // Test 5: POST /api/account/2fa/enable
    console.log('Testing: 5. 2FA Enable returns QR and secret...');
    try {
      const res = await request(app).post('/api/account/2fa/enable').set('Authorization', 'Bearer ' + token);
      assert.strictEqual(res.status, 200);
      assert.ok(res.body.data.qrCode);
      const updatedUser = await User.findByPk(user.id);
      assert.ok(updatedUser.twoFaSecret);
      assert.strictEqual(updatedUser.twoFaEnabled, false); // Not enabled yet
      passed++;
    } catch (e) {
      console.error('❌ TEST 5 FAILED:', e.message);
      errors.push('TEST 5 FAILED: ' + e.message);
      failed++;
    }

    // Test 6: POST /api/account/2fa/verify
    console.log('Testing: 6. 2FA Verify enables 2FA securely...');
    try {
      const u = await User.findByPk(user.id);
      const validCode = speakeasy.totp({ secret: u.twoFaSecret, encoding: 'base32' });
      const res = await request(app).post('/api/account/2fa/verify').set('Authorization', 'Bearer ' + token).send({ code: validCode });
      assert.strictEqual(res.status, 200);
      const activatedUser = await User.findByPk(user.id);
      assert.strictEqual(activatedUser.twoFaEnabled, true);
      passed++;
    } catch (e) {
      console.error('❌ TEST 6 FAILED:', e.message);
      errors.push('TEST 6 FAILED: ' + e.message);
      failed++;
    }

    // Test 7: POST /api/account/2fa/disable
    console.log('Testing: 7. 2FA Disable clears fields using password verification...');
    try {
      const res = await request(app).post('/api/account/2fa/disable').set('Authorization', 'Bearer ' + token).send({ password: 'password123' });
      assert.strictEqual(res.status, 200);
      const disabledUser = await User.findByPk(user.id);
      assert.strictEqual(disabledUser.twoFaEnabled, false);
      assert.strictEqual(disabledUser.twoFaSecret, null);
      passed++;
    } catch (e) {
      console.error('❌ TEST 7 FAILED:', e.message);
      errors.push('TEST 7 FAILED: ' + e.message);
      failed++;
    }

  } catch (err) {
    console.error('Test Suite Error:', err);
  } finally {
    await sequelize.close();
    console.log('\\n--- TEST SUMMARY: ' + passed + ' passed, ' + failed + ' failed ---');
  }
}

runTests();
