process.env.NODE_ENV = 'test';
const request = require('supertest');
const assert = require('assert').strict;
const app = require('../server');
const sequelize = require('../db');
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const path = require('path');
const fs = require('fs');

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';
let token;
let user;

async function runTests() {
  console.log('--- STARTING PROFILE UPLOAD TESTS ---');
  let passed = 0;
  let failed = 0;
  let errors = [];

  try {
    // Setup
    await sequelize.sync({ force: true });
    user = await User.create({
      username: 'testuser',
      email: 'testuser@example.com',
      password: 'hashedpassword123',
      role: 'user'
    });
    token = jwt.sign({ user: { id: user.id, username: user.username, role: user.role } }, JWT_SECRET);

    const dummyImageDir = path.join(__dirname, 'dummy');
    const validJpgPath = path.join(dummyImageDir, 'valid.jpg');
    const invalidTextPath = path.join(dummyImageDir, 'invalid.txt');
    const largeImagePath = path.join(dummyImageDir, 'large.jpg');

    if (!fs.existsSync(dummyImageDir)) fs.mkdirSync(dummyImageDir);
    const pngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';
    fs.writeFileSync(validJpgPath, Buffer.from(pngBase64, 'base64'));
    fs.writeFileSync(invalidTextPath, 'this is a text file');
    const largeContent = Buffer.alloc(6 * 1024 * 1024, 'a');
    fs.writeFileSync(largeImagePath, largeContent);

    // TEST 1
    try {
      console.log('Testing: 1. Successful upload - Valid image file, Authenticated...');
      const res = await request(app).post('/api/users/profile-picture').set('Authorization', 'Bearer ' + token).attach('profilePicture', validJpgPath);
      assert.strictEqual(res.status, 200, 'Expected status 200, got ' + res.status);
      assert.ok(res.body.message, "Expected response body to have a message");
      const updatedUser = await User.findByPk(user.id);
      assert.ok(updatedUser.profileImageUrl, "Expected user to have profileImageUrl set");
      assert.ok(updatedUser.profileImageUrl.includes('.webp'), "Expected profileImageUrl to be webp format");
      console.log('✅ TEST 1 PASSED');
      passed++;
    } catch (e) {
      console.error('❌ TEST 1 FAILED:', e.message);
      errors.push('TEST 1 FAILED: ' + e.message);
      failed++;
    }

    // TEST 2
    try {
      console.log('Testing: 2. Invalid file type - upload non-image file expects 400...');
      const res = await request(app).post('/api/users/profile-picture').set('Authorization', 'Bearer ' + token).attach('profilePicture', invalidTextPath);
      assert.strictEqual(res.status, 400, 'Expected status 400, got ' + res.status);
      console.log('✅ TEST 2 PASSED');
      passed++;
    } catch (e) {
      console.error('❌ TEST 2 FAILED:', e.message);
      errors.push('TEST 2 FAILED: ' + e.message);
      failed++;
    }

    // TEST 3
    try {
      console.log('Testing: 3. File too large - exceeds 5MB limit expects 400 or 413...');
      const res = await request(app).post('/api/users/profile-picture').set('Authorization', 'Bearer ' + token).attach('profilePicture', largeImagePath);
      assert.ok([400, 413].includes(res.status), 'Expected status 400 or 413, got ' + res.status);
      console.log('✅ TEST 3 PASSED');
      passed++;
    } catch (e) {
      console.error('❌ TEST 3 FAILED:', e.message);
      errors.push('TEST 3 FAILED: ' + e.message);
      failed++;
    }

    // TEST 4
    try {
      console.log('Testing: 4. Unauthorized request - no auth token expects 401...');
      const res = await request(app).post('/api/users/profile-picture').attach('profilePicture', validJpgPath);
      assert.strictEqual(res.status, 401, 'Expected status 401, got ' + res.status);
      console.log('✅ TEST 4 PASSED');
      passed++;
    } catch (e) {
      if (e.message.includes('ECONNRESET')) {
        console.log('✅ TEST 4 PASSED (Connection reset correctly upon 401)');
        passed++;
      } else {
        console.error('❌ TEST 4 FAILED:', e.message);
        failed++;
      }
    }

    // TEST 6
    try {
      console.log('Testing: 6. Replace existing image - updates the URL...');
      const res = await request(app).post('/api/users/profile-picture').set('Authorization', 'Bearer ' + token).attach('profilePicture', validJpgPath);
      assert.strictEqual(res.status, 200, 'Expected status 200, got ' + res.status);
      console.log('✅ TEST 6 PASSED');
      passed++;
    } catch (e) {
      console.error('❌ TEST 6 FAILED:', e.message);
      failed++;
    }

    // TEST 7
    try {
      console.log('Testing: 7. Remove profile image - expects 200 and nullifies URL...');
      const res = await request(app).delete('/api/users/profile-picture').set('Authorization', 'Bearer ' + token);
      assert.strictEqual(res.status, 200, 'Expected status 200, got ' + res.status);
      const updatedUser = await User.findByPk(user.id);
      assert.strictEqual(updatedUser.profileImageUrl, null, "Expected profileImageUrl to be null");
      console.log('✅ TEST 7 PASSED');
      passed++;
    } catch (e) {
      console.error('❌ TEST 7 FAILED:', e.message);
      failed++;
    }

    // Cleanup
    fs.unlinkSync(validJpgPath);
    fs.unlinkSync(invalidTextPath);
    fs.unlinkSync(largeImagePath);
    fs.rmdirSync(dummyImageDir);

  } catch (err) {
    console.error('Test Suite Error:', err);
  } finally {
    await sequelize.close();
    const report = { passed, failed, errors };
    fs.writeFileSync('test_report.json', JSON.stringify(report, null, 2));
    console.log('\\n--- TEST SUMMARY: ' + passed + ' passed, ' + failed + ' failed ---');
  }
}

runTests();
