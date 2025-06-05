import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function makeAdmin() {
  try {
    const updatedUser = await prisma.user.update({
      where: { email: 'sam@gmail.com' },
      data: { 
        role: 'admin',
        isAdmin: true
      }
    });
    console.log('User updated to admin:', updatedUser);
  } catch (error) {
    console.error('Error updating user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

makeAdmin(); 