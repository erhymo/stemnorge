-- Backfill existing rows with a unique tokenId (UUID) before adding the NOT NULL + UNIQUE constraint
ALTER TABLE "PasswordResetToken" ADD COLUMN "tokenId" TEXT;

UPDATE "PasswordResetToken" SET "tokenId" = gen_random_uuid()::text WHERE "tokenId" IS NULL;

ALTER TABLE "PasswordResetToken" ALTER COLUMN "tokenId" SET NOT NULL;

CREATE UNIQUE INDEX "PasswordResetToken_tokenId_key" ON "PasswordResetToken"("tokenId");

