-- Add trigram indexes for case-insensitive search predicates used by list pages.
-- Prisma `startsWith` with `mode: "insensitive"` is emitted as case-insensitive
-- pattern matching on PostgreSQL, where plain btree indexes are often not used.
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS "Student_fullName_trgm_idx"
  ON "Student" USING gin ("fullName" gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "Teacher_fullName_trgm_idx"
  ON "Teacher" USING gin ("fullName" gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "User_email_trgm_idx"
  ON "User" USING gin ("email" gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "ClassGroup_name_trgm_idx"
  ON "ClassGroup" USING gin ("name" gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "AcademicClass_name_trgm_idx"
  ON "AcademicClass" USING gin ("name" gin_trgm_ops);
