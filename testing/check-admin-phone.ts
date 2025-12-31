import prisma from './src/shared/config/database';

async function checkAdminPhone() {
  const adminRole = await prisma.role.findFirst({ where: { name: 'ADMIN' } });
  
  if (!adminRole) {
    console.log('❌ No ADMIN role found');
    return;
  }
  
  const admins = await prisma.user.findMany({
    where: { roleId: adminRole.id, isActive: true },
    include: { staff: true }
  });
  
  console.log('=== ADMIN USERS ===\n');
  admins.forEach(a => {
    console.log(`Name: ${a.name}`);
    console.log(`Email: ${a.email}`);
    console.log(`Has Staff Record: ${!!a.staff}`);
    console.log(`Phone: ${a.staff?.phoneNumber || '❌ NO PHONE'}`);
    console.log(`User ID: ${a.id}`);
    console.log('');
  });
  
  const adminsWithPhone = admins.filter(a => a.staff?.phoneNumber);
  console.log(`✅ Admins with phone: ${adminsWithPhone.length}`);
  console.log(`❌ Admins without phone: ${admins.length - adminsWithPhone.length}`);
  
  if (adminsWithPhone.length === 0) {
    console.log('\n⚠️  PROBLEM: No admin users have phone numbers!');
    console.log('   Notifications require phone numbers in staff table.');
    console.log('   This is why admin notifications are not being sent.');
  }
  
  await prisma.$disconnect();
}

checkAdminPhone().catch(console.error);

