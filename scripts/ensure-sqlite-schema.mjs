import { PrismaClient } from "@prisma/client";

if (process.env.NODE_ENV !== "production") {
  process.env.DATABASE_URL ||= "file:./dev.db";
}

const prisma = new PrismaClient();

try {
  await prisma.$executeRawUnsafe(`
  CREATE TABLE IF NOT EXISTS "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT,
    "phoneNumber" TEXT,
    "nickname" TEXT NOT NULL,
    "passwordHash" TEXT,
    "isAgeOver14" BOOLEAN,
    "termsAgreedAt" DATETIME,
    "privacyAgreedAt" DATETIME,
    "marketingAgreed" BOOLEAN NOT NULL DEFAULT false,
    "eventSmsAgreed" BOOLEAN NOT NULL DEFAULT false,
    "profileCompleted" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
  )
`);

  await prisma.$executeRawUnsafe(`
  CREATE TABLE IF NOT EXISTS "SocialAccount" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerUserId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "SocialAccount_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
  )
`);

  await prisma.$executeRawUnsafe(`
  CREATE TABLE IF NOT EXISTS "Schedule" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "hostTokenHash" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "durationMinutes" INTEGER NOT NULL,
    "candidateDays" TEXT NOT NULL,
    "candidateStartHour" INTEGER NOT NULL,
    "candidateEndHour" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'open',
    "confirmedSlot" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
  )
`);

  await prisma.$executeRawUnsafe(`
  CREATE TABLE IF NOT EXISTS "ScheduleParticipant" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "scheduleId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "available" TEXT NOT NULL,
    "submittedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ScheduleParticipant_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "Schedule" ("id") ON DELETE CASCADE ON UPDATE CASCADE
  )
`);

  await prisma.$executeRawUnsafe(
    `CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON "User"("email")`,
  );
  await prisma.$executeRawUnsafe(
    `CREATE UNIQUE INDEX IF NOT EXISTS "User_phoneNumber_key" ON "User"("phoneNumber")`,
  );
  await prisma.$executeRawUnsafe(
    `CREATE UNIQUE INDEX IF NOT EXISTS "User_nickname_key" ON "User"("nickname")`,
  );
  await prisma.$executeRawUnsafe(
    `CREATE UNIQUE INDEX IF NOT EXISTS "SocialAccount_provider_providerUserId_key" ON "SocialAccount"("provider", "providerUserId")`,
  );
  await prisma.$executeRawUnsafe(
    `CREATE UNIQUE INDEX IF NOT EXISTS "Schedule_hostTokenHash_key" ON "Schedule"("hostTokenHash")`,
  );
  await prisma.$executeRawUnsafe(
    `CREATE INDEX IF NOT EXISTS "ScheduleParticipant_scheduleId_idx" ON "ScheduleParticipant"("scheduleId")`,
  );

  const scheduleColumns = await prisma.$queryRawUnsafe(
    `PRAGMA table_info("Schedule")`,
  );
  const scheduleColumnNames = new Set(
    scheduleColumns.map((column) => column.name),
  );

  if (!scheduleColumnNames.has("status")) {
    await prisma.$executeRawUnsafe(
      `ALTER TABLE "Schedule" ADD COLUMN "status" TEXT NOT NULL DEFAULT 'open'`,
    );
  }

  if (!scheduleColumnNames.has("confirmedSlot")) {
    await prisma.$executeRawUnsafe(
      `ALTER TABLE "Schedule" ADD COLUMN "confirmedSlot" TEXT`,
    );
  }
} finally {
  await prisma.$disconnect();
}
