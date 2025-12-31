import prisma from './src/shared/config/database';
import bcrypt from 'bcrypt';

async function resetAdminPassword() {
  const hashedPassword = await bcrypt.hash('Admin@123', 10);
  
  const admin = await prisma.user.update({
    where: { email: 'admin@123.com' },
    data: { password: hashedPassword }
  });
  
  console.log(`Password reset for: ${admin.name} (${admin.email})`);
  console.log('New password: Admin@123');
  
  await prisma.$disconnect();
}

resetAdminPassword();

