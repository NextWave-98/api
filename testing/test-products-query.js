require('dotenv').config();
const { Sequelize, DataTypes } = require('sequelize');

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  logging: console.log, // Enable logging to see the actual SQL
  define: {
    timestamps: true,
    underscored: true,
  },
});

// Define a simple Product model for testing
const Product = sequelize.define('Product', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  productCode: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  categoryId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
}, {
  tableName: 'products',
  underscored: true,
  timestamps: true,
});

async function testQuery() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connected successfully');

    console.log('\n📊 Testing Product.findAndCountAll with pagination...\n');
    
    const result = await Product.findAndCountAll({
      where: {},
      limit: 10,
      offset: 0,
      order: [['createdAt', 'DESC']],
    });

    console.log('\n✅ Query successful!');
    console.log(`Total count: ${result.count}`);
    console.log(`Fetched: ${result.rows.length} products`);
    
    if (result.rows.length > 0) {
      console.log('\nFirst product:');
      console.log(JSON.stringify(result.rows[0].toJSON(), null, 2));
    }

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('\nFull error:');
    console.error(error);
  } finally {
    await sequelize.close();
  }
}

testQuery();
