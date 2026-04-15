import 'reflect-metadata';
import { initializeDatabase, AppDataSource } from './src/config/database';
import { User, UserRole, UserStatus } from './src/modules/user/user.entity';
import * as bcrypt from 'bcrypt';

async function seedAdmin() {
  try {
    await initializeDatabase();
    
    const userRepository = AppDataSource.getRepository(User);
    
    const adminEmail = 'admin@sameeksha.ai';
    const existingAdmin = await userRepository.findOne({ where: { email: adminEmail } });
    
    if (existingAdmin) {
      console.log('Admin already exists:', adminEmail);
      const hashedPassword = await bcrypt.hash('admin123', 10);
      existingAdmin.password = hashedPassword;
      existingAdmin.role = UserRole.ADMIN;
      existingAdmin.status = UserStatus.ACTIVE;
      await userRepository.save(existingAdmin);
      console.log('Admin user updated (password reset to admin123)');
    } else {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      const admin = userRepository.create({
        email: adminEmail,
        password: hashedPassword,
        firstName: 'System',
        lastName: 'Admin',
        role: UserRole.ADMIN,
        status: UserStatus.ACTIVE,
        isEmailVerified: true,
      });
      
      await userRepository.save(admin);
      console.log('✓ Admin user created successfully');
      console.log('  Email: admin@sameeksha.ai');
      console.log('  Password: admin123');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('✗ Seeding failed:', error);
    process.exit(1);
  }
}

seedAdmin();