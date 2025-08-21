#!/usr/bin/env node

import { config, validateConfig } from './config';
import { SyncService } from './services/sync';
import { GoogleSheetsService } from './services/googleSheets';
import { StorageService } from './services/storage';

async function main() {
  console.log('🚀 Google Sheets to GitHub Issues Sync Tool');
  console.log('===========================================\n');

  validateConfig();

  const command = process.argv[2];

  switch (command) {
    case 'sync':
      await runSingleSync();
      break;
    case 'watch':
      await runContinuousSync();
      break;
    case 'test':
      await testConnection();
      break;
    case 'headers':
      await showHeaders();
      break;
    case 'reset':
      await resetMappings();
      break;
    default:
      showHelp();
  }
}

async function runSingleSync() {
  console.log('Running single sync...\n');
  const syncService = new SyncService(config);
  await syncService.syncOnce();
  console.log('\n✅ Sync completed!');
}

async function runContinuousSync() {
  console.log(`Starting continuous sync (every ${config.syncIntervalMinutes} minutes)...\n`);
  console.log('Press Ctrl+C to stop\n');
  const syncService = new SyncService(config);
  await syncService.syncContinuously();
}

async function testConnection() {
  console.log('Testing connections...\n');
  
  try {
    console.log('📊 Testing Google Sheets connection...');
    const googleSheets = new GoogleSheetsService();
    const headers = await googleSheets.getSheetHeaders(config.spreadsheetId, config.sheetName);
    console.log(`✅ Connected to Google Sheets! Found ${headers.length} columns: ${headers.join(', ')}`);
  } catch (error) {
    console.error('❌ Google Sheets connection failed:', error);
  }

  console.log('\n📦 Testing GitHub connection...');
  console.log(`Repository: ${config.githubOwner}/${config.githubRepo}`);
  console.log('✅ GitHub configuration loaded (connection will be tested on first sync)');
}

async function showHeaders() {
  console.log('Fetching sheet headers...\n');
  
  try {
    const googleSheets = new GoogleSheetsService();
    const headers = await googleSheets.getSheetHeaders(config.spreadsheetId, config.sheetName);
    
    console.log('Available columns in your Google Sheet:');
    console.log('=======================================');
    headers.forEach((header, index) => {
      console.log(`  ${index + 1}. ${header}`);
    });
    
    console.log('\nCurrent field mappings:');
    console.log('======================');
    config.fieldMappings.forEach(mapping => {
      console.log(`  Sheet "${mapping.sheet}" → GitHub "${mapping.github}"`);
    });
    
    console.log('\nTo customize mappings, edit the fieldMappings in src/config/index.ts');
  } catch (error) {
    console.error('Error fetching headers:', error);
  }
}

async function resetMappings() {
  console.log('Resetting issue mappings...\n');
  const storage = new StorageService();
  storage.clear();
  console.log('✅ Issue mappings have been reset!');
  console.log('Next sync will treat all rows as new.');
}

function showHelp() {
  console.log('Usage: npm run <command>\n');
  console.log('Commands:');
  console.log('  sync      - Run a single sync from Google Sheets to GitHub');
  console.log('  watch     - Start continuous sync with automatic updates');
  console.log('  test      - Test connections to Google Sheets and GitHub');
  console.log('  headers   - Show available columns in your Google Sheet');
  console.log('  reset     - Reset issue mappings (use when issues are out of sync)');
  console.log('\nExamples:');
  console.log('  npm run sync');
  console.log('  npm run watch');
  console.log('  npm run test');
  console.log('  npm run dev reset');
}

main().catch(error => {
  console.error('\n❌ Fatal error:', error);
  process.exit(1);
});