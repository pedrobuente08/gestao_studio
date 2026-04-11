-- Tabela de whitelist para controle de acesso no beta
CREATE TABLE "Whitelist" (
    "id"        TEXT NOT NULL,
    "email"     TEXT NOT NULL,
    "note"      TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Whitelist_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Whitelist_email_key" ON "Whitelist"("email");

-- Campos de assinatura no Tenant
ALTER TABLE "Tenant"
    ADD COLUMN "subscriptionStatus" TEXT NOT NULL DEFAULT 'beta',
    ADD COLUMN "currentPeriodEnd"   TIMESTAMP(3),
    ADD COLUMN "stripeCustomerId"   TEXT;
CREATE UNIQUE INDEX "Tenant_stripeCustomerId_key" ON "Tenant"("stripeCustomerId");
