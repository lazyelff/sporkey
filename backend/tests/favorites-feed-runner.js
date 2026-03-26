process.env.NODE_ENV = 'test';
const request = require('supertest');
const assert = require('assert').strict;
const app = require('../server');
const sequelize = require('../db');
const User = require('../models/User');
const UserFavorite = require('../models/UserFavorite');
const FeedSettings = require('../models/FeedSettings');
const UserSession = require('../models/UserSession');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const crypto = require('crypto');

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';
let token, user, favoriteId;

async function runTests() {
  console.log('--- STARTING FAVORITES & FEED SETTINGS TESTS (TDD) ---');
  let passed = 0, failed = 0, errors = [];

  try {
    await sequelize.sync({ force: true });

    const salt = await bcrypt.genSalt(10);
    const hp = await bcrypt.hash('password123', salt);
    user = await User.create({ username: 'favuser', email: 'fav@example.com', password: hp, role: 'user' });
    await new Promise(r => setTimeout(r, 150)); // Wait for afterCreate hooks

    token = jwt.sign({ user: { id: user.id, username: user.username, role: user.role } }, JWT_SECRET);
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    await UserSession.create({ userId: user.id, tokenHash, isActive: true, lastUsedAt: new Date() });

    // 1. FeedSettings auto-created by hook
    console.log('Testing: 1. Registration auto-creates FeedSettings row...');
    try {
      const fs = await FeedSettings.findOne({ where: { userId: user.id } });
      assert.ok(fs, 'FeedSettings row not found');
      assert.strictEqual(fs.defaultView, 'all');
      assert.strictEqual(fs.showLiveOnly, false);
      passed++;
    } catch (e) { console.error('❌ TEST 1 FAILED:', e.message); errors.push(e.message); failed++; }

    // 2. GET /api/account/favorites (empty)
    console.log('Testing: 2. GET /api/account/favorites returns empty array...');
    try {
      const res = await request(app).get('/api/account/favorites').set('Authorization', 'Bearer ' + token);
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);
      assert.ok(Array.isArray(res.body.data));
      assert.strictEqual(res.body.data.length, 0);
      passed++;
    } catch (e) { console.error('❌ TEST 2 FAILED:', e.message); errors.push(e.message); failed++; }

    // 3. POST /api/account/favorites (add one)
    console.log('Testing: 3. POST /api/account/favorites adds a favorite...');
    try {
      const res = await request(app).post('/api/account/favorites').set('Authorization', 'Bearer ' + token)
        .send({ entityType: 'team', entityId: 'manu', entityName: 'Manchester United' });
      assert.strictEqual(res.status, 201);
      assert.strictEqual(res.body.success, true);
      assert.ok(res.body.data.id);
      favoriteId = res.body.data.id;
      passed++;
    } catch (e) { console.error('❌ TEST 3 FAILED:', e.message); errors.push(e.message); failed++; }

    // 4. POST duplicate → 409
    console.log('Testing: 4. POST duplicate favorite returns 409...');
    try {
      const res = await request(app).post('/api/account/favorites').set('Authorization', 'Bearer ' + token)
        .send({ entityType: 'team', entityId: 'manu', entityName: 'Manchester United' });
      assert.strictEqual(res.status, 409);
      assert.strictEqual(res.body.success, false);
      passed++;
    } catch (e) { console.error('❌ TEST 4 FAILED:', e.message); errors.push(e.message); failed++; }

    // 5. DELETE /api/account/favorites/:id
    console.log('Testing: 5. DELETE /api/account/favorites/:id removes favorite...');
    try {
      const res = await request(app).delete('/api/account/favorites/' + favoriteId).set('Authorization', 'Bearer ' + token);
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);
      const count = await UserFavorite.count({ where: { userId: user.id } });
      assert.strictEqual(count, 0);
      passed++;
    } catch (e) { console.error('❌ TEST 5 FAILED:', e.message); errors.push(e.message); failed++; }

    // 6. GET /api/account/feed-settings (findOrCreate fallback)
    console.log('Testing: 6. GET /api/account/feed-settings returns defaults...');
    try {
      const res = await request(app).get('/api/account/feed-settings').set('Authorization', 'Bearer ' + token);
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);
      assert.strictEqual(res.body.data.defaultView, 'all');
      assert.strictEqual(res.body.data.showLiveOnly, false);
      passed++;
    } catch (e) { console.error('❌ TEST 6 FAILED:', e.message); errors.push(e.message); failed++; }

    // 7. PUT /api/account/feed-settings
    console.log('Testing: 7. PUT /api/account/feed-settings updates correctly...');
    try {
      const res = await request(app).put('/api/account/feed-settings').set('Authorization', 'Bearer ' + token)
        .send({ defaultView: 'favorites', showLiveOnly: true, preferredLeagues: ['EPL', 'La Liga'] });
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);
      const updated = await FeedSettings.findOne({ where: { userId: user.id } });
      assert.strictEqual(updated.defaultView, 'favorites');
      assert.strictEqual(updated.showLiveOnly, true);
      assert.deepStrictEqual(updated.preferredLeagues, ['EPL', 'La Liga']);
      passed++;
    } catch (e) { console.error('❌ TEST 7 FAILED:', e.message); errors.push(e.message); failed++; }

    // 8. PUT invalid enum → 400
    console.log('Testing: 8. PUT /api/account/feed-settings rejects invalid enum...');
    try {
      const res = await request(app).put('/api/account/feed-settings').set('Authorization', 'Bearer ' + token)
        .send({ defaultView: 'invalid_value' });
      assert.strictEqual(res.status, 400);
      assert.strictEqual(res.body.success, false);
      passed++;
    } catch (e) { console.error('❌ TEST 8 FAILED:', e.message); errors.push(e.message); failed++; }

  } catch (err) {
    console.error('Test Suite Error:', err);
  } finally {
    await sequelize.close();
    console.log('\n--- TEST SUMMARY: ' + passed + ' passed, ' + failed + ' failed ---');
  }
}

runTests();
