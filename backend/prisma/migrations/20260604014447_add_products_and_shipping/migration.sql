-- AlterTable
ALTER TABLE "PaymentLink" ADD COLUMN     "shipping" DECIMAL(10,2),
ALTER COLUMN "description" DROP NOT NULL;

-- CreateTable
CREATE TABLE "LinkProduct" (
    "id" TEXT NOT NULL,
    "linkId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LinkProduct_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LinkProduct_linkId_idx" ON "LinkProduct"("linkId");

-- AddForeignKey
ALTER TABLE "LinkProduct" ADD CONSTRAINT "LinkProduct_linkId_fkey" FOREIGN KEY ("linkId") REFERENCES "PaymentLink"("id") ON DELETE CASCADE ON UPDATE CASCADE;
