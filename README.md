# Google Sheets to GitHub Issues Sync

A tool for automatically syncing Google Sheets data to GitHub Issues.

## Features

- 📊 Read data from Google Sheets and create/update GitHub Issues
- 🔄 Support for single sync and continuous monitoring modes
- 🏷️ Automatic mapping of labels, assignees, and other fields
- 📝 Smart duplicate detection to avoid creating duplicate issues
- 🔍 Find existing issues by title

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Create a `.env` file (based on `.env.example`):

```bash
cp .env.example .env
```

Edit the `.env` file with your configuration:

```env
# GitHub Configuration
GITHUB_TOKEN=your_github_personal_access_token
GITHUB_OWNER=your_github_username_or_org
GITHUB_REPO=your_repo_name

# Google Sheets Configuration
GOOGLE_CREDENTIALS_PATH=./creditial/corded-axiom-469714-a0-7462020e4cab.json
SPREADSHEET_ID=1xsWvM39yYO0917zu1ntjV1citrazGnp6maZil42E4eI
SHEET_NAME=Sheet1

# Sync Configuration
SYNC_INTERVAL_MINUTES=5
SYNC_MODE=one-way

# Advanced Options (Optional)
SKIP_DELETED=false              # Set to true to not recreate deleted issues
RESPECT_GITHUB_CHANGES=false    # Set to true to not overwrite manual changes
```

### 3. Set Up Google Sheets Permissions

Ensure your Google service account email has access to the target Sheet:

1. Open your Google Sheet
2. Click the "Share" button in the top right
3. Add the service account email: `sheet-to-github@corded-axiom-469714-a0.iam.gserviceaccount.com`
4. Set permission to "Viewer"

### 4. Run the Program

```bash
# Test connections
npm run test

# View Sheet columns and field mappings
npm run dev headers

# Execute single sync
npm run sync

# Start continuous monitoring (syncs every 5 minutes)
npm run watch
```

## Field Mapping

Default field mapping relationships:

| Google Sheet Column | GitHub Issue Field | Description |
|--------------------|--------------------|-------------|
| Title | title | Issue title |
| Description | body | Issue description |
| Labels | labels | Labels (comma-separated) |
| Assignees | assignees | Assignees (comma-separated) |
| Status | state | Status (open/closed) |

### Custom Field Mapping

Edit `defaultFieldMappings` in `src/config/index.ts` to customize mapping relationships.

## Sheet Format Example

Your Google Sheet should contain the following columns:

| Title | Description | Labels | Assignees | Status |
|-------|------------|--------|-----------|--------|
| Bug: Login fails | Users cannot log into the system | bug,urgent | alice,bob | open |
| Feature: Export | Add data export functionality | enhancement | charlie | open |
| Fix styling issues | Homepage layout misaligned | bug,ui | | closed |

## Deployment Options

### Using GitHub Actions (Recommended)

Create `.github/workflows/sync.yml`:

```yaml
name: Sync Google Sheets to GitHub Issues

on:
  schedule:
    - cron: '*/15 * * * *'  # Run every 15 minutes
  workflow_dispatch:  # Allow manual trigger

jobs:
  sync:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          
      - run: npm ci
      
      - name: Sync Issues
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          GOOGLE_CREDENTIALS: ${{ secrets.GOOGLE_CREDENTIALS }}
          SPREADSHEET_ID: ${{ secrets.SPREADSHEET_ID }}
          GITHUB_OWNER: ${{ github.repository_owner }}
          GITHUB_REPO: ${{ github.event.repository.name }}
        run: |
          echo "$GOOGLE_CREDENTIALS" > credentials.json
          export GOOGLE_CREDENTIALS_PATH=./credentials.json
          npm run sync
```

### Using PM2 (Server Deployment)

```bash
# Install PM2
npm install -g pm2

# Start service
pm2 start npm --name "sheet-sync" -- run watch

# View logs
pm2 logs sheet-sync

# Stop service
pm2 stop sheet-sync
```

## Sync Behavior

See [SYNC_BEHAVIOR.md](docs/SYNC_BEHAVIOR.md) for detailed information about:
- How deleted issues are handled
- How modified issues are handled
- Configuration options for different workflows

## Troubleshooting

### 1. Google Sheets API Permission Errors

Ensure:
- Service account is created and Sheets API is enabled
- Service account email is added to Sheet's shared users
- Credentials file path is correct

### 2. GitHub API Rate Limiting

- Use Personal Access Token for higher API limits
- Adjust `SYNC_INTERVAL_MINUTES` to avoid frequent requests

### 3. Duplicate Issue Creation

The program will:
1. First check in-memory mapping relationships
2. Then search for existing issues by title
3. Only create new issues when not found

## Logging

Sync logs are saved to `sync.log` file and also output to console.

## License

MIT