import { Sequelize } from 'sequelize-typescript';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

const env = process.env.NODE_ENV || 'development';

// Parse DATABASE_URL if provided, otherwise use individual credentials
const getDatabaseConfig = () => {
  if (process.env.DATABASE_URL) {
    return {
      url: process.env.DATABASE_URL,
      dialect: 'postgres' as const,
    };
  }

  // Ensure password is always a string to prevent SCRAM authentication errors
  const password = process.env.DB_PASSWORD;

  return {
    database: process.env.DB_NAME || 'lts_db',
    username: process.env.DB_USER || 'postgres',
    password: password ? String(password) : '', // Convert to string explicitly
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    dialect: 'postgres' as const,
  };
};

export const sequelize = new Sequelize({
  ...getDatabaseConfig(),

  // Models will be added manually via sequelize.addModels() after import
  // This is because we use named exports instead of default exports

  // Logging
  logging: env === 'development' ? console.log : false,

  // Pool configuration for better performance
  pool: {
    max: 20,        // Maximum number of connections
    min: 5,         // Minimum number of connections
    acquire: 30000, // Maximum time (ms) to try to get connection
    idle: 10000,    // Maximum time (ms) a connection can be idle
  },

  // Global model options
  define: {
    timestamps: true,      // Add createdAt and updatedAt
    underscored: true,     // Use snake_case for database columns
    freezeTableName: true, // Don't pluralize table names
  },

  // Timezone (Sri Lanka)
  timezone: '+05:30',

  // Disable legacy operators (security)
  dialectOptions: {
    useUTC: false,
  },
});

/**
 * Test database connection
 */
export const testConnection = async (): Promise<void> => {
  try {
    await sequelize.authenticate();
    console.log('✅ Sequelize: Database connection established successfully.');
  } catch (error) {
    console.error('❌ Sequelize: Unable to connect to the database:', error);
    throw error;
  }
};

/**
 * Initialize all models and associations
 * Only use in development for auto-sync
 */
export const initializeDatabase = async (options?: { force?: boolean; alter?: boolean }): Promise<void> => {
  try {
    if (env === 'development' && options?.alter) {
      await sequelize.sync({ alter: true });
      console.log('✅ Sequelize: Database synchronized (alter mode).');
    } else if (options?.force) {
      console.warn('⚠️  Sequelize: Force sync will drop all tables!');
      await sequelize.sync({ force: true });
      console.log('✅ Sequelize: Database synchronized (force mode).');
    }
  } catch (error) {
    console.error('❌ Sequelize: Database synchronization failed:', error);
    throw error;
  }
};

/**
 * Close database connection gracefully
 */
export const closeConnection = async (): Promise<void> => {
  try {
    await sequelize.close();
    console.log('✅ Sequelize: Database connection closed.');
  } catch (error) {
    console.error('❌ Sequelize: Error closing database connection:', error);
    throw error;
  }
};

export default sequelize;

