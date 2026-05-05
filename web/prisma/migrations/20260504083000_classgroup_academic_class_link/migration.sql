-- AlterTable
ALTER TABLE "ClassGroup" ADD COLUMN "academicClassId" TEXT;

-- Backfill only the legacy halaqah rows that already map cleanly to one class.
WITH "SingleClassGroups" AS (
    SELECT
        "classGroupId",
        MIN("academicClassId") AS "academicClassId"
    FROM "Student"
    WHERE "academicClassId" IS NOT NULL
    GROUP BY "classGroupId"
    HAVING COUNT(DISTINCT "academicClassId") = 1
),
"UniqueAssignments" AS (
    SELECT scg."classGroupId", scg."academicClassId"
    FROM "SingleClassGroups" scg
    INNER JOIN (
        SELECT "academicClassId"
        FROM "SingleClassGroups"
        GROUP BY "academicClassId"
        HAVING COUNT(*) = 1
    ) unique_classes
        ON unique_classes."academicClassId" = scg."academicClassId"
)
UPDATE "ClassGroup" AS cg
SET "academicClassId" = source."academicClassId"
FROM "UniqueAssignments" AS source
WHERE cg."id" = source."classGroupId";

-- CreateIndex
CREATE UNIQUE INDEX "ClassGroup_academicClassId_key" ON "ClassGroup"("academicClassId");

-- AddForeignKey
ALTER TABLE "ClassGroup" ADD CONSTRAINT "ClassGroup_academicClassId_fkey" FOREIGN KEY ("academicClassId") REFERENCES "AcademicClass"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
