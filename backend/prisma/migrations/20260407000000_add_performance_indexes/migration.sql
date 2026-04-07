-- CreateIndex
CREATE INDEX "Client_tenantId_createdAt_idx" ON "Client"("tenantId", "createdAt");

-- CreateIndex
CREATE INDEX "TattooSession_tenantId_userId_idx" ON "TattooSession"("tenantId", "userId");

-- CreateIndex
CREATE INDEX "TattooSession_tenantId_date_idx" ON "TattooSession"("tenantId", "date");

-- CreateIndex
CREATE INDEX "TattooSession_userId_size_complexity_bodyLocation_idx" ON "TattooSession"("userId", "size", "complexity", "bodyLocation");

-- CreateIndex
CREATE INDEX "Transaction_tenantId_date_idx" ON "Transaction"("tenantId", "date");

-- CreateIndex
CREATE INDEX "Transaction_tenantId_type_idx" ON "Transaction"("tenantId", "type");

-- CreateIndex
CREATE INDEX "Transaction_tenantId_recurringExpenseId_idx" ON "Transaction"("tenantId", "recurringExpenseId");
