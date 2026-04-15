import { AppDataSource, initializeDatabase } from './src/config/database';
import { User } from './src/modules/user/user.entity';
import { getConnectionManager } from 'typeorm';

async function fixAdminRole() {
  try {
    await initializeDatabase();
    
    const manager = getConnectionManager();
    const ds = manager.get('default');
    const userRepository = ds.getRepository(User);
    
    const user = await userRepository.findOne({ where: { email: 'admin@sameeksha.ai' } });
    
    if (user) {
      console.log('Found user:', user.email, 'Current role:', user.role);
      if (user.role !== 'admin') {
        user.role = 'admin' as any;
        await userRepository.save(user);
        console.log('Role updated to admin');
      } else {
        console.log('User already has admin role');
      }
    } else {
      console.log('User admin@sameeksha.ai not found');
    }
    
    await ds.destroy();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

fixAdminRole();