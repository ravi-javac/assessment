import { DataSource, getConnectionManager } from 'typeorm';
import { config } from './env';

const getDbConfig = () => {
  const isProduction = config.nodeEnv === 'production';
  const entityPath = isProduction ? 'dist/modules/**/*.entity.js' : 'src/modules/**/*.entity.ts';
  
  const dbConfig: any = {
    name: 'default',
    type: 'mysql' as const,
    synchronize: true,
    logging: config.nodeEnv === 'development',
    entities: [entityPath],
    migrations: ['dist/migrations/*.js'],
    subscribers: ['dist/subscribers/*.js'],
    charset: 'utf8mb4',
    supportBigNumbers: true,
    bigNumberStrings: true,
    database: config.db.name,
    host: config.db.host,
    port: config.db.port,
    username: config.db.username,
    password: config.db.password,
  };

  return dbConfig;
};

class DefaultDataSource {
  private ds: DataSource | null = null;
  
  getRepository(entityClass: any) {
    if (!this.ds) {
      const manager = getConnectionManager();
      if (manager.has('default')) {
        this.ds = manager.get('default');
      }
    }
    if (this.ds) {
      return this.ds.getRepository(entityClass);
    }
    throw new Error('Database not initialized');
  }
  
  get manager() {
    return this.ds?.manager;
  }
}

export const AppDataSource = new DefaultDataSource() as any;

export async function initializeDatabase(): Promise<void> {
  const maxRetries = 5;
  let lastError: any;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const dbConfig = getDbConfig();
      const manager = getConnectionManager();
      
      // Remove previous connection if exists
      if (manager.has('default')) {
        const existingDs = manager.get('default');
        if (existingDs.isInitialized) {
          try {
            await existingDs.destroy();
          } catch (e) {}
        }
      }
      
      manager.create(dbConfig);
      const ds = manager.get('default');
      await ds.initialize();
      
      // Set the initialized DataSource for the repository wrapper
      (AppDataSource as any).ds = ds;
      
      console.log('✓ Database connected successfully');
      return;
    } catch (error: any) {
      lastError = error;
      const message = error.message || error.sqlMessage || error.toString();
      console.error(`✗ Database connection attempt ${attempt}/${maxRetries} failed:`, message);
      
      if (attempt < maxRetries) {
        const waitTime = 1000 * attempt;
        console.log(`  Retrying in ${waitTime}ms...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
  }

  console.error('✗ Failed to connect to database after', maxRetries, 'attempts');
  console.error('\n⚠️  Database Connection Troubleshooting:');
  console.error('  1. Ensure MySQL/MariaDB is running: systemctl status mariadb');
  console.error('  2. Check .env file has correct DB credentials');
  console.error('  3. Try: mysql -u root -e "SELECT 1;"');
  console.error('  4. Create database: mysql -u root -e "CREATE DATABASE SAMEEKSHA_AI;"');
  throw lastError;
}
