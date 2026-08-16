-- Additive audit actions for teacher-managed Tahsin record corrections.
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'UPDATE_TAHSIN';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'DELETE_TAHSIN';
