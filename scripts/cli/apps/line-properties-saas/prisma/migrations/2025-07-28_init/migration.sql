CREATE TABLE "tenants" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL UNIQUE,
  "settings" JSONB,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  
  CONSTRAINT "tenants_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "tenants_slug_idx" ON "tenants"("slug");
CREATE TABLE "property" (
  "id" TEXT NOT NULL UNIQUE,
  "title" TEXT NOT NULL,
  "address" TEXT NOT NULL,
  "city" TEXT NOT NULL,
  "price" DOUBLE PRECISION NOT NULL,
  "bedrooms" DOUBLE PRECISION NOT NULL,
  "bathrooms" DOUBLE PRECISION NOT NULL,
  "amenities" JSONB,
  "images" JSONB,
  "status" TEXT NOT NULL DEFAULT 'available',
  "created_at" TIMESTAMP(3) NOT NULL,
  "tenant_id" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "property_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "property_id_idx" ON "property"("id");
CREATE INDEX "property_tenant_id_idx" ON "property"("tenant_id");


CREATE TABLE "reservation" (
  "id" TEXT NOT NULL UNIQUE,
  "property_id" TEXT NOT NULL,
  "guest_id" TEXT NOT NULL,
  "check_in" TIMESTAMP(3) NOT NULL,
  "check_out" TIMESTAMP(3) NOT NULL,
  "total_price" DOUBLE PRECISION NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'pending',
  "created_at" TIMESTAMP(3) NOT NULL,
  "tenant_id" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "reservation_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "reservation_id_idx" ON "reservation"("id");
CREATE INDEX "reservation_tenant_id_idx" ON "reservation"("tenant_id");


CREATE TABLE "guest" (
  "id" TEXT NOT NULL UNIQUE,
  "name" TEXT NOT NULL,
  "email" TEXT NOT NULL UNIQUE,
  "phone" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL,
  "tenant_id" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "guest_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "guest_id_idx" ON "guest"("id");
CREATE UNIQUE INDEX "guest_email_idx" ON "guest"("email");
CREATE INDEX "guest_tenant_id_idx" ON "guest"("tenant_id");