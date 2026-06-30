-- CreateIndex
CREATE INDEX "candidates_createdAt_idx" ON "candidates"("createdAt");

-- CreateIndex
CREATE INDEX "job_matches_status_idx" ON "job_matches"("status");

-- CreateIndex
CREATE INDEX "job_matches_candidateId_idx" ON "job_matches"("candidateId");

-- CreateIndex
CREATE INDEX "stored_files_bucket_idx" ON "stored_files"("bucket");

-- CreateIndex
CREATE INDEX "stored_files_status_idx" ON "stored_files"("status");

-- CreateIndex
CREATE INDEX "stored_files_candidateId_idx" ON "stored_files"("candidateId");
