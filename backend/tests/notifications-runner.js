process.env.NODE_ENV = 'test';
const request = require('supertest');
const assert = require('assert').strict;
const app = require('../server');
const sequelize = require('../db');
const User = require('../models/User');
const NotificationPreference = require('../models/NotificationPreference');
const UserSession = require('../models/UserSession');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const crypto = require('crypto');

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';
let token;
let user;

async function runTests() {
  console.log('--- STARTING NOTIFICATIONS TESTS (STRICT TDD) ---');
  let passed = 0;
  let failed = 0;
  let errors = [];

  try {
    await sequelize.sync({ force: true });
    
    // Test 1: Hook creates row automatically
    console.log('Testing: 1. Registration auto-creates NotificationPreference row...');
    try {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('password123', salt);
      user = await User.create({
        username: 'notifuser',
        email: 'notif@example.com',
        password: hashedPassword,
        role: 'user'
      });
      // The hook runs async inside transaction. Waiting just to be extremely safe:
      await new Promise(r => setTimeout(r, 100)); 
      const prefs = await NotificationPreference.findOne({ where: { userId: user.id } });
      assert.ok(prefs, 'Preferences row not found for new user');
      assert.strictEqual(prefs.match_start, true);
      assert.strictEqual(prefs.push_notifications, false);
      passed++;
    } catch (e) {
      console.error('❌ TEST 1 FAILED:', e.message);
      errors.push('TEST 1 FAILED: ' + e.message);
      failed++;
    }

    token = jwt.sign({ user: { id: user.id, username: user.username, role: user.role } }, JWT_SECRET);
    
    // Create a matching active session row so authMiddleware accepts this token
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    await UserSession.create({ userId: user.id, tokenHash, isActive: true, lastUsedAt: new Date() });

    // Test 2: GET /api/account/notifications Returns 200
    console.log('Testing: 2. GET /api/account/notifications fetches boolean map...');
    try {
      const res = await request(app).get('/api/account/notifications').set('Authorization', 'Bearer ' + token);
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);
      assert.strictEqual(res.body.data.email_notifications, true);
      assert.strictEqual(res.body.data.platform_updates, false);
      passed++;
    } catch (e) {
      console.error('❌ TEST 2 FAILED:', e.message);
      errors.push('TEST 2 FAILED: ' + e.message);
      failed++;
    }

    // Test 3: PUT updates a single boolean
    console.log('Testing: 3. PUT /api/account/notifications updates single field...');
    try {
      const res = await request(app)
        .put('/api/account/notifications')
        .set('Authorization', 'Bearer ' + token)
        .send({ push_notifications: true });
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);
      const updatedPrefs = await NotificationPreference.findOne({ where: { userId: user.id } });
      assert.strictEqual(updatedPrefs.push_notifications, true);
      assert.strictEqual(updatedPrefs.email_notifications, true); // Should leave others unchanged
      passed++;
    } catch (e) {
      console.error('❌ TEST 3 FAILED:', e.message);
      errors.push('TEST 3 FAILED: ' + e.message);
      failed++;
    }

    // Test 4: PUT updates multiple fields
    console.log('Testing: 4. PUT /api/account/notifications updates multiple fields...');
    try {
      const res = await request(app)
        .put('/api/account/notifications')
        .set('Authorization', 'Bearer ' + token)
        .send({ email_notifications: false, match_reminder: false });
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);
      const updatedPrefs = await NotificationPreference.findOne({ where: { userId: user.id } });
      assert.strictEqual(updatedPrefs.email_notifications, false);
      assert.strictEqual(updatedPrefs.match_reminder, false);
      assert.strictEqual(updatedPrefs.push_notifications, true); // From previous test
      passed++;
    } catch (e) {
      console.error('❌ TEST 4 FAILED:', e.message);
      errors.push('TEST 4 FAILED: ' + e.message);
      failed++;
    }

    // Test 5: PUT rejects non-boolean values (400)
    console.log('Testing: 5. PUT /api/account/notifications rejects strictly non-booleans...');
    try {
      const res = await request(app)
        .put('/api/account/notifications')
        .set('Authorization', 'Bearer ' + token)
        .send({ match_start: "true", platform_updates: 1 });
      assert.strictEqual(res.status, 400);
      assert.strictEqual(res.body.success, false);
      passed++;
    } catch (e) {
      console.error('❌ TEST 5 FAILED:', e.message);
      errors.push('TEST 5 FAILED: ' + e.message);
      failed++;
    }

    // Test 6: Unauthorized access blocks GET
    console.log('Testing: 6. GET /api/account/notifications rejects missing token...');
    try {
      const res = await request(app).get('/api/account/notifications');
      assert.strictEqual(res.status, 401);
      passed++;
    } catch (e) {
      console.error('❌ TEST 6 FAILED:', e.message);
      errors.push('TEST 6 FAILED: ' + e.message);
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
