const request = require('supertest');
const app = require('../server');
const sequelize = require('../db');
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const path = require('path');
const fs = require('fs');

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';
let token;
let user;

beforeAll(async () => {
    // Ensure the DB is fully loaded and create a test user
    await sequelize.sync({ force: true });
    
    user = await User.create({
        username: 'testuser',
        email: 'testuser@example.com',
        password: 'hashedpassword123',
        role: 'user'
    });

    token = jwt.sign({ user: { id: user.id, username: user.username, role: user.role } }, JWT_SECRET);
});

afterAll(async () => {
    await sequelize.close();
});

describe('Profile Picture Upload (TDD)', () => {
    
    // Create dummy image files for tests
    const dummyImageDir = path.join(__dirname, 'dummy');
    const validJpgPath = path.join(dummyImageDir, 'valid.jpg');
    const invalidTextPath = path.join(dummyImageDir, 'invalid.txt');
    const largeImagePath = path.join(dummyImageDir, 'large.jpg'); // Pseudo-large file

    beforeAll(() => {
        if (!fs.existsSync(dummyImageDir)) {
            fs.mkdirSync(dummyImageDir);
        }
        fs.writeFileSync(validJpgPath, 'dummy_jpeg_content_that_sharp_wont_like_yet_but_file_is_there');
        fs.writeFileSync(invalidTextPath, 'this is a text file');
        
        // Create a 6MB dummy file
        const largeContent = Buffer.alloc(6 * 1024 * 1024, 'a');
        fs.writeFileSync(largeImagePath, largeContent);
    });

    afterAll(() => {
        // Cleanup dummy files
        fs.unlinkSync(validJpgPath);
        fs.unlinkSync(invalidTextPath);
        fs.unlinkSync(largeImagePath);
        fs.rmdirSync(dummyImageDir);
    });

    it('1. Successful upload - Valid image file, Authenticated, updates profileImageUrl', async () => {
        const res = await request(app)
            .post('/api/users/profile-picture')
            .set('Authorization', `Bearer ${token}`)
            .attach('profilePicture', validJpgPath);

        expect(res.status).toBe(200);
        expect(res.body.message).toBeDefined();
        
        // Verify user profile updated in DB
        const updatedUser = await User.findByPk(user.id);
        expect(updatedUser.profileImageUrl).toBeDefined();
        expect(updatedUser.profileImageUrl).toContain('.webp');
    });

    it('2. Invalid file type - upload non-image file expects 400', async () => {
        const res = await request(app)
            .post('/api/users/profile-picture')
            .set('Authorization', `Bearer ${token}`)
            .attach('profilePicture', invalidTextPath);

        expect(res.status).toBe(400);
    });

    it('3. File too large - exceeds 5MB limit expects 400 or 413', async () => {
        const res = await request(app)
            .post('/api/users/profile-picture')
            .set('Authorization', `Bearer ${token}`)
            .attach('profilePicture', largeImagePath);

        expect([400, 413]).toContain(res.status);
    });

    it('4. Unauthorized request - no auth token expects 401', async () => {
        const res = await request(app)
            .post('/api/users/profile-picture')
            .attach('profilePicture', validJpgPath);

        expect(res.status).toBe(401);
    });

    it('6. Replace existing image - updates the URL', async () => {
        // Assuming the first test sets it, this second upload should still return 200
        const res = await request(app)
            .post('/api/users/profile-picture')
            .set('Authorization', `Bearer ${token}`)
            .attach('profilePicture', validJpgPath);

        expect(res.status).toBe(200);
    });

    it('7. Remove profile image - expects 200 and nullifies URL', async () => {
        const res = await request(app)
            .delete('/api/users/profile-picture')
            .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(200);

        const updatedUser = await User.findByPk(user.id);
        expect(updatedUser.profileImageUrl).toBeNull();
    });
});
