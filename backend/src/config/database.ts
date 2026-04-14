import { DataSource, getConnectionManager } from 'typeorm';
import { config } from './env';

const dbConfig = {
  name: 'default',
  type: 'mysql' as const,
  host: 'localhost',
  port: 3307,
  username: 'root',
  password: 'rootpassword',
  database: 'sameeksha_ai',
  synchronize: true,
  logging: config.nodeEnv === 'development',
  entities: ['dist/modules/**/*.entity.js'],
  migrations: ['dist/migrations/*.js'],
  subscribers: ['dist/subscribers/*.js'],
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
  try {
    const manager = getConnectionManager();
    manager.create(dbConfig);
    const ds = manager.get('default');
    await ds.initialize();
    console.log('✓ Database connected successfully');
  } catch (error) {
    console.error('✗ Database connection failed:', error);
    throw error;
  }
}