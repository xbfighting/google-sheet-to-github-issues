export interface SheetRow {
  id?: string;
  title: string;
  description?: string;
  status?: string;
  priority?: string;
  assignee?: string;
  labels?: string;
  createdAt?: string;
  updatedAt?: string;
  githubIssueNumber?: string;
  [key: string]: string | undefined;
}

export interface GitHubIssue {
  number?: number;
  title: string;
  body?: string;
  labels?: string[];
  assignees?: string[];
  state?: 'open' | 'closed';
  milestone?: number;
}

export interface FieldMapping {
  sheet: string;
  github: keyof GitHubIssue;
  transform?: (value: string) => any;
}

export interface SyncConfig {
  spreadsheetId: string;
  sheetName: string;
  githubOwner: string;
  githubRepo: string;
  fieldMappings: FieldMapping[];
  syncMode: 'one-way' | 'two-way';
  syncIntervalMinutes?: number;
  skipDeleted?: boolean; // Skip recreating deleted issues
  respectGitHubChanges?: boolean; // Don't overwrite manual changes
  syncDirection?: 'sheet-to-github' | 'github-to-sheet' | 'bidirectional';
}