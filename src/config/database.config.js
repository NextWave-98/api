// Sequelize CLI configuration file
// This file is used by sequelize-cli for migrations and seeds
// The actual database connection is in database.ts

require('dotenv').config();

const getDevelopmentConfig = () => {
  if (process.env.DATABASE_URL) {
    return {
      url: process.env.DATABASE_URL,
      dialect: 'postgres',
      dialectOptions: {
        ssl: true
      },
      logging: console.log,
      pool: {
        max: 20,
        min: 5,
        acquire: 60000,
        idle: 10000,
      },
      timezone: '+05:30',
    };
  }
  
  return {
    database: process.env.DB_NAME || 'lts_db',
    username: process.env.DB_USER || 'postgres',
    password: String(process.env.DB_PASSWORD || ''),
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    dialect: 'postgres',
    dialectOptions: {
      ssl: false
    },
    logging: console.log,
    pool: {
      max: 20,
      min: 5,
      acquire: 60000,
      idle: 10000,
    },
    timezone: '+05:30',
  };
};

module.exports = {
  development: getDevelopmentConfig(),
  
  production: {
    url: process.env.DATABASE_URL,
    dialect: 'postgres',
    dialectOptions: {
      ssl: process.env.DB_SSL === 'true' ? {
        require: true,
        rejectUnauthorized: false
      } : false
    },
    logging: false,
    pool: {
      max: 20,
      min: 5,
      acquire: 60000,
      idle: 10000,
    },
    timezone: '+05:30', // Sri Lanka timezone
  },

  test: {
    url: process.env.TEST_DATABASE_URL || process.env.DATABASE_URL,
    dialect: 'postgres',
    logging: false,
    pool: {
      max: 5,
      min: 1,
      acquire: 30000,
      idle: 10000,
    },
    timezone: '+05:30', // Sri Lanka timezone
  }
};
