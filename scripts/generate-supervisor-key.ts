import { PrismaClient } from '@prisma/client';
import { randomBytes } from 'crypto';

const prisma = new PrismaClient();

async function generateSupervisorKey() {
  try {
    // Generate a random 32-byte hex string
    const key = randomBytes(32).toString('hex');
    
    // Create the supervisor key in the database
    const supervisorKey = await prisma.supervisorKey.create({
      data: {
        key,
        used: false
      }
    });

    console.log('Generated supervisor key:', key);
    console.log('Key ID:', supervisorKey.id);
    
    return key;
  } catch (error) {
    console.error('Error generating supervisor key:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the function
generateSupervisorKey()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 