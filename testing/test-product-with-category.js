require('dotenv').config();
const { Sequelize, DataTypes } = require('sequelize');

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  logging: console.log,
  define: {
    timestamps: true,
    underscored: true,
  },
});

// Define Product model
const Product = sequelize.define('Product', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  productCode: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  categoryId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'category_id',
  },
}, {
  tableName: 'products',
  underscored: true,
});

// Define ProductCategory model
const ProductCategory = sequelize.define('ProductCategory', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  categoryCode: {
    type: DataTypes.STRING,
    field: 'category_code',
  },
}, {
  tableName: 'product_categories',
  underscored: true,
});

// Define relationships
Product.belongsTo(ProductCategory, {
  foreignKey: 'category_id',
  as: 'category',
});

async function testQueryWithInclude() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connected successfully\n');

    console.log('📊 Testing Product.findAndCountAll with category include...\n');
    
    const result = await Product.findAndCountAll({
      where: {},
      limit: 10,
      offset: 0,
      order: [['createdAt', 'DESC']],
      include: [
        {
          model: ProductCategory,
          as: 'category',
          attributes: ['id', 'name', 'categoryCode']
        }
      ],
      distinct: true,
    });

    console.log('\n✅ Query successful!');
    console.log(`Total count: ${result.count}`);
    console.log(`Fetched: ${result.rows.length} products`);
    
    if (result.rows.length > 0) {
      console.log('\nFirst product with category:');
      console.log(JSON.stringify(result.rows[0].toJSON(), null, 2));
    }

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('\nOriginal error:');
    console.error(error.original || error);
  } finally {
    await sequelize.close();
  }
}

testQueryWithInclude();
