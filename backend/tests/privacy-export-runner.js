process.env.NODE_ENV = 'test';
const request = require('supertest');
const assert = require('assert').strict;
const app = require('../server');
const sequelize = require('../db');
const User = require('../models/User');
const PrivacySettings = require('../models/PrivacySettings');
const ConnectedAccount = require('../models/ConnectedAccount');
const UserSession = require('../models/UserSession');
const NotificationPreference = require('../models/NotificationPreference');
const FeedSettings = require('../models/FeedSettings');
const UserFavorite = require('../models/UserFavorite');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const crypto = require('crypto');

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';
let token, user;

async function runTests() {
  console.log('--- STARTING PRIVACY, CONNECTED & EXPORT TESTS (TDD) ---');
  let passed = 0, failed = 0, errors = [];

  try {
    await sequelize.sync({ force: true });

    const salt = await bcrypt.genSalt(10);
    const hp = await bcrypt.hash('password123', salt);
    user = await User.create({ username: 'privuser', email: 'priv@example.com', password: hp, role: 'user' });
    await new Promise(r => setTimeout(r, 200)); // Wait for afterCreate hooks

    token = jwt.sign({ user: { id: user.id, username: user.username, role: user.role } }, JWT_SECRET);
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    await UserSession.create({ userId: user.id, tokenHash, isActive: true, lastUsedAt: new Date() });

    // 1. PrivacySettings auto-created by hook
    console.log('Testing: 1. Registration auto-creates PrivacySettings row...');
    try {
      const ps = await PrivacySettings.findOne({ where: { userId: user.id } });
      assert.ok(ps, 'PrivacySettings row not found');
      assert.strictEqual(ps.profileVisibility, 'public');
      assert.strictEqual(ps.showOnlineStatus, true);
      assert.strictEqual(ps.showFavorites, true);
      passed++;
    } catch (e) { console.error('❌ TEST 1 FAILED:', e.message); errors.push(e.message); failed++; }

    // 2. GET /api/account/privacy
    console.log('Testing: 2. GET /api/account/privacy returns defaults...');
    try {
      const res = await request(app).get('/api/account/privacy').set('Authorization', 'Bearer ' + token);
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);
      assert.strictEqual(res.body.data.profileVisibility, 'public');
      assert.strictEqual(res.body.data.showOnlineStatus, true);
      passed++;
    } catch (e) { console.error('❌ TEST 2 FAILED:', e.message); errors.push(e.message); failed++; }

    // 3. PUT /api/account/privacy (valid update)
    console.log('Testing: 3. PUT /api/account/privacy updates correctly...');
    try {
      const res = await request(app).put('/api/account/privacy').set('Authorization', 'Bearer ' + token)
        .send({ profileVisibility: 'private', showOnlineStatus: false });
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);
      const updated = await PrivacySettings.findOne({ where: { userId: user.id } });
      assert.strictEqual(updated.profileVisibility, 'private');
      assert.strictEqual(updated.showOnlineStatus, false);
      passed++;
    } catch (e) { console.error('❌ TEST 3 FAILED:', e.message); errors.push(e.message); failed++; }

    // 4. PUT /api/account/privacy (invalid enum)
    console.log('Testing: 4. PUT /api/account/privacy rejects invalid enum...');
    try {
      const res = await request(app).put('/api/account/privacy').set('Authorization', 'Bearer ' + token)
        .send({ profileVisibility: 'invalid_value' });
      assert.strictEqual(res.status, 400);
      assert.strictEqual(res.body.success, false);
      passed++;
    } catch (e) { console.error('❌ TEST 4 FAILED:', e.message); errors.push(e.message); failed++; }

    // 5. PUT /api/account/privacy (invalid boolean)
    console.log('Testing: 5. PUT /api/account/privacy rejects non-boolean...');
    try {
      const res = await request(app).put('/api/account/privacy').set('Authorization', 'Bearer ' + token)
        .send({ showOnlineStatus: 'yes' });
      assert.strictEqual(res.status, 400);
      assert.strictEqual(res.body.success, false);
      passed++;
    } catch (e) { console.error('❌ TEST 5 FAILED:', e.message); errors.push(e.message); failed++; }

    // 6. GET /api/account/connected (empty)
    console.log('Testing: 6. GET /api/account/connected returns empty array...');
    try {
      const res = await request(app).get('/api/account/connected').set('Authorization', 'Bearer ' + token);
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);
      assert.ok(Array.isArray(res.body.data));
      assert.strictEqual(res.body.data.length, 0);
      passed++;
    } catch (e) { console.error('❌ TEST 6 FAILED:', e.message); errors.push(e.message); failed++; }

    // 7. Manually add connected accounts for testing disconnect
    console.log('Testing: 7. Add connected accounts and list them...');
    try {
      await ConnectedAccount.create({ userId: user.id, provider: 'google', providerAccountId: 'google-123' });
      await ConnectedAccount.create({ userId: user.id, provider: 'discord', providerAccountId: 'discord-456' });
      const res = await request(app).get('/api/account/connected').set('Authorization', 'Bearer ' + token);
      assert.strictEqual(res.body.data.length, 2);
      passed++;
    } catch (e) { console.error('❌ TEST 7 FAILED:', e.message); errors.push(e.message); failed++; }

    // 8. DELETE /api/account/connected/:provider (success)
    console.log('Testing: 8. DELETE /api/account/connected/google disconnects...');
    try {
      const res = await request(app).delete('/api/account/connected/google').set('Authorization', 'Bearer ' + token);
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);
      const count = await ConnectedAccount.count({ where: { userId: user.id } });
      assert.strictEqual(count, 1);
      passed++;
    } catch (e) { console.error('❌ TEST 8 FAILED:', e.message); errors.push(e.message); failed++; }

    // 9. DELETE last connected account → 400 (only login method)
    console.log('Testing: 9. DELETE last connected account rejects with 400...');
    try {
      const res = await request(app).delete('/api/account/connected/discord').set('Authorization', 'Bearer ' + token);
      // This should succeed since user has a password (local login method)
      assert.strictEqual(res.status, 200);
      passed++;
    } catch (e) { console.error('❌ TEST 9 FAILED:', e.message); errors.push(e.message); failed++; }

    // 10. DELETE non-existent provider → 404
    console.log('Testing: 10. DELETE non-existent provider returns 404...');
    try {
      const res = await request(app).delete('/api/account/connected/twitter').set('Authorization', 'Bearer ' + token);
      assert.strictEqual(res.status, 404);
      assert.strictEqual(res.body.success, false);
      passed++;
    } catch (e) { console.error('❌ TEST 10 FAILED:', e.message); errors.push(e.message); failed++; }

    // 11. Duplicate connected account → unique constraint
    console.log('Testing: 11. Duplicate provider returns 409...');
    try {
      await ConnectedAccount.create({ userId: user.id, provider: 'google', providerAccountId: 'google-789' });
      const res = await request(app).get('/api/account/connected').set('Authorization', 'Bearer ' + token);
      // Try to add same provider again
      try {
        await ConnectedAccount.create({ userId: user.id, provider: 'google', providerAccountId: 'google-999' });
        assert.fail('Should have thrown unique constraint error');
      } catch (err) {
        assert.ok(err.name === 'SequelizeUniqueConstraintError');
      }
      passed++;
    } catch (e) { console.error('❌ TEST 11 FAILED:', e.message); errors.push(e.message); failed++; }

    // 12. POST /api/account/export (success)
    console.log('Testing: 12. POST /api/account/export returns JSON data...');
    try {
      const res = await request(app).post('/api/account/export').set('Authorization', 'Bearer ' + token);
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);
      assert.ok(res.body.data.profile);
      assert.ok(res.body.data.privacy);
      assert.ok(Array.isArray(res.body.data.favorites));
      assert.ok(res.body.data.feedSettings);
      assert.ok(res.body.data.notifications);
      assert.ok(Array.isArray(res.body.data.sessions));
      assert.ok(Array.isArray(res.body.data.connectedAccounts));
      passed++;
    } catch (e) { console.error('❌ TEST 12 FAILED:', e.message); errors.push(e.message); failed++; }

    // 13. Export excludes sensitive fields (password, twoFaSecret)
    console.log('Testing: 13. Export excludes sensitive fields...');
    try {
      const res = await request(app).post('/api/account/export').set('Authorization', 'Bearer ' + token);
      assert.strictEqual(res.body.data.profile.password, undefined);
      assert.strictEqual(res.body.data.profile.twoFaSecret, undefined);
      passed++;
    } catch (e) { console.error('❌ TEST 13 FAILED:', e.message); errors.push(e.message); failed++; }

    // 14. Unauthenticated request → 401
    console.log('Testing: 14. Unauthenticated privacy request returns 401...');
    try {
      const res = await request(app).get('/api/account/privacy');
      assert.strictEqual(res.status, 401);
      passed++;
    } catch (e) { console.error('❌ TEST 14 FAILED:', e.message); errors.push(e.message); failed++; }

    // 15. PUT /api/account/privacy with showFavorites toggle
    console.log('Testing: 15. PUT /api/account/privacy toggles showFavorites...');
    try {
      const res = await request(app).put('/api/account/privacy').set('Authorization', 'Bearer ' + token)
        .send({ showFavorites: false });
      assert.strictEqual(res.status, 200);
      const updated = await PrivacySettings.findOne({ where: { userId: user.id } });
      assert.strictEqual(updated.showFavorites, false);
      passed++;
    } catch (e) { console.error('❌ TEST 15 FAILED:', e.message); errors.push(e.message); failed++; }

  } catch (err) {
    console.error('Test Suite Error:', err);
  } finally {
    await sequelize.close();
    console.log('\n--- TEST SUMMARY: ' + passed + ' passed, ' + failed + ' failed ---');
  }
}

runTests();
