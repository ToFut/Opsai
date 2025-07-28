
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
  

  
  // Seed Properties
  const sampleProperty = await prisma.property.upsert({
    where: { id: 'sample-property' },
    update: {},
    create: {
      id: 'sample-property',
      title: 'Sample Value',
      address: 'Sample Value',
      city: 'Sample Value',
      price: 42,
      bedrooms: 42,
      bathrooms: 42,
      amenities: '{}',
      images: '{}',
      status: 'available',
      createdAt: 'new Date()',
      tenantId: tenant.id,
    }
  });

  console.log('✅ Created sample Properties:', sampleProperty.id);

  // Seed Reservations
  const sampleReservation = await prisma.reservation.upsert({
    where: { id: 'sample-reservation' },
    update: {},
    create: {
      id: 'sample-reservation',
      checkIn: 'new Date()',
      checkOut: 'new Date()',
      totalPrice: 42,
      status: 'pending',
      createdAt: 'new Date()',
      tenantId: tenant.id,
    }
  });

  console.log('✅ Created sample Reservations:', sampleReservation.id);

  // Seed Guests
  const sampleGuest = await prisma.guest.upsert({
    where: { id: 'sample-guest' },
    update: {},
    create: {
      id: 'sample-guest',
      name: 'Sample Value',
      email: 'Sample Value',
      phone: 'Sample Value',
      createdAt: 'new Date()',
      tenantId: tenant.id,
    }
  });

  console.log('✅ Created sample Guests:', sampleGuest.id);

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
