-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ROOT', 'CREATOR');

-- CreateEnum
CREATE TYPE "UserPlan" AS ENUM ('FREE', 'CREATOR', 'PRO');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "plan" "UserPlan" NOT NULL DEFAULT 'FREE',
ADD COLUMN     "role" "UserRole" NOT NULL DEFAULT 'CREATOR';
