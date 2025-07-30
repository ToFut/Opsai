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
      settings: '{}'
    }
  });

  console.log('✅ Created default tenant:', tenant.name);

  // Seed Properties
  const sampleProperty1 = await prisma.property.upsert({
    where: { id: 'sample-property-1' },
    update: {},
    create: {
      id: 'sample-property-1',
      title: 'Luxury Beachfront Villa',
      address: '123 Ocean Drive',
      city: 'Miami',
      price: 450,
      bedrooms: 4,
      bathrooms: 3,
      amenities: '["wifi", "pool", "beach_access"]',
      images: '[]',
      status: 'available',
      tenantId: tenant.id,
    }
  });

  const sampleProperty2 = await prisma.property.upsert({
    where: { id: 'sample-property-2' },
    update: {},
    create: {
      id: 'sample-property-2',
      title: 'Mountain Cabin Retreat',
      address: '456 Mountain View Lane',
      city: 'Aspen',
      price: 350,
      bedrooms: 3,
      bathrooms: 2,
      amenities: '["wifi", "parking", "mountain_view"]',
      images: '[]',
      status: 'available',
      tenantId: tenant.id,
    }
  });

  // Seed Guests
  const sampleGuest1 = await prisma.guest.upsert({
    where: { id: 'sample-guest-1' },
    update: {},
    create: {
      id: 'sample-guest-1',
      name: 'John Smith',
      email: 'john@example.com',
      phone: '+1-555-0101',
      tenantId: tenant.id,
    }
  });

  console.log('✅ Created sample records');
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