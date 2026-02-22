-- AlterTable
ALTER TABLE "events" ADD COLUMN     "isFocusTime" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "user_settings" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "bufferMinutes" INTEGER NOT NULL DEFAULT 0,
    "workingHoursStart" TEXT NOT NULL DEFAULT '09:00',
    "workingHoursEnd" TEXT NOT NULL DEFAULT '17:00',
    "workingDays" TEXT NOT NULL DEFAULT '[1,2,3,4,5]',
    "secondaryTimezone" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scheduling_pages" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "durations" TEXT NOT NULL,
    "bufferMinutes" INTEGER NOT NULL DEFAULT 0,
    "daysInAdvance" INTEGER NOT NULL DEFAULT 14,
    "timezone" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "scheduling_pages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bookings" (
    "id" TEXT NOT NULL,
    "schedulingPageId" TEXT NOT NULL,
    "eventId" TEXT,
    "guestName" TEXT NOT NULL,
    "guestEmail" TEXT NOT NULL,
    "guestMessage" TEXT,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "duration" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'confirmed',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bookings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "scheduling_pages_slug_key" ON "scheduling_pages"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "bookings_eventId_key" ON "bookings"("eventId");

-- CreateIndex
CREATE INDEX "bookings_schedulingPageId_idx" ON "bookings"("schedulingPageId");

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_schedulingPageId_fkey" FOREIGN KEY ("schedulingPageId") REFERENCES "scheduling_pages"("id") ON DELETE CASCADE ON UPDATE CASCADE;
