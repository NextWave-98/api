import prisma from './src/shared/config/database';

async function checkUsers() {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: { select: { name: true } }
    }
  });
  
  console.log('All Users:');
  users.forEach((u: any) => {
    console.log(`  ${u.name} (${u.email}) - ${u.role.name}`);
  });
  
  await prisma.$disconnect();
}

checkUsers();

