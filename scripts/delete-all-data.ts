import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function deleteAllData() {
  try {
    // Delete in correct order to handle foreign key constraints
    await prisma.$transaction([
      prisma.callQuality.deleteMany(),
      prisma.performanceMetrics.deleteMany(),
      prisma.agentStatusHistory.deleteMany(),
      prisma.agentStatusInfo.deleteMany(),
      prisma.recording.deleteMany(),
      prisma.call.deleteMany(),
      prisma.query.deleteMany(),
      prisma.session.deleteMany(),
      prisma.supervisorKey.deleteMany(),
      prisma.userActivityLog.deleteMany(),
      prisma.user.deleteMany(),
    ]);

    console.log('All data has been deleted successfully');
  } catch (error) {
    console.error('Error deleting data:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the function
deleteAllData()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 