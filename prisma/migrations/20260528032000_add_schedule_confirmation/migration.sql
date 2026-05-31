ALTER TABLE "Schedule" ADD COLUMN "status" TEXT NOT NULL DEFAULT 'open';
ALTER TABLE "Schedule" ADD COLUMN "confirmedSlot" TEXT;
