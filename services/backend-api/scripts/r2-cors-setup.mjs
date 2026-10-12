import { S3Client, PutBucketCorsCommand, GetBucketCorsCommand } from '@aws-sdk/client-s3';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env
const rootEnvPath = path.resolve(__dirname, '../../../.env');
const backendEnvPath = path.resolve(__dirname, '../.env');

if (fs.existsSync(rootEnvPath)) dotenv.config({ path: rootEnvPath });
if (fs.existsSync(backendEnvPath)) dotenv.config({ path: backendEnvPath });

const endpoint = process.env.S3_ENDPOINT || 'http://localhost:9000';
const region = process.env.S3_REGION || 'auto';
const accessKeyId = process.env.S3_ACCESS_KEY_ID || 'minioadmin';
const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY || 'minioadminpassword';
const bucketName = process.env.S3_BUCKET_NAME || 'smartfeed-storage';
const isMinio = endpoint.includes('localhost') || endpoint.includes('127.0.0.1');
const forcePathStyle =
  process.env.S3_FORCE_PATH_STYLE !== undefined
    ? process.env.S3_FORCE_PATH_STYLE === 'true'
    : isMinio;

console.log(`[R2 CORS Setup] Connecting to endpoint: ${endpoint}`);
console.log(`[R2 CORS Setup] Bucket: ${bucketName}, Region: ${region}, PathStyle: ${forcePathStyle}`);

const s3Client = new S3Client({
  endpoint,
  region,
  credentials: {
    accessKeyId,
    secretAccessKey,
  },
  forcePathStyle,
});

const corsConfiguration = {
  CORSRules: [
    {
      AllowedOrigins: [
        'http://localhost:3000',
        'http://localhost:1420',
        'https://admin.smartfeed.studio',
        'tauri://localhost',
        'https://tauri.localhost',
      ],
      AllowedMethods: ['GET', 'PUT', 'HEAD', 'DELETE'],
      AllowedHeaders: ['*'],
      ExposeHeaders: ['ETag', 'Content-Length', 'Content-Type'],
      MaxAgeSeconds: 3600,
    },
  ],
};

async function applyCors() {
  try {
    console.log('[R2 CORS Setup] Sending PutBucketCorsCommand...');
    await s3Client.send(
      new PutBucketCorsCommand({
        Bucket: bucketName,
        CORSConfiguration: corsConfiguration,
      }),
    );
    console.log('✅ CORS configuration successfully applied to bucket:', bucketName);

    try {
      const currentCors = await s3Client.send(
        new GetBucketCorsCommand({
          Bucket: bucketName,
        }),
      );
      console.log('📋 Verified active CORS rules:', JSON.stringify(currentCors.CORSRules, null, 2));
    } catch {
      console.log('ℹ️ Note: GetBucketCorsCommand not supported or restricted, but Put succeeded.');
    }
  } catch (err) {
    console.error('❌ Failed to configure CORS on bucket:', err.message);
    process.exit(1);
  }
}

applyCors();
