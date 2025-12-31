const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function updateProductWarranty() {
  try {
    // Find the iPhone 15 product
    const product = await prisma.product.findFirst({
      where: { name: { contains: 'Iphone 15', mode: 'insensitive' } }
    });

    if (!product) {
      console.log('Product not found');
      return;
    }

    console.log('Current Product:', {
      id: product.id,
      name: product.name,
      warrantyMonths: product.warrantyMonths,
      warrantyType: product.warrantyType
    });

    // Update warranty to 12 months
    const updated = await prisma.product.update({
      where: { id: product.id },
      data: {
        warrantyMonths: 12,
        warrantyType: 'STANDARD'
      }
    });

    console.log('\n✅ Updated Product:', {
      id: updated.id,
      name: updated.name,
      warrantyMonths: updated.warrantyMonths,
      warrantyType: updated.warrantyType
    });

    console.log('\n✅ Product now has 12 months warranty!');
    console.log('Try creating a POS sale now and warranty should be auto-generated.');

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

updateProductWarranty();
