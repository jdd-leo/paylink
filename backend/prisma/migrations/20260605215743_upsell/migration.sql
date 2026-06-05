-- CreateTable
CREATE TABLE "UpsellProduct" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "photoPath" TEXT,
    "price" DECIMAL(10,2) NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UpsellProduct_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LinkUpsell" (
    "id" TEXT NOT NULL,
    "linkId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "LinkUpsell_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "UpsellProduct_userId_idx" ON "UpsellProduct"("userId");

-- CreateIndex
CREATE INDEX "LinkUpsell_linkId_idx" ON "LinkUpsell"("linkId");

-- CreateIndex
CREATE INDEX "LinkUpsell_productId_idx" ON "LinkUpsell"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "LinkUpsell_linkId_productId_key" ON "LinkUpsell"("linkId", "productId");

-- AddForeignKey
ALTER TABLE "UpsellProduct" ADD CONSTRAINT "UpsellProduct_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LinkUpsell" ADD CONSTRAINT "LinkUpsell_linkId_fkey" FOREIGN KEY ("linkId") REFERENCES "PaymentLink"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LinkUpsell" ADD CONSTRAINT "LinkUpsell_productId_fkey" FOREIGN KEY ("productId") REFERENCES "UpsellProduct"("id") ON DELETE CASCADE ON UPDATE CASCADE;
