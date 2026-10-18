-- DB-11: Prevent indefinite table lock timeouts during schema deployment
SET lock_timeout = '2s';

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('SUPER_ADMIN', 'ADMIN', 'USER');

-- CreateEnum
CREATE TYPE "PlanType" AS ENUM ('STARTER', 'GROWTH', 'PRO', 'ENTERPRISE');

-- CreateEnum
CREATE TYPE "TargetApp" AS ENUM ('DESKTOP', 'ADMIN_PORTAL', 'ALL');

-- CreateEnum
CREATE TYPE "MemberRole" AS ENUM ('OWNER', 'ADMIN', 'MEMBER');

-- CreateEnum
CREATE TYPE "InvitationStatus" AS ENUM ('PENDING', 'ACCEPTED', 'DECLINED', 'EXPIRED', 'REVOKED');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'APPROVED', 'DECLINED', 'REFUNDED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "PaymentProvider" AS ENUM ('WAYFORPAY', 'STRIPE', 'MANUAL');

-- CreateEnum
CREATE TYPE "PaymentInterval" AS ENUM ('MONTHLY', 'YEARLY');

-- CreateEnum
CREATE TYPE "StorageFileCategory" AS ENUM ('PRODUCT_IMAGE', 'FEED_CATALOG', 'SYSTEM_BACKUP', 'EXPORT_ARCHIVE');

-- CreateEnum
CREATE TYPE "StorageFileStatus" AS ENUM ('PENDING_UPLOAD', 'ACTIVE', 'DELETED');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "full_name" TEXT,
    "avatar_url" TEXT,
    "role" "Role" NOT NULL DEFAULT 'USER',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organizations" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT,
    "owner_id" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "organizations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organization_members" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "role" "MemberRole" NOT NULL DEFAULT 'MEMBER',
    "joined_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "organization_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organization_invitations" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" "MemberRole" NOT NULL DEFAULT 'MEMBER',
    "token" TEXT NOT NULL,
    "status" "InvitationStatus" NOT NULL DEFAULT 'PENDING',
    "invited_by_id" TEXT NOT NULL,
    "expires_at" TIMESTAMPTZ(6) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "organization_invitations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tariff_plans" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name_uk" TEXT NOT NULL,
    "name_en" TEXT NOT NULL,
    "description_uk" TEXT,
    "description_en" TEXT,
    "price_monthly" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "price_yearly" DECIMAL(10,2),
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "max_xml_limit" INTEGER NOT NULL DEFAULT 500,
    "ai_credits" INTEGER NOT NULL DEFAULT 0,
    "can_cloud_backup" BOOLEAN NOT NULL DEFAULT false,
    "max_feeds_limit" INTEGER NOT NULL DEFAULT 1,
    "max_channels_limit" INTEGER NOT NULL DEFAULT 1,
    "sync_frequency_hours" INTEGER NOT NULL DEFAULT 0,
    "max_storage_gb" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "max_team_seats" INTEGER NOT NULL DEFAULT 1,
    "max_suppliers_limit" INTEGER NOT NULL DEFAULT 1,
    "has_api_access" BOOLEAN NOT NULL DEFAULT false,
    "has_webhooks" BOOLEAN NOT NULL DEFAULT false,
    "has_feed_diff" BOOLEAN NOT NULL DEFAULT false,
    "has_white_label" BOOLEAN NOT NULL DEFAULT false,
    "has_sso" BOOLEAN NOT NULL DEFAULT false,
    "has_audit_log" BOOLEAN NOT NULL DEFAULT false,
    "has_custom_s3" BOOLEAN NOT NULL DEFAULT false,
    "has_priority_ai" BOOLEAN NOT NULL DEFAULT false,
    "sla_uptime_percent" DOUBLE PRECISION,
    "is_popular" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "order" INTEGER NOT NULL DEFAULT 0,
    "duration_days" INTEGER DEFAULT 7,
    "features_uk" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "features_en" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "tariff_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "licenses" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "tariff_plan_id" TEXT,
    "license_key" TEXT NOT NULL,
    "plan_type" "PlanType" NOT NULL DEFAULT 'STARTER',
    "can_cloud_backup" BOOLEAN NOT NULL DEFAULT false,
    "max_xml_limit" INTEGER NOT NULL DEFAULT 500,
    "ai_credits" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "expires_at" TIMESTAMPTZ(6),
    "max_feeds_limit" INTEGER NOT NULL DEFAULT 1,
    "max_channels_limit" INTEGER NOT NULL DEFAULT 1,
    "max_team_seats" INTEGER NOT NULL DEFAULT 1,
    "max_suppliers_limit" INTEGER NOT NULL DEFAULT 1,
    "has_api_access" BOOLEAN NOT NULL DEFAULT false,
    "has_feed_diff" BOOLEAN NOT NULL DEFAULT false,
    "has_white_label" BOOLEAN NOT NULL DEFAULT false,
    "has_sso" BOOLEAN NOT NULL DEFAULT false,
    "has_audit_log" BOOLEAN NOT NULL DEFAULT false,
    "used_storage_bytes" BIGINT NOT NULL DEFAULT 0,
    "max_storage_gb" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "organization_id" TEXT,

    CONSTRAINT "licenses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "snapshots" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "snapshot_name" TEXT NOT NULL,
    "s3_key" TEXT NOT NULL,
    "size_bytes" BIGINT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "navigation_items" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "label_uk" TEXT NOT NULL,
    "label_en" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "icon" TEXT NOT NULL DEFAULT 'LayoutDashboard',
    "order" INTEGER NOT NULL DEFAULT 0,
    "is_visible" BOOLEAN NOT NULL DEFAULT true,
    "required_roles" "Role"[] DEFAULT ARRAY['USER', 'ADMIN', 'SUPER_ADMIN']::"Role"[],
    "required_plan" "PlanType",
    "target_app" "TargetApp" NOT NULL DEFAULT 'DESKTOP',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "navigation_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "page_guides" (
    "id" TEXT NOT NULL,
    "route" TEXT NOT NULL,
    "title_uk" TEXT NOT NULL,
    "title_en" TEXT NOT NULL,
    "icon" TEXT NOT NULL DEFAULT 'HelpCircle',
    "badge_uk" TEXT NOT NULL DEFAULT 'AI Асистент',
    "badge_en" TEXT NOT NULL DEFAULT 'AI Assistant',
    "summary_uk" TEXT NOT NULL,
    "summary_en" TEXT NOT NULL,
    "description_uk" TEXT NOT NULL,
    "description_en" TEXT NOT NULL,
    "features_uk" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "features_en" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "pro_tip_uk" TEXT,
    "pro_tip_en" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "target_app" "TargetApp" NOT NULL DEFAULT 'DESKTOP',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "page_guides_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_assistant_settings" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT 'SmartFeed AI Copilot',
    "avatar_url" TEXT,
    "role_uk" TEXT NOT NULL DEFAULT 'Персональний AI-асистент з товарних каталогів та фідів',
    "role_en" TEXT NOT NULL DEFAULT 'Personal AI Catalog & Feed Copilot',
    "badge_uk" TEXT NOT NULL DEFAULT 'AI Автопілот 24/7',
    "badge_en" TEXT NOT NULL DEFAULT '24/7 AI Autopilot',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "ai_assistant_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_transactions" (
    "id" TEXT NOT NULL,
    "order_reference" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "plan_code" TEXT NOT NULL,
    "billing_interval" "PaymentInterval" NOT NULL DEFAULT 'MONTHLY',
    "amount" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'UAH',
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "provider" "PaymentProvider" NOT NULL DEFAULT 'WAYFORPAY',
    "provider_payment_id" TEXT,
    "card_pan" TEXT,
    "card_type" TEXT,
    "issuer_bank" TEXT,
    "failure_reason" TEXT,
    "payment_method" TEXT,
    "signature" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "payment_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_settings" (
    "id" TEXT NOT NULL,
    "provider" "PaymentProvider" NOT NULL,
    "is_enabled" BOOLEAN NOT NULL DEFAULT true,
    "is_test_mode" BOOLEAN NOT NULL DEFAULT true,
    "merchant_account" TEXT,
    "merchant_secret_key" TEXT,
    "merchant_domain" TEXT,
    "service_url" TEXT,
    "return_url" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "payment_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "legal_documents" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title_uk" TEXT NOT NULL,
    "title_en" TEXT NOT NULL,
    "content_uk" TEXT NOT NULL,
    "content_en" TEXT NOT NULL,
    "is_published" BOOLEAN NOT NULL DEFAULT true,
    "version" TEXT NOT NULL DEFAULT '2.0',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "legal_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "storage_files" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "organization_id" TEXT,
    "category" "StorageFileCategory" NOT NULL,
    "status" "StorageFileStatus" NOT NULL DEFAULT 'PENDING_UPLOAD',
    "bucket_name" TEXT NOT NULL,
    "s3_key" TEXT NOT NULL,
    "public_url" TEXT NOT NULL,
    "original_name" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "size_bytes" BIGINT NOT NULL DEFAULT 0,
    "checksum_sha256" TEXT,
    "width" INTEGER,
    "height" INTEGER,
    "ref_count" INTEGER NOT NULL DEFAULT 1,
    "expires_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "storage_files_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "suppliers" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT,
    "user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "contact_phone" TEXT,
    "contact_email" TEXT,
    "website" TEXT,
    "notes" TEXT,
    "logo_url" TEXT,
    "legal_name" TEXT,
    "tax_id" TEXT,
    "industry" TEXT,
    "segment" TEXT,
    "manager_name" TEXT,
    "manager_position" TEXT,
    "manager_phone" TEXT,
    "manager_email" TEXT,
    "manager_telegram" TEXT,
    "country" TEXT,
    "city" TEXT,
    "address" TEXT,
    "postcode" TEXT,
    "base_currency" TEXT NOT NULL DEFAULT 'UAH',
    "target_currency" TEXT NOT NULL DEFAULT 'UAH',
    "exchange_rate_mode" TEXT NOT NULL DEFAULT 'MANUAL',
    "exchange_rate" DECIMAL(10,4) NOT NULL DEFAULT 1.0,
    "currency_buffer_percent" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "price_rounding" TEXT NOT NULL DEFAULT 'NONE',
    "default_margin_percent" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "default_fixed_markup" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "suppliers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "supplier_category_rules" (
    "id" TEXT NOT NULL,
    "supplier_id" TEXT NOT NULL,
    "feed_category_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "parent_id" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "margin_percent" DECIMAL(5,2),
    "fixed_markup" DECIMAL(10,2),
    "product_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "supplier_category_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "supplier_pricing_rules" (
    "id" TEXT NOT NULL,
    "supplier_id" TEXT NOT NULL,
    "category_id" TEXT,
    "category_name_uk" TEXT,
    "category_name_en" TEXT,
    "min_price" DECIMAL(10,2),
    "max_price" DECIMAL(10,2),
    "margin_percent" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "fixed_markup" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "supplier_pricing_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "supplier_sync_settings" (
    "id" TEXT NOT NULL,
    "supplier_id" TEXT NOT NULL,
    "protect_edited_products" BOOLEAN NOT NULL DEFAULT true,
    "sync_prices" BOOLEAN NOT NULL DEFAULT true,
    "sync_stocks" BOOLEAN NOT NULL DEFAULT true,
    "image_sync_mode" TEXT NOT NULL DEFAULT 'DO_NOT_UPDATE',
    "description_sync_mode" TEXT NOT NULL DEFAULT 'DO_NOT_UPDATE',
    "attributes_sync_mode" TEXT NOT NULL DEFAULT 'ADD_NEW_ONLY',
    "title_sync_mode" TEXT NOT NULL DEFAULT 'DO_NOT_UPDATE',
    "category_sync_mode" TEXT NOT NULL DEFAULT 'KEEP_MANUAL_MAPPING',
    "barcode_sync_mode" TEXT NOT NULL DEFAULT 'FILL_EMPTY_ONLY',
    "price_source" TEXT NOT NULL DEFAULT 'WHOLESALE',
    "zero_price_action" TEXT NOT NULL DEFAULT 'OUT_OF_STOCK',
    "missing_products_action" TEXT NOT NULL DEFAULT 'OUT_OF_STOCK',
    "new_products_action" TEXT NOT NULL DEFAULT 'AUTO_PUBLISH',
    "sync_interval_hours" INTEGER NOT NULL DEFAULT 0,
    "last_synced_at" TIMESTAMPTZ(6),
    "last_sync_status" TEXT NOT NULL DEFAULT 'IDLE',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "supplier_sync_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "supplier_sync_logs" (
    "id" TEXT NOT NULL,
    "supplier_id" TEXT NOT NULL,
    "feed_source_id" TEXT,
    "trigger" TEXT NOT NULL DEFAULT 'MANUAL',
    "status" TEXT NOT NULL DEFAULT 'RUNNING',
    "started_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMPTZ(6),
    "duration_ms" INTEGER,
    "total_products" INTEGER NOT NULL DEFAULT 0,
    "created_count" INTEGER NOT NULL DEFAULT 0,
    "updated_count" INTEGER NOT NULL DEFAULT 0,
    "out_of_stock_count" INTEGER NOT NULL DEFAULT 0,
    "errors_count" INTEGER NOT NULL DEFAULT 0,
    "error_message" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "supplier_sync_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bank_currency_providers" (
    "id" TEXT NOT NULL,
    "bank_id" TEXT NOT NULL,
    "bank_name" TEXT NOT NULL,
    "badge" TEXT NOT NULL,
    "is_enabled" BOOLEAN NOT NULL DEFAULT true,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "source_type" TEXT NOT NULL DEFAULT 'API_DIRECT',
    "sell_spread_percent" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "buy_spread_percent" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "logo_url" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "bank_currency_providers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_role_idx" ON "users"("role");

-- CreateIndex
CREATE INDEX "users_role_is_active_idx" ON "users"("role", "is_active");

-- CreateIndex
CREATE INDEX "users_created_at_idx" ON "users"("created_at");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users" USING GIN ("email" gin_trgm_ops);

-- CreateIndex
CREATE INDEX "users_full_name_idx" ON "users" USING GIN ("full_name" gin_trgm_ops);

-- CreateIndex
CREATE UNIQUE INDEX "organizations_slug_key" ON "organizations"("slug");

-- CreateIndex
CREATE INDEX "organizations_owner_id_idx" ON "organizations"("owner_id");

-- CreateIndex
CREATE INDEX "organizations_created_at_idx" ON "organizations"("created_at");

-- CreateIndex
CREATE INDEX "organization_members_organization_id_idx" ON "organization_members"("organization_id");

-- CreateIndex
CREATE INDEX "organization_members_user_id_idx" ON "organization_members"("user_id");

-- CreateIndex
CREATE INDEX "organization_members_joined_at_idx" ON "organization_members"("joined_at");

-- CreateIndex
CREATE UNIQUE INDEX "organization_members_organization_id_user_id_key" ON "organization_members"("organization_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "organization_invitations_token_key" ON "organization_invitations"("token");

-- CreateIndex
CREATE INDEX "organization_invitations_organization_id_idx" ON "organization_invitations"("organization_id");

-- CreateIndex
CREATE INDEX "organization_invitations_invited_by_id_idx" ON "organization_invitations"("invited_by_id");

-- CreateIndex
CREATE INDEX "organization_invitations_email_idx" ON "organization_invitations"("email");

-- CreateIndex
CREATE INDEX "organization_invitations_status_idx" ON "organization_invitations"("status");

-- CreateIndex
CREATE INDEX "organization_invitations_expires_at_idx" ON "organization_invitations"("expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "tariff_plans_code_key" ON "tariff_plans"("code");

-- CreateIndex
CREATE INDEX "tariff_plans_is_active_order_idx" ON "tariff_plans"("is_active", "order");

-- CreateIndex
CREATE INDEX "tariff_plans_created_at_idx" ON "tariff_plans"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "licenses_license_key_key" ON "licenses"("license_key");

-- CreateIndex
CREATE INDEX "licenses_user_id_idx" ON "licenses"("user_id");

-- CreateIndex
CREATE INDEX "licenses_user_id_is_active_idx" ON "licenses"("user_id", "is_active");

-- CreateIndex
CREATE INDEX "licenses_tariff_plan_id_idx" ON "licenses"("tariff_plan_id");

-- CreateIndex
CREATE INDEX "licenses_organization_id_idx" ON "licenses"("organization_id");

-- CreateIndex
CREATE INDEX "licenses_is_active_idx" ON "licenses"("is_active");

-- CreateIndex
CREATE INDEX "licenses_created_at_idx" ON "licenses"("created_at");

-- CreateIndex
CREATE INDEX "licenses_license_key_idx" ON "licenses" USING GIN ("license_key" gin_trgm_ops);

-- CreateIndex
CREATE INDEX "snapshots_user_id_idx" ON "snapshots"("user_id");

-- CreateIndex
CREATE INDEX "snapshots_created_at_idx" ON "snapshots"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "navigation_items_key_key" ON "navigation_items"("key");

-- CreateIndex
CREATE INDEX "navigation_items_target_app_is_visible_order_idx" ON "navigation_items"("target_app", "is_visible", "order");

-- CreateIndex
CREATE UNIQUE INDEX "page_guides_route_key" ON "page_guides"("route");

-- CreateIndex
CREATE INDEX "page_guides_target_app_order_idx" ON "page_guides"("target_app", "order");

-- CreateIndex
CREATE UNIQUE INDEX "payment_transactions_order_reference_key" ON "payment_transactions"("order_reference");

-- CreateIndex
CREATE INDEX "payment_transactions_user_id_idx" ON "payment_transactions"("user_id");

-- CreateIndex
CREATE INDEX "payment_transactions_status_idx" ON "payment_transactions"("status");

-- CreateIndex
CREATE INDEX "payment_transactions_provider_idx" ON "payment_transactions"("provider");

-- CreateIndex
CREATE INDEX "payment_transactions_created_at_idx" ON "payment_transactions"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "payment_settings_provider_key" ON "payment_settings"("provider");

-- CreateIndex
CREATE UNIQUE INDEX "legal_documents_slug_key" ON "legal_documents"("slug");

-- CreateIndex
CREATE INDEX "legal_documents_slug_is_published_idx" ON "legal_documents"("slug", "is_published");

-- CreateIndex
CREATE INDEX "legal_documents_created_at_idx" ON "legal_documents"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "storage_files_s3_key_key" ON "storage_files"("s3_key");

-- CreateIndex
CREATE INDEX "storage_files_user_id_idx" ON "storage_files"("user_id");

-- CreateIndex
CREATE INDEX "storage_files_user_id_status_idx" ON "storage_files"("user_id", "status");

-- CreateIndex
CREATE INDEX "storage_files_organization_id_idx" ON "storage_files"("organization_id");

-- CreateIndex
CREATE INDEX "storage_files_organization_id_status_idx" ON "storage_files"("organization_id", "status");

-- CreateIndex
CREATE INDEX "storage_files_category_status_idx" ON "storage_files"("category", "status");

-- CreateIndex
CREATE INDEX "storage_files_checksum_sha256_idx" ON "storage_files"("checksum_sha256");

-- CreateIndex
CREATE INDEX "storage_files_status_expires_at_idx" ON "storage_files"("status", "expires_at");

-- CreateIndex
CREATE INDEX "storage_files_created_at_idx" ON "storage_files"("created_at");

-- CreateIndex
CREATE INDEX "suppliers_organization_id_idx" ON "suppliers"("organization_id");

-- CreateIndex
CREATE INDEX "suppliers_user_id_idx" ON "suppliers"("user_id");

-- CreateIndex
CREATE INDEX "suppliers_is_active_idx" ON "suppliers"("is_active");

-- CreateIndex
CREATE INDEX "suppliers_created_at_idx" ON "suppliers"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "suppliers_user_id_code_key" ON "suppliers"("user_id", "code");

-- CreateIndex
CREATE INDEX "supplier_category_rules_supplier_id_idx" ON "supplier_category_rules"("supplier_id");

-- CreateIndex
CREATE INDEX "supplier_category_rules_supplier_id_is_active_idx" ON "supplier_category_rules"("supplier_id", "is_active");

-- CreateIndex
CREATE UNIQUE INDEX "supplier_category_rules_supplier_id_feed_category_id_key" ON "supplier_category_rules"("supplier_id", "feed_category_id");

-- CreateIndex
CREATE INDEX "supplier_pricing_rules_supplier_id_idx" ON "supplier_pricing_rules"("supplier_id");

-- CreateIndex
CREATE INDEX "supplier_pricing_rules_supplier_id_is_active_priority_idx" ON "supplier_pricing_rules"("supplier_id", "is_active", "priority");

-- CreateIndex
CREATE UNIQUE INDEX "supplier_sync_settings_supplier_id_key" ON "supplier_sync_settings"("supplier_id");

-- CreateIndex
CREATE INDEX "supplier_sync_settings_supplier_id_idx" ON "supplier_sync_settings"("supplier_id");

-- CreateIndex
CREATE INDEX "supplier_sync_logs_supplier_id_idx" ON "supplier_sync_logs"("supplier_id");

-- CreateIndex
CREATE INDEX "supplier_sync_logs_supplier_id_created_at_idx" ON "supplier_sync_logs"("supplier_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "bank_currency_providers_bank_id_key" ON "bank_currency_providers"("bank_id");

-- CreateIndex
CREATE INDEX "bank_currency_providers_is_enabled_idx" ON "bank_currency_providers"("is_enabled");

-- AddForeignKey
ALTER TABLE "organizations" ADD CONSTRAINT "organizations_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organization_members" ADD CONSTRAINT "organization_members_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organization_members" ADD CONSTRAINT "organization_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organization_invitations" ADD CONSTRAINT "organization_invitations_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organization_invitations" ADD CONSTRAINT "organization_invitations_invited_by_id_fkey" FOREIGN KEY ("invited_by_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "licenses" ADD CONSTRAINT "licenses_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "licenses" ADD CONSTRAINT "licenses_tariff_plan_id_fkey" FOREIGN KEY ("tariff_plan_id") REFERENCES "tariff_plans"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "licenses" ADD CONSTRAINT "licenses_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "snapshots" ADD CONSTRAINT "snapshots_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_transactions" ADD CONSTRAINT "payment_transactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "storage_files" ADD CONSTRAINT "storage_files_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "storage_files" ADD CONSTRAINT "storage_files_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "suppliers" ADD CONSTRAINT "suppliers_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "suppliers" ADD CONSTRAINT "suppliers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supplier_category_rules" ADD CONSTRAINT "supplier_category_rules_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "suppliers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supplier_pricing_rules" ADD CONSTRAINT "supplier_pricing_rules_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "suppliers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supplier_sync_settings" ADD CONSTRAINT "supplier_sync_settings_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "suppliers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supplier_sync_logs" ADD CONSTRAINT "supplier_sync_logs_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "suppliers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

