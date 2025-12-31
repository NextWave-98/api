import 'reflect-metadata';
import { Sequelize } from 'sequelize-typescript';
import { config } from './env';
import { getAllModels, initializeAssociations } from '../../models';

// console.log(' DEBUG DATABASE_URL:', config.databaseUrl);

const sequelize = new Sequelize(config.databaseUrl, {
  dialect: 'postgres',
  logging: false, //process.env.NODE_ENV === 'development' ? console.log : false,
  models: getAllModels(),
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
    
    // Initialize model associations
    initializeAssociations();

    // Sync models in development (optional)
    if (process.env.NODE_ENV === 'development' && process.env.AUTO_SYNC === 'true') {
      await sequelize.sync({ alter: true });
      console.log('✓ Database models synchronized.');
    }
  } catch (error) {
    console.error('✗ Unable to connect to the database:', error);
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

