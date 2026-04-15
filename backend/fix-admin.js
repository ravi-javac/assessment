const { AppDataSource } = require('./dist/config/database');
const { User, UserRole } = require('./dist/modules/user/user.entity');

async function fixAdminRole() {
  try {
    await AppDataSource.initialize();
    const userRepository = AppDataSource.getRepository(User);
    const user = await userRepository.findOne({ where: { email: 'admin@sameeksha.ai' } });
    
    if (user) {
      console.log('Found user:', user.email, 'Current role:', user.role);
      if (user.role !== 'admin') {
        user.role = 'admin';
        await userRepository.save(user);
        console.log('Role updated to admin');
      } else {
        console.log('User already has admin role');
      }
    } else {
      console.log('User admin@sameeksha.ai not found');
    }
    
    await AppDataSource.destroy();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

fixAdminRole();