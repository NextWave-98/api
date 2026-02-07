import 'reflect-metadata';
import { Sequelize } from 'sequelize-typescript';
import { config } from './env';
import { getAllModels, initializeAssociations } from '../../models';

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
    await sequelize.authenticate();
    console.log('✓ Database connection has been established successfully.');
    
    initializeAssociations();

    if (config.nodeEnv === 'development' && process.env.AUTO_SYNC === 'true') {
      await sequelize.sync({ alter: true });
      console.log('✓ Database models synchronized.');
    }
  } catch (error) {
    console.error('✗ Unable to connect to the database:', error);
    // In serverless environments, don't exit - just log the error
    // Routes will handle database connection errors gracefully
    if (config.nodeEnv !== 'production') {
      console.error('Database connection failed. Some features may not work.');
    }
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