-- Add expiration timestamp for email verification tokens
ALTER TABLE "User" ADD COLUMN "emailVerifyTokenExpiresAt" TIMESTAMP(3);

