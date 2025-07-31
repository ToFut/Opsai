
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  
  // Create default tenant
  const tenant = await prisma.tenant.upsert({
    where: { slug: 'default' },
    update: {},
    create: {
      id: 'tenant-default',
      name: 'Default Tenant',
      slug: 'default',
      settings: {}
    }
  });

  console.log('✅ Created default tenant:', tenant.name);
  

  
  // Create default admin user
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@techcorp-platform.com' },
    update: {},
    create: {
      id: 'user-admin',
      email: 'admin@techcorp-platform.com',
      firstName: 'Admin',
      lastName: 'User',
      role: 'admin',
      tenantId: tenant.id,
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
      createdAt: "now",
      updatedAt: "now",
      tenantId: tenant.id,
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
      createdAt: "now",
      updatedAt: "now",
      tenantId: tenant.id,
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
      createdAt: "now",
      updatedAt: "now",
      tenantId: tenant.id,
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
      domain: "Sample domain 1",
      plan: "starter",
      billingEmail: "sample1@organization.com",
      createdAt: "now",
      updatedAt: "now",
      tenantId: tenant.id,
    }
  });

  const sampleOrganization2 = await prisma.Organization.upsert({
    where: { id: 'sample-organization-2' },
    update: {},
    create: {
      id: 'sample-organization-2',
      name: "Test organization",
      domain: "Sample domain 2",
      plan: "starter",
      billingEmail: "sample2@organization.com",
      createdAt: "now",
      updatedAt: "now",
      tenantId: tenant.id,
    }
  });

  const sampleOrganization3 = await prisma.Organization.upsert({
    where: { id: 'sample-organization-3' },
    update: {},
    create: {
      id: 'sample-organization-3',
      name: "Demo organization",
      domain: "Sample domain 3",
      plan: "starter",
      billingEmail: "sample3@organization.com",
      createdAt: "now",
      updatedAt: "now",
      tenantId: tenant.id,
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
      status: "planning",
      budget: 10.5,
      createdBy: "Sample createdby 1",
      createdAt: "now",
      updatedAt: "now",
      tenantId: tenant.id,
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
      status: "planning",
      budget: 21,
      createdBy: "Sample createdby 2",
      createdAt: "now",
      updatedAt: "now",
      tenantId: tenant.id,
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
      status: "planning",
      budget: 31.5,
      createdBy: "Sample createdby 3",
      createdAt: "now",
      updatedAt: "now",
      tenantId: tenant.id,
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
      priority: "medium",
      status: "todo",
      createdAt: "now",
      updatedAt: "now",
      tenantId: tenant.id,
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
      priority: "medium",
      status: "todo",
      createdAt: "now",
      updatedAt: "now",
      tenantId: tenant.id,
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
      priority: "medium",
      status: "todo",
      createdAt: "now",
      updatedAt: "now",
      tenantId: tenant.id,
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
