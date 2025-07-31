
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  

  
  // Create default admin user
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@comprehensive-test-app.com' },
    update: {},
    create: {
      id: 'user-admin',
      email: 'admin@comprehensive-test-app.com',
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
      organizationId: "Sample organizationid 1",
      isActive: true,
      preferences: "Sample preferences 1",
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
      organizationId: "Sample organizationid 2",
      isActive: true,
      preferences: "Sample preferences 2",
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
      organizationId: "Sample organizationid 3",
      isActive: true,
      preferences: "Sample preferences 3",
      createdAt: "now",
      updatedAt: "now",
      
    }
  });

  console.log('✅ Created 3 Users records');


  // Seed Organizations
  
  const sampleOrganization1 = await prisma.Organization.upsert({
    where: { id: 'sample-organization-1' },
    update: {},
    create: {
      id: 'sample-organization-1',
      name: "Sample organization 1",
      slug: "Sample slug 1",
      domain: "Sample domain 1",
      plan: "starter",
      billingEmail: "sample1@organization.com",
      settings: "Sample settings 1",
      isActive: true,
      createdAt: "now",
      updatedAt: "now",
      
    }
  });

  const sampleOrganization2 = await prisma.Organization.upsert({
    where: { id: 'sample-organization-2' },
    update: {},
    create: {
      id: 'sample-organization-2',
      name: "Test organization",
      slug: "Sample slug 2",
      domain: "Sample domain 2",
      plan: "starter",
      billingEmail: "sample2@organization.com",
      settings: "Sample settings 2",
      isActive: true,
      createdAt: "now",
      updatedAt: "now",
      
    }
  });

  const sampleOrganization3 = await prisma.Organization.upsert({
    where: { id: 'sample-organization-3' },
    update: {},
    create: {
      id: 'sample-organization-3',
      name: "Demo organization",
      slug: "Sample slug 3",
      domain: "Sample domain 3",
      plan: "starter",
      billingEmail: "sample3@organization.com",
      settings: "Sample settings 3",
      isActive: true,
      createdAt: "now",
      updatedAt: "now",
      
    }
  });

  console.log('✅ Created 3 Organizations records');


  // Seed Projects
  
  const sampleProject1 = await prisma.Project.upsert({
    where: { id: 'sample-project-1' },
    update: {},
    create: {
      id: 'sample-project-1',
      name: "Sample project 1",
      description: "This is a sample description for project 1",
      organizationId: "Sample organizationid 1",
      ownerId: "Sample ownerid 1",
      status: "planning",
      priority: "medium",
      budget: 10.5,
      tags: "Sample tags 1",
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
      organizationId: "Sample organizationid 2",
      ownerId: "Sample ownerid 2",
      status: "planning",
      priority: "medium",
      budget: 21,
      tags: "Sample tags 2",
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
      organizationId: "Sample organizationid 3",
      ownerId: "Sample ownerid 3",
      status: "planning",
      priority: "medium",
      budget: 31.5,
      tags: "Sample tags 3",
      createdAt: "now",
      updatedAt: "now",
      
    }
  });

  console.log('✅ Created 3 Projects records');


  // Seed Tasks
  
  const sampleTask1 = await prisma.Task.upsert({
    where: { id: 'sample-task-1' },
    update: {},
    create: {
      id: 'sample-task-1',
      title: "Sample task 1",
      description: "This is a sample description for task 1",
      projectId: "Sample projectid 1",
      assignedTo: "Sample assignedto 1",
      createdBy: "Sample createdby 1",
      status: "todo",
      priority: "medium",
      estimatedHours: 10,
      actualHours: 10,
      createdAt: "now",
      updatedAt: "now",
      
    }
  });

  const sampleTask2 = await prisma.Task.upsert({
    where: { id: 'sample-task-2' },
    update: {},
    create: {
      id: 'sample-task-2',
      title: "Test task",
      description: "This is a sample description for task 2",
      projectId: "Sample projectid 2",
      assignedTo: "Sample assignedto 2",
      createdBy: "Sample createdby 2",
      status: "todo",
      priority: "medium",
      estimatedHours: 20,
      actualHours: 20,
      createdAt: "now",
      updatedAt: "now",
      
    }
  });

  const sampleTask3 = await prisma.Task.upsert({
    where: { id: 'sample-task-3' },
    update: {},
    create: {
      id: 'sample-task-3',
      title: "Demo task",
      description: "This is a sample description for task 3",
      projectId: "Sample projectid 3",
      assignedTo: "Sample assignedto 3",
      createdBy: "Sample createdby 3",
      status: "todo",
      priority: "medium",
      estimatedHours: 30,
      actualHours: 30,
      createdAt: "now",
      updatedAt: "now",
      
    }
  });

  console.log('✅ Created 3 Tasks records');

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
