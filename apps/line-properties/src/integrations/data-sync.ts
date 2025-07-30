import { PrismaClient } from '@prisma/client';
import { guestyApiClient } from './guesty_api';

const prisma = new PrismaClient();

interface GuestyProperty {
  _id: string;
  title: string;
  address?: {
    full?: string;
    city?: string;
  };
  prices?: {
    basePrice?: number;
  };
  bedrooms?: number;
  bathrooms?: number;
  amenities?: string[];
  pictures?: Array<{ original: string }>;
  active?: boolean;
}

interface TransformedProperty {
  externalId: string;
  title: string;
  address: string;
  city: string;
  price: number;
  bedrooms: number;
  bathrooms: number;
  amenities: string[];
  images: string[];
  status: string;
}

export class DataSyncService {
  
  // Transform Guesty data to our schema
  transformGuestyProperty(guestyProperty: GuestyProperty): TransformedProperty {
    return {
      externalId: guestyProperty._id || '',
      title: guestyProperty.title || 'Untitled Property',
      address: guestyProperty.address?.full || 'Address not provided',
      city: guestyProperty.address?.city || 'Unknown City',
      price: guestyProperty.prices?.basePrice || 0,
      bedrooms: guestyProperty.bedrooms || 1,
      bathrooms: guestyProperty.bathrooms || 1,
      amenities: guestyProperty.amenities || [],
      images: guestyProperty.pictures?.map(pic => pic.original) || [],
      status: guestyProperty.active ? 'available' : 'unavailable'
    };
  }

  // Sync properties from Guesty to local database
  async syncProperties(): Promise<{ synced: number; errors: number }> {
    let synced = 0;
    let errors = 0;

    try {
      console.log('🔄 Starting property sync from Guesty...');
      
      // Fetch from Guesty API
      const guestyResponse = await guestyApiClient.getListings({ limit: 100 });
      const guestyProperties = guestyResponse.listings || guestyResponse.data || [];

      console.log(`📥 Fetched ${guestyProperties.length} properties from Guesty`);

      for (const guestyProperty of guestyProperties) {
        try {
          const transformed = this.transformGuestyProperty(guestyProperty);
          
          // Upsert property in database
          await prisma.property.upsert({
            where: { 
              externalId: transformed.externalId
            },
            update: {
              title: transformed.title,
              address: transformed.address,
              city: transformed.city,
              price: transformed.price,
              bedrooms: transformed.bedrooms,
              bathrooms: transformed.bathrooms,
              amenities: JSON.stringify(transformed.amenities),
              images: JSON.stringify(transformed.images),
              status: transformed.status,
              updatedAt: new Date(),
            },
            create: {
              externalId: transformed.externalId,
              title: transformed.title,
              address: transformed.address,
              city: transformed.city,
              price: transformed.price,
              bedrooms: transformed.bedrooms,
              bathrooms: transformed.bathrooms,
              amenities: JSON.stringify(transformed.amenities),
              images: JSON.stringify(transformed.images),
              status: transformed.status,
              tenantId: 'default-tenant',
              createdAt: new Date(),
              updatedAt: new Date(),
            }
          });

          synced++;
          console.log(`✅ Synced property: ${transformed.title}`);
          
        } catch (error) {
          errors++;
          console.error(`❌ Error syncing property:`, error);
        }
      }

      console.log(`🎉 Sync completed: ${synced} synced, ${errors} errors`);
      return { synced, errors };

    } catch (error) {
      console.error('💥 Sync failed:', error);
      return { synced, errors: errors + 1 };
    }
  }

  // Get combined data (Guesty + Local)
  async getCombinedProperties(page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    
    // Try to get fresh data from Guesty
    let guestyProperties = [];
    try {
      const guestyResponse = await guestyApiClient.getListings({ limit, offset: skip });
      guestyProperties = (guestyResponse.listings || guestyResponse.data || [])
        .map(prop => this.transformGuestyProperty(prop));
      console.log(`📡 Live Guesty data: ${guestyProperties.length} properties`);
    } catch (error) {
      console.log('⚠️ Guesty API unavailable, using cached data');
    }

    // Get local/cached properties
    const localProperties = await prisma.property.findMany({
      skip,
      take: limit,
      orderBy: { updatedAt: 'desc' }
    });

    const transformedLocal = localProperties.map(prop => ({
      ...prop,
      amenities: prop.amenities ? JSON.parse(prop.amenities as string) : [],
      images: prop.images ? JSON.parse(prop.images as string) : []
    }));

    // Combine and deduplicate
    const combinedMap = new Map();
    
    // Add Guesty properties (priority)
    guestyProperties.forEach(prop => {
      combinedMap.set(prop.externalId, { ...prop, source: 'guesty' });
    });
    
    // Add local properties (if not already from Guesty)
    transformedLocal.forEach(prop => {
      if (!combinedMap.has(prop.externalId)) {
        combinedMap.set(prop.externalId || prop.id, { ...prop, source: 'local' });
      }
    });

    const combined = Array.from(combinedMap.values()).slice(0, limit);
    
    return {
      data: combined,
      pagination: {
        page,
        limit,
        total: combinedMap.size,
        pages: Math.ceil(combinedMap.size / limit)
      },
      sources: {
        guesty: guestyProperties.length,
        local: transformedLocal.length
      }
    };
  }
}

export const dataSyncService = new DataSyncService();