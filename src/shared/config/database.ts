import 'reflect-metadata';
import { Sequelize } from 'sequelize-typescript';
import { config } from './env';
import { getAllModels, initializeAssociations } from '../../models';

console.log('🔍 Database Configuration:');
console.log(`- Environment: ${config.nodeEnv}`);
console.log(`- Database URL exists: ${!!config.databaseUrl}`);
console.log(`- Database URL preview: ${config.databaseUrl?.substring(0, 20)}...`);

const sequelize = new Sequelize(config.databaseUrl, {
  dialect: 'postgres',
  logging: config.nodeEnv === 'development' ? console.log : false,
  models: getAllModels(),
  dialectOptions: {
    ssl: config.nodeEnv === 'production' ? {
      require: true,
      rejectUnauthorized: false
    } : false
  },
  pool: {
    max: 10,
    min: 2,
    acquire: 30000,
    idle: 10000,
  },
  define: {
    timestamps: true,
    underscored: false,
    freezeTableName: true,
  },
});

export const connectDatabase = async (): Promise<void> => {
  try {
    console.log('🔌 Attempting to connect to database...');
    await sequelize.authenticate();
    console.log('✓ Database connection has been established successfully.');
    
    initializeAssociations();

    if (config.nodeEnv === 'development' && process.env.AUTO_SYNC === 'true') {
      await sequelize.sync({ alter: true });
      console.log('✓ Database models synchronized.');
    }
  } catch (error) {
    console.error('✗ Unable to connect to the database:', error);
    console.error('💡 Check your DATABASE_URL in Railway variables');
    process.exit(1);
  }
};

export const closeDatabase = async (): Promise<void> => {
  try {
    await sequelize.close();
    console.log('✓ Database connection closed.');
  } catch (error) {
    console.error('✗ Error closing database connection:', error);
  }
};

export default sequelize;