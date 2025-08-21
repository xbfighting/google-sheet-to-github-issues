import dotenv from 'dotenv';
import { SyncConfig, FieldMapping } from '../types';
import path from 'path';

dotenv.config();

const parseLabels = (value: string): string[] => {
  if (!value) return [];
  return value.split(',').map(label => label.trim()).filter(Boolean);
};

const parseAssignees = (value: string): string[] => {
  if (!value) return [];
  return value.split(',').map(assignee => assignee.trim()).filter(Boolean);
};

const defaultFieldMappings: FieldMapping[] = [
  { sheet: 'Feature / Issue', github: 'title' },
  { sheet: 'Notes', github: 'body' },
  { sheet: 'Category', github: 'labels', transform: (value: string) => value ? [value] : [] },
  { sheet: 'Launch Phase', github: 'labels', transform: (value: string) => value ? [`phase-${value}`] : [] },
  { sheet: 'Status', github: 'state', transform: (value: string) => value?.toLowerCase() === 'done' || value?.toLowerCase() === 'fixed' || value?.toLowerCase() === 'completed' ? 'closed' : 'open' }
];

export const config: SyncConfig = {
  spreadsheetId: process.env.SPREADSHEET_ID || '1xsWvM39yYO0917zu1ntjV1citrazGnp6maZil42E4eI',
  sheetName: process.env.SHEET_NAME || 'Sheet1',
  githubOwner: process.env.GITHUB_OWNER || '',
  githubRepo: process.env.GITHUB_REPO || '',
  fieldMappings: defaultFieldMappings,
  syncMode: (process.env.SYNC_MODE as 'one-way' | 'two-way') || 'one-way',
  syncIntervalMinutes: parseInt(process.env.SYNC_INTERVAL_MINUTES || '5', 10),
  skipDeleted: process.env.SKIP_DELETED === 'true',
  respectGitHubChanges: process.env.RESPECT_GITHUB_CHANGES === 'true',
  syncDirection: (process.env.SYNC_DIRECTION as 'sheet-to-github' | 'github-to-sheet' | 'bidirectional') || 'sheet-to-github'
};

export const googleCredentialsPath = path.resolve(
  process.env.GOOGLE_CREDENTIALS_PATH || './creditial/corded-axiom-469714-a0-7462020e4cab.json'
);

export const githubToken = process.env.GITHUB_TOKEN || '';

export function validateConfig(): void {
  const errors: string[] = [];

  if (!githubToken) {
    errors.push('GITHUB_TOKEN is required');
  }

  if (!config.githubOwner) {
    errors.push('GITHUB_OWNER is required');
  }

  if (!config.githubRepo) {
    errors.push('GITHUB_REPO is required');
  }

  if (errors.length > 0) {
    console.error('Configuration errors:');
    errors.forEach(error => console.error(`  - ${error}`));
    console.error('\nPlease create a .env file based on .env.example and fill in the required values.');
    process.exit(1);
  }
}
