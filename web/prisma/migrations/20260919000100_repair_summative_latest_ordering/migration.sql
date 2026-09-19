-- Repairs "Penilaian terakhir" for scores saved before the ordering fix.
--
-- The bulk form used to rewrite every surah on every save, stamping updatedAt in
-- form order, so the last surah in the target list always looked like the most
-- recent entry for every student. Once saves stop touching unchanged rows, that
-- bad ordering can no longer heal on its own, so it is rebuilt here.
--
-- The real input order of historical saves was never recorded and cannot be
-- recovered. This rebuilds updatedAt from the teacher's assessment date and
-- breaks same-session ties by surah number, so the latest surah in mushaf order
-- wins. That is a deterministic approximation, not the original sequence.
WITH ordered AS (
  SELECT
    score.id,
    ROW_NUMBER() OVER (
      PARTITION BY
        score."studentId",
        score."semester",
        score."academicYear",
        score."assessedAt"
      ORDER BY surah."number" ASC
    ) - 1 AS position
  FROM "SummativeScore" score
  JOIN "Surah" surah ON surah.id = score."surahId"
)
UPDATE "SummativeScore" score
SET "updatedAt" = score."assessedAt" + (ordered.position * INTERVAL '1 millisecond')
FROM ordered
WHERE ordered.id = score.id;
