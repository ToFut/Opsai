
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  

  
  // Create default admin user
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@test-platform.com' },
    update: {},
    create: {
      id: 'user-admin',
      email: 'admin@test-platform.com',
      firstName: 'Admin',
      lastName: 'User',
      role: 'admin',
      
    }
  });

  console.log('✅ Created admin user:', adminUser.email);
  

  
  // Seed Users
  
  const sampleUser1 = await prisma.User.upsert({
    where: { id: 'sample-user-1' },
    update: {},
    create: {
      id: 'sample-user-1',
      email: "sample1@user.com",
      name: "Sample user 1",
      role: "user",
      isActive: true,
      createdAt: "now",
      updatedAt: "now",
      
    }
  });

  const sampleUser2 = await prisma.User.upsert({
    where: { id: 'sample-user-2' },
    update: {},
    create: {
      id: 'sample-user-2',
      email: "sample2@user.com",
      name: "Test user",
      role: "user",
      isActive: true,
      createdAt: "now",
      updatedAt: "now",
      
    }
  });

  const sampleUser3 = await prisma.User.upsert({
    where: { id: 'sample-user-3' },
    update: {},
    create: {
      id: 'sample-user-3',
      email: "sample3@user.com",
      name: "Demo user",
      role: "user",
      isActive: true,
      createdAt: "now",
      updatedAt: "now",
      
    }
  });

  console.log('✅ Created 3 Users records');


  // Seed Projects
  
  const sampleProject1 = await prisma.Project.upsert({
    where: { id: 'sample-project-1' },
    update: {},
    create: {
      id: 'sample-project-1',
      name: "Sample project 1",
      description: "This is a sample description for project 1",
      userId: "Sample userid 1",
      status: "active",
      createdAt: "now",
      updatedAt: "now",
      
    }
  });

  const sampleProject2 = await prisma.Project.upsert({
    where: { id: 'sample-project-2' },
    update: {},
    create: {
      id: 'sample-project-2',
      name: "Test project",
      description: "This is a sample description for project 2",
      userId: "Sample userid 2",
      status: "active",
      createdAt: "now",
      updatedAt: "now",
      
    }
  });

  const sampleProject3 = await prisma.Project.upsert({
    where: { id: 'sample-project-3' },
    update: {},
    create: {
      id: 'sample-project-3',
      name: "Demo project",
      description: "This is a sample description for project 3",
      userId: "Sample userid 3",
      status: "active",
      createdAt: "now",
      updatedAt: "now",
      
    }
  });

  console.log('✅ Created 3 Projects records');

  console.log('✅ Database seeded successfully');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
