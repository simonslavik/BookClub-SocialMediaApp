#!/usr/bin/env node

/**
 * Environment validation script for React frontend
 * Checks that all required environment variables are set before starting
 */

// Load environment variables from .env file
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const envPath = join(__dirname, '.env');
if (existsSync(envPath)) {
  const envContent = readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=');
      if (key && valueParts.length > 0) {
        const value = valueParts.join('=').replace(/^["']|["']$/g, '');
        process.env[key] = value;
      }
    }
  });
}

const requiredVars = {
  'VITE_GOOGLE_CLIENT_ID': process.env.VITE_GOOGLE_CLIENT_ID
};

const missing = [];
const warnings = [];

console.log('🔍 Validating React environment variables...\n');

// Check for missing required variables
for (const [key, value] of Object.entries(requiredVars)) {
  if (!value || value.trim() === '') {
    missing.push(key);
  }
}

// Check for placeholder values
if (process.env.VITE_GOOGLE_CLIENT_ID?.includes('your-google-client-id')) {
  warnings.push('VITE_GOOGLE_CLIENT_ID is using placeholder - update with real Google OAuth Client ID');
}

// Log warnings
if (warnings.length > 0) {
  console.log('⚠️  Environment Configuration Warnings:');
  warnings.forEach(warning => console.log(`   - ${warning}`));
  console.log('');
}

// Exit with error if critical variables are missing
if (missing.length > 0) {
  console.error('❌ Missing required environment variables:');
  missing.forEach(v => console.error(`   - ${v}`));
  console.error('\n💡 Please check your .env file and ensure all required variables are set.');
  console.error('   See .env.example for reference.\n');
  process.exit(1);
}

// Success message
console.log('✅ All required environment variables are set');
console.log('📋 Configuration Summary:');
console.log(`   - Google OAuth: ${process.env.VITE_GOOGLE_CLIENT_ID ? 'Enabled ✓' : 'Not configured'}`);
console.log('');
