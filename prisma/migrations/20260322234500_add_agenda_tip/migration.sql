-- CreateTable
CREATE TABLE "AgendaTip" (
    "id" SERIAL NOT NULL,
    "message" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'new',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AgendaTip_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AgendaTip_status_createdAt_idx" ON "AgendaTip"("status", "createdAt");