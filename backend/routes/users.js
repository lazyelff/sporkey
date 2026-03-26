const express = require('express');
const router = express.Router();
const User = require('../models/User');
const authMiddleware = require('../middleware/authMiddleware');
const multer = require('multer');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcrypt');
const { Op } = require('sequelize');
const rateLimit = require('express-rate-limit');

// Rate limiters
const profileLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // Limit each IP to 10 requests per window
    message: { success: false, message: 'Too many profile updates, please try again later.' }
});

const passwordLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 5, // Limit each IP to 5 requests per window
    message: { success: false, message: 'Too many password attempts, please try again later.' }
});

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir);
}

// Configure multer (Store in memory to process with sharp before saving)
const storage = multer.memoryStorage();
const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB limit
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type'), false);
        }
    }
});

// Middleware to catch multer errors
const uploadMiddleware = (req, res, next) => {
    upload.single('profilePicture')(req, res, (err) => {
        if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
            return res.status(413).json({ message: 'File too large (max 5MB)' });
        } else if (err) {
            return res.status(400).json({ message: err.message });
        }
        next();
    });
};

router.post('/heartbeat', authMiddleware, async (req, res) => {
  try {
    await User.update(
      { lastActiveAt: new Date() },
      { where: { id: req.user.user.id } }
    );
    res.status(200).send('OK');
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

router.post('/profile-picture', authMiddleware, uploadMiddleware, async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        const user = await User.findByPk(req.user.user.id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        // Generate unique filename
        const filename = `user-${user.id}-${Date.now()}.webp`;
        const filepath = path.join(uploadsDir, filename);

        // Process with sharp
        try {
            await sharp(req.file.buffer)
                .resize({ width: 512, height: 512, fit: 'cover' })
                .webp({ quality: 80 })
                .toFile(filepath);
        } catch (sharpError) {
            return res.status(400).json({ message: 'Invalid image content' });
        }

        // Delete old image if it exists
        if (user.profileImageUrl) {
            const oldFilename = user.profileImageUrl.split('/').pop();
            const oldFilepath = path.join(uploadsDir, oldFilename);
            if (fs.existsSync(oldFilepath)) {
                fs.unlinkSync(oldFilepath);
            }
        }

        const newImageUrl = `/uploads/${filename}`;
        user.profileImageUrl = newImageUrl;
        await user.save();

        res.json({ message: 'Profile picture updated successfully', profileImageUrl: newImageUrl });
    } catch (error) {
        console.error('Upload Error:', error);
        res.status(500).json({ message: 'Server error during upload' });
    }
});

router.delete('/profile-picture', authMiddleware, async (req, res) => {
    try {
        const user = await User.findByPk(req.user.user.id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        if (user.profileImageUrl) {
            const oldFilename = user.profileImageUrl.split('/').pop();
            const oldFilepath = path.join(uploadsDir, oldFilename);
            if (fs.existsSync(oldFilepath)) {
                fs.unlinkSync(oldFilepath);
            }
            user.profileImageUrl = null;
            await user.save();
        }

        res.json({ message: 'Profile picture removed successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error removing picture' });
    }
});

// GET /api/users/me - Return current user profile
router.get('/me', authMiddleware, async (req, res) => {
    try {
        const user = await User.findByPk(req.user.user.id, {
            attributes: { exclude: ['password'] }
        });
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });
        res.json({ success: true, data: user });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error fetching user profile' });
    }
});

// PUT /api/users/profile - Update username/email
router.put('/profile', authMiddleware, profileLimiter, async (req, res) => {
    const { username, email } = req.body;
    
    if (!username || !email) {
        return res.status(400).json({ success: false, message: 'Username and email are required' });
    }

    try {
        const user = await User.findByPk(req.user.user.id);
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        // Check if modifying username or email leads to conflict
        const isEmailChanging = user.email !== email;
        const isUsernameChanging = user.username !== username;
        
        let conflictOrCondition = [];
        if (isUsernameChanging) conflictOrCondition.push({ username });
        if (isEmailChanging) conflictOrCondition.push({ email });
        
        if (conflictOrCondition.length > 0) {
            const existingUser = await User.findOne({
                where: {
                    [Op.or]: conflictOrCondition,
                    id: { [Op.ne]: user.id }
                }
            });

            if (existingUser) {
                return res.status(409).json({ success: false, message: 'Username or email already in use' });
            }
        }

        if (isUsernameChanging) {
            user.username = username;
        }

        if (isEmailChanging) {
            user.pendingEmail = email; // Save to pending mapping, keep old
        }

        await user.save();

        const updatedUser = user.toJSON();
        delete updatedUser.password;
        
        res.json({ 
            success: true, 
            message: 'Profile updated successfully', 
            data: updatedUser 
        });
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ success: false, message: 'Server error updating profile' });
    }
});

// PUT /api/users/password - Change password
router.put('/password', authMiddleware, passwordLimiter, async (req, res) => {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
        return res.status(400).json({ success: false, message: 'Current and new passwords are required' });
    }
    
    if (newPassword.length < 8) {
        return res.status(400).json({ success: false, message: 'New password must be at least 8 characters' });
    }

    try {
        const user = await User.findByPk(req.user.user.id);
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return res.status(400).json({ success: false, message: 'Incorrect current password' });
        }

        const isSameAsOld = await bcrypt.compare(newPassword, user.password);
        if (isSameAsOld) {
            return res.status(400).json({ success: false, message: 'New password must be different from current password' });
        }

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);
        await user.save();

        res.json({ success: true, message: 'Password updated successfully' });
    } catch (error) {
        console.error('Password change error:', error);
        res.status(500).json({ success: false, message: 'Server error changing password' });
    }
});

// DELETE /api/users - Delete account
router.delete('/', authMiddleware, async (req, res) => {
    const { password, confirmationString } = req.body;

    if (!password) {
        return res.status(400).json({ success: false, message: 'Password is required to delete account' });
    }
    if (confirmationString !== 'DELETE') {
        return res.status(400).json({ success: false, message: 'You must type DELETE to confirm' });
    }

    try {
        const user = await User.findByPk(req.user.user.id);
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ success: false, message: 'Incorrect password' });
        }

        // Delete profile image if exists
        if (user.profileImageUrl) {
            const filename = user.profileImageUrl.split('/').pop();
            const filepath = path.join(uploadsDir, filename);
            if (fs.existsSync(filepath)) {
                fs.unlinkSync(filepath);
            }
        }

        await user.destroy();

        res.json({ success: true, message: 'Account deleted successfully' });
    } catch (error) {
        console.error('Delete account error:', error);
        res.status(500).json({ success: false, message: 'Server error deleting account' });
    }
});

module.exports = router;

