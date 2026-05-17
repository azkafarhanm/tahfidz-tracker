-- Add composite indexes for dashboard, reports, and student list hot paths.
CREATE INDEX "ClassGroup_teacherId_isActive_grade_level_idx" ON "ClassGroup"("teacherId", "isActive", "grade", "level");

CREATE INDEX "Student_teacherId_isActive_fullName_idx" ON "Student"("teacherId", "isActive", "fullName");

CREATE INDEX "MemorizationRecord_teacherId_studentId_date_idx" ON "MemorizationRecord"("teacherId", "studentId", "date");
CREATE INDEX "MemorizationRecord_studentId_status_date_idx" ON "MemorizationRecord"("studentId", "status", "date");

CREATE INDEX "RevisionRecord_teacherId_studentId_date_idx" ON "RevisionRecord"("teacherId", "studentId", "date");
CREATE INDEX "RevisionRecord_studentId_status_date_idx" ON "RevisionRecord"("studentId", "status", "date");

CREATE INDEX "Target_teacherId_status_endDate_idx" ON "Target"("teacherId", "status", "endDate");
