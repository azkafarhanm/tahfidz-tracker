-- CreateTable
CREATE TABLE "ReleaseNote" (
    "id" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReleaseNote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserReleaseView" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "releaseNoteId" TEXT NOT NULL,
    "seenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserReleaseView_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ReleaseNote_version_key" ON "ReleaseNote"("version");
CREATE INDEX "ReleaseNote_isPublished_publishedAt_idx" ON "ReleaseNote"("isPublished", "publishedAt");
CREATE UNIQUE INDEX "UserReleaseView_userId_releaseNoteId_key" ON "UserReleaseView"("userId", "releaseNoteId");
CREATE INDEX "UserReleaseView_releaseNoteId_idx" ON "UserReleaseView"("releaseNoteId");

-- AddForeignKey
ALTER TABLE "UserReleaseView" ADD CONSTRAINT "UserReleaseView_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "UserReleaseView" ADD CONSTRAINT "UserReleaseView_releaseNoteId_fkey" FOREIGN KEY ("releaseNoteId") REFERENCES "ReleaseNote"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Seed the release that introduces in-app release notes. Future releases can be
-- inserted through a data migration until the Phase 2 Admin CRUD is available.
INSERT INTO "ReleaseNote" (
    "id", "version", "title", "summary", "content", "isPublished", "publishedAt", "createdAt", "updatedAt"
) VALUES (
    'release-note-v1-1-0',
    '1.1.0',
    'Release Notes kini tersedia di aplikasi',
    'Informasi pembaruan TahfidzFlow sekarang dapat dibaca langsung dari Dashboard.',
    E'• Modal What''s New tampil otomatis untuk release yang belum dibaca.\n• Release terbaru dapat dibuka kembali melalui link What''s New di Dashboard.\n• Panduan Guru tersedia dalam format HTML.',
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
);
