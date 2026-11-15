-- CreateEnum
CREATE TYPE "RegistrationStatus" AS ENUM ('active', 'canceled');

-- AlterTable
ALTER TABLE "Event" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "registrations" (
    "id" TEXT NOT NULL,
    "event_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "status" "RegistrationStatus" NOT NULL DEFAULT 'active',
    "registered_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "canceled_at" TIMESTAMP(3),
    "canceled_by" TEXT,

    CONSTRAINT "registrations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "registrations_event_id_status_idx" ON "registrations"("event_id", "status");

-- CreateIndex
CREATE INDEX "registrations_user_id_status_idx" ON "registrations"("user_id", "status");

-- Unique index for active registrations per event and user
CREATE UNIQUE INDEX registrations_event_user_active_uq ON registrations (event_id, user_id) WHERE status = 'active';

-- AddForeignKey
ALTER TABLE "registrations" ADD CONSTRAINT "registrations_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "registrations" ADD CONSTRAINT "registrations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "registrations" ADD CONSTRAINT "registrations_canceled_by_fkey" FOREIGN KEY ("canceled_by") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
