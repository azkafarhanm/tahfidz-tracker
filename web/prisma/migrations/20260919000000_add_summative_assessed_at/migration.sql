-- Adds an explicit assessment date to summative scores.
--
-- Until now the list page showed `createdAt` as the assessment date, which was
-- seeded from the date/time the teacher picks in the form but never refreshed
-- when an existing score was edited. Splitting the two lets `assessedAt` carry
-- the teacher's chosen date while `createdAt` stays a truthful row birth time.
ALTER TABLE "SummativeScore"
  ADD COLUMN "assessedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Existing rows already stored the picked date in createdAt.
UPDATE "SummativeScore" SET "assessedAt" = "createdAt";
