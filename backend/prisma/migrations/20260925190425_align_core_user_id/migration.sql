/*
  Warnings:

  - The values [given_away] on the enum `ListingStatus` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `requester_username` on the `borrow_requests` table. All the data in the column will be lost.
  - You are about to drop the column `owner_username` on the `listings` table. All the data in the column will be lost.
  - You are about to drop the column `recipient_username` on the `notifications` table. All the data in the column will be lost.
  - You are about to drop the column `reporter_username` on the `reports` table. All the data in the column will be lost.
  - You are about to drop the column `resolved_by` on the `reports` table. All the data in the column will be lost.
  - Added the required column `requester_core_user_id` to the `borrow_requests` table without a default value. This is not possible if the table is not empty.
  - Added the required column `owner_core_user_id` to the `listings` table without a default value. This is not possible if the table is not empty.
  - Added the required column `recipient_core_user_id` to the `notifications` table without a default value. This is not possible if the table is not empty.
  - Added the required column `reporter_core_user_id` to the `reports` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "ListingStatus_new" AS ENUM ('available', 'pending', 'borrowed', 'unavailable', 'archived');
ALTER TABLE "public"."listings" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "listings" ALTER COLUMN "status" TYPE "ListingStatus_new" USING ("status"::text::"ListingStatus_new");
ALTER TYPE "ListingStatus" RENAME TO "ListingStatus_old";
ALTER TYPE "ListingStatus_new" RENAME TO "ListingStatus";
DROP TYPE "public"."ListingStatus_old";
ALTER TABLE "listings" ALTER COLUMN "status" SET DEFAULT 'available';
COMMIT;

-- DropIndex
DROP INDEX "borrow_requests_requester_username_idx";

-- DropIndex
DROP INDEX "listings_owner_username_idx";

-- DropIndex
DROP INDEX "notifications_recipient_username_is_read_idx";

-- AlterTable
ALTER TABLE "borrow_requests" DROP COLUMN "requester_username",
ADD COLUMN     "requester_core_user_id" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "listings" DROP COLUMN "owner_username",
ADD COLUMN     "owner_core_user_id" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "notifications" DROP COLUMN "recipient_username",
ADD COLUMN     "recipient_core_user_id" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "reports" DROP COLUMN "reporter_username",
DROP COLUMN "resolved_by",
ADD COLUMN     "reporter_core_user_id" TEXT NOT NULL,
ADD COLUMN     "resolved_by_core_user_id" TEXT;

-- CreateIndex
CREATE INDEX "borrow_requests_requester_core_user_id_idx" ON "borrow_requests"("requester_core_user_id");

-- CreateIndex
CREATE INDEX "listings_owner_core_user_id_idx" ON "listings"("owner_core_user_id");

-- CreateIndex
CREATE INDEX "notifications_recipient_core_user_id_is_read_idx" ON "notifications"("recipient_core_user_id", "is_read");
