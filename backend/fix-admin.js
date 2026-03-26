const bcrypt = require('bcrypt');
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: './database.sqlite',
    logging: false
});

async function fixAdmin() {
    try {
        await sequelize.authenticate();
        console.log('Connected to database');
        
        const User = sequelize.define('User', {
            id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
            username: { type: Sequelize.STRING, unique: true },
            email: { type: Sequelize.STRING, unique: true },
            password: { type: Sequelize.STRING },
            role: { type: Sequelize.STRING, defaultValue: 'user' }
        });
        
        const admin = await User.findOne({ where: { email: 'admin@sporkey.com' } });
        
        if (!admin) {
            console.log('Admin user not found, creating...');
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash('admin123', salt);
            await User.create({
                username: 'admin',
                email: 'admin@sporkey.com',
                password: hashedPassword,
                role: 'admin'
            });
            console.log('Admin created with bcrypt hash');
        } else {
            console.log('Found admin user:');
            console.log('  Username:', admin.username);
            console.log('  Email:', admin.email);
            console.log('  Password hash:', admin.password.substring(0, 50) + '...');
            console.log('  Role:', admin.role);
            
            // Test if password matches
            const isMatch = await bcrypt.compare('admin123', admin.password);
            console.log('  Password "admin123" matches:', isMatch);
            
            if (!isMatch) {
                console.log('Updating password hash...');
                const salt = await bcrypt.genSalt(10);
                const hashedPassword = await bcrypt.hash('admin123', salt);
                admin.password = hashedPassword;
                await admin.save();
                console.log('Password hash updated');
            }
        }
        
        // Verify
        const verifyAdmin = await User.findOne({ where: { email: 'admin@sporkey.com' } });
        const verifyMatch = await bcrypt.compare('admin123', verifyAdmin.password);
        console.log('\nVerification - Password matches:', verifyMatch);
        
    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        await sequelize.close();
    }
}

fixAdmin();
