# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Development Commands
- `npm run dev <command>` - Run TypeScript files directly with tsx
- `npm run sync` - Execute single sync from Google Sheets to GitHub Issues
- `npm run watch` - Start continuous sync (runs every SYNC_INTERVAL_MINUTES)
- `npm run dev test` - Test Google Sheets and GitHub connections
- `npm run dev headers` - Display available Sheet columns and current field mappings
- `npm run build` - Compile TypeScript to JavaScript
- `npm run start` - Run compiled JavaScript

### Setup
1. Copy `.env.example` to `.env` and configure:
   - `GITHUB_TOKEN` - Personal Access Token with `repo` or `issues` permissions
   - `GITHUB_OWNER` and `GITHUB_REPO` - Target repository
   - `GOOGLE_CREDENTIALS_PATH` - Path to Google service account JSON (default: `./creditial/corded-axiom-469714-a0-7462020e4cab.json`)
   - `SPREADSHEET_ID` - Google Sheet ID from URL
   - `SHEET_NAME` - Specific sheet tab name
2. Ensure Google service account email has read access to the target Sheet

## Architecture

### Core Services
- **GoogleSheetsService** (`src/services/googleSheets.ts`) - Handles Google Sheets API authentication and data retrieval using service account credentials
- **GitHubService** (`src/services/github.ts`) - Manages GitHub Issues API operations (create, update, search) using Octokit
- **SyncService** (`src/services/sync.ts`) - Orchestrates the sync logic, maintains issue tracking, and handles field transformations

### Data Flow
1. SyncService reads rows from Google Sheet via GoogleSheetsService
2. Each row is transformed using field mappings defined in `src/config/index.ts`
3. Multiple label sources (Category, Launch Phase) are merged into a single labels array
4. Issues are created or updated via GitHubService, with duplicate detection by title
5. Issue tracker maintains row-to-issue-number mappings to prevent duplicates

### Field Mapping Configuration
Current mappings in `src/config/index.ts`:
- `Feature / Issue` → Issue title
- `Notes` → Issue body  
- `Category` → Labels (as-is)
- `Launch Phase` → Labels (prefixed with "phase-")
- `Status` → Issue state ("done"/"completed" → closed, else → open)

Mappings support custom transform functions for data conversion.

## Important Notes

### Credentials
- Google credentials are stored in `creditial/` directory (note the typo in directory name)
- The service account email (`sheet-to-github@corded-axiom-469714-a0.iam.gserviceaccount.com`) must be granted access to the target Sheet

### GitHub Token Permissions
If sync fails with "Resource not accessible by personal access token", ensure the token has:
- `repo` scope for private repositories
- `public_repo` and `issues` scopes for public repositories
- Write access to the target repository

### Sync Behavior
- Duplicate detection works by checking title matches first
- Labels from multiple sheet columns are merged (not replaced)
- Only rows with valid titles are processed (skips empty/untitled rows)
- Sync logs are written to both console and `sync.log` file