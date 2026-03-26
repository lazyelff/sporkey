process.env.NODE_ENV = 'test';
const request = require('supertest');
const assert = require('assert').strict;
const app = require('../server');
const sequelize = require('../db');
const User = require('../models/User');
const UserSession = require('../models/UserSession');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');
const crypto = require('crypto');

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';
let token;
let user;
let user2;

async function runTests() {
  console.log('--- STARTING ACCOUNT SETTINGS TESTS (PRODUCTION AUDIT TDD) ---');
  let passed = 0;
  let failed = 0;
  let errors = [];

  try {
    await sequelize.sync({ force: true });
    
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('password123', salt);
    
    user = await User.create({
      username: 'settingsuser',
      email: 'settings@example.com',
      password: hashedPassword,
      role: 'user'
    });
    
    const uploadsDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);
    const dummyImagePath = path.join(uploadsDir, `test-avatar-${user.id}.webp`);
    fs.writeFileSync(dummyImagePath, 'dummy content');
    
    user.profileImageUrl = `/uploads/test-avatar-${user.id}.webp`;
    await user.save();

    token = jwt.sign({ user: { id: user.id, username: user.username, role: user.role } }, JWT_SECRET);

    // Create a matching active session row so authMiddleware accepts this token
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    await UserSession.create({ userId: user.id, tokenHash, isActive: true, lastUsedAt: new Date() });

    user2 = await User.create({
      username: 'existinguser',
      email: 'existing@example.com',
      password: hashedPassword,
      role: 'user'
    });

    // 1. GET /api/users/me (Success)
    try {
      console.log('Testing: 1. GET /api/users/me - returns standard success structure...');
      const res = await request(app).get('/api/users/me').set('Authorization', 'Bearer ' + token);
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);
      assert.strictEqual(res.body.data.username, 'settingsuser');
      passed++;
    } catch (e) {
      console.error('❌ TEST 1 FAILED:', e.message);
      errors.push('TEST 1 FAILED: ' + e.message);
      failed++;
    }

    // 2. PUT /api/users/profile (Success - No Email Change)
    try {
      console.log('Testing: 2. PUT /api/users/profile - username update only...');
      const res = await request(app)
        .put('/api/users/profile')
        .set('Authorization', 'Bearer ' + token)
        .send({ username: 'newname', email: 'settings@example.com' });
      assert.strictEqual(res.status, 200, 'Expected 200 ' + res.status);
      assert.strictEqual(res.body.success, true);
      const updatedUser = await User.findByPk(user.id);
      assert.strictEqual(updatedUser.username, 'newname');
      assert.strictEqual(updatedUser.email, 'settings@example.com');
      assert.strictEqual(updatedUser.pendingEmail, null);
      passed++;
    } catch (e) {
      console.error('❌ TEST 2 FAILED:', e.message);
      errors.push('TEST 2 FAILED: ' + e.message);
      failed++;
    }

    // 3. PUT /api/users/profile (Success - Email Change sets pendingEmail)
    try {
      console.log('Testing: 3. PUT /api/users/profile - email change sets pendingEmail...');
      const res = await request(app)
        .put('/api/users/profile')
        .set('Authorization', 'Bearer ' + token)
        .send({ username: 'newname', email: 'different@example.com' });
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);
      const updatedUser = await User.findByPk(user.id);
      assert.strictEqual(updatedUser.email, 'settings@example.com'); // Remains old
      assert.strictEqual(updatedUser.pendingEmail, 'different@example.com'); // Sets pending
      passed++;
    } catch (e) {
      console.error('❌ TEST 3 FAILED:', e.message);
      errors.push('TEST 3 FAILED: ' + e.message);
      failed++;
    }

    // 4. PUT /api/users/profile (Conflict 409)
    try {
      console.log('Testing: 4. PUT /api/users/profile - Duplicate data returns 409...');
      const res = await request(app)
        .put('/api/users/profile')
        .set('Authorization', 'Bearer ' + token)
        .send({ username: 'existinguser', email: 'existing@example.com' });
      assert.strictEqual(res.status, 409, 'Expected 409 got ' + res.status);
      assert.strictEqual(res.body.success, false);
      passed++;
    } catch (e) {
      console.error('❌ TEST 4 FAILED:', e.message);
      errors.push('TEST 4 FAILED: ' + e.message);
      failed++;
    }

    // 5. PUT /api/users/password (Success)
    try {
      console.log('Testing: 5. PUT /api/users/password - successfully changes password...');
      const res = await request(app)
        .put('/api/users/password')
        .set('Authorization', 'Bearer ' + token)
        .send({ currentPassword: 'password123', newPassword: 'newpassword123' });
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);
      const updatedUser = await User.findByPk(user.id);
      const isMatch = await bcrypt.compare('newpassword123', updatedUser.password);
      assert.ok(isMatch);
      passed++;
    } catch (e) {
      console.error('❌ TEST 5 FAILED:', e.message);
      errors.push('TEST 5 FAILED: ' + e.message);
      failed++;
    }

    // 6. PUT /api/users/password (Same as current)
    try {
      console.log('Testing: 6. PUT /api/users/password - New password same as current returns 400...');
      const res = await request(app)
        .put('/api/users/password')
        .set('Authorization', 'Bearer ' + token)
        .send({ currentPassword: 'newpassword123', newPassword: 'newpassword123' });
      assert.strictEqual(res.status, 400);
      assert.strictEqual(res.body.success, false);
      passed++;
    } catch (e) {
      console.error('❌ TEST 6 FAILED:', e.message);
      errors.push('TEST 6 FAILED: ' + e.message);
      failed++;
    }

    // 7. PUT /api/users/password (Too short)
    try {
      console.log('Testing: 7. PUT /api/users/password - New password < 8 chars returns 400...');
      const res = await request(app)
        .put('/api/users/password')
        .set('Authorization', 'Bearer ' + token)
        .send({ currentPassword: 'newpassword123', newPassword: 'short' });
      assert.strictEqual(res.status, 400);
      assert.strictEqual(res.body.success, false);
      passed++;
    } catch (e) {
      console.error('❌ TEST 7 FAILED:', e.message);
      errors.push('TEST 7 FAILED: ' + e.message);
      failed++;
    }

    // 8. DELETE /api/users (Missing CONFIRM text)
    try {
      console.log('Testing: 8. DELETE /api/users - Missing confirmation text returns 400...');
      const res = await request(app)
        .delete('/api/users')
        .set('Authorization', 'Bearer ' + token)
        .send({ password: 'newpassword123', confirmationString: 'DELEET' });
      assert.strictEqual(res.status, 400);
      assert.strictEqual(res.body.success, false);
      passed++;
    } catch (e) {
      console.error('❌ TEST 8 FAILED:', e.message);
      errors.push('TEST 8 FAILED: ' + e.message);
      failed++;
    }

    // 9. DELETE /api/users (Success)
    try {
      console.log('Testing: 9. DELETE /api/users - Success with exact text and password...');
      const res = await request(app)
        .delete('/api/users')
        .set('Authorization', 'Bearer ' + token)
        .send({ password: 'newpassword123', confirmationString: 'DELETE' });
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);
      const userDeleted = await User.findByPk(user.id);
      assert.strictEqual(userDeleted, null);
      passed++;
    } catch (e) {
      console.error('❌ TEST 9 FAILED:', e.message);
      errors.push('TEST 9 FAILED: ' + e.message);
      failed++;
    }

    // Cleanup
    if (fs.existsSync(dummyImagePath)) fs.unlinkSync(dummyImagePath);

  } catch (err) {
    console.error('Test Suite Error:', err);
  } finally {
    await sequelize.close();
    const report = { passed, failed, errors };
    fs.writeFileSync('account_settings_test_report.json', JSON.stringify(report, null, 2));
    console.log('\\n--- TEST SUMMARY: ' + passed + ' passed, ' + failed + ' failed ---');
  }
}

runTests();
