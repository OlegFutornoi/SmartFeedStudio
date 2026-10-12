#!/usr/bin/env bash
set -euo pipefail

# SmartFeed Studio — Cloudflare R2 / S3 CORS Automated Setup Script
# Configures CORS policies for admin-portal (:3000) and desktop client (:1420 / tauri://localhost)

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/../.." && pwd)"

echo "🚀 Starting automated R2 / S3 CORS deployment..."
cd "${ROOT_DIR}/services/backend-api"

node scripts/r2-cors-setup.mjs

echo "🎉 R2 CORS configuration completed successfully."
