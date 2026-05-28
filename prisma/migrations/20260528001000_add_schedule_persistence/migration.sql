-- Persist invite-based schedule sessions outside the Next.js process.
CREATE TABLE "Schedule" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "hostTokenHash" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "durationMinutes" INTEGER NOT NULL,
    "candidateDays" TEXT NOT NULL,
    "candidateStartHour" INTEGER NOT NULL,
    "candidateEndHour" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

CREATE TABLE "ScheduleParticipant" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "scheduleId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "available" TEXT NOT NULL,
    "submittedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ScheduleParticipant_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "Schedule" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "Schedule_hostTokenHash_key" ON "Schedule"("hostTokenHash");

CREATE INDEX "ScheduleParticipant_scheduleId_idx" ON "ScheduleParticipant"("scheduleId");
