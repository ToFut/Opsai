
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
      settings: JSON.stringify({})
    }
  });

  console.log('✅ Created default tenant:', tenant.name);
  

  
  // Seed Contacts
  const sampleContact = await prisma.contact.upsert({
    where: { id: 'sample-contact' },
    update: {},
    create: {
      id: 'sample-contact',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      phone: '+1-555-0123',
      company: 'Acme Corp',
      jobTitle: 'Sales Manager',
      status: 'new',
      source: 'website',
      notes: 'Interested in our premium package',
      tenantId: tenant.id,
    }
  });

  console.log('✅ Created sample Contacts:', sampleContact.id);

  // Seed Deals
  const sampleDeal = await prisma.deal.upsert({
    where: { id: 'sample-deal' },
    update: {},
    create: {
      id: 'sample-deal',
      title: 'Premium Package Deal',
      value: 50000,
      stage: 'prospecting',
      probability: 75,
      expectedCloseDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      notes: 'High value client, needs custom integration',
      contactId: sampleContact.id,
      tenantId: tenant.id,
    }
  });

  console.log('✅ Created sample Deals:', sampleDeal.id);

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
