# GitHub Actions Setup Guide

## Required Secrets

You need to configure the following secrets in your GitHub repository:

### 1. GH_TOKEN (GitHub Personal Access Token)

1. Go to https://github.com/settings/tokens/new
2. Create a new token with these permissions:
   - `repo` (full control of private repositories)
   - `workflow` (update GitHub Action workflows)
3. Copy the token
4. Go to your repository settings: https://github.com/xbfighting/google-sheet-to-github-issues/settings/secrets/actions
5. Click "New repository secret"
6. Name: `GH_TOKEN`
7. Value: Paste your token

### 2. GOOGLE_CREDENTIALS (Google Service Account JSON)

1. Get your Google service account JSON from `creditial/corded-axiom-469714-a0-7462020e4cab.json`
2. Copy the entire JSON content
3. Go to your repository secrets
4. Click "New repository secret"
5. Name: `GOOGLE_CREDENTIALS`
6. Value: Paste the entire JSON content

## Workflows

### Automatic Sync (`sync.yml`)
- Runs every 30 minutes automatically
- Syncs from Google Sheets to GitHub Issues
- Can be manually triggered from Actions tab

### Manual Sync (`manual-sync.yml`)
- Manually triggered with options:
  - Choose sync mode: sync, test, or headers
  - Specify sheet name
  - Set sync interval

## How to Use

### Test the Setup
1. Go to Actions tab in your repository
2. Select "Manual Sync" workflow
3. Click "Run workflow"
4. Choose mode: `test`
5. Click "Run workflow" button
6. Check the logs to verify connections

### Run Manual Sync
1. Go to Actions tab
2. Select "Manual Sync" workflow
3. Click "Run workflow"
4. Choose mode: `sync`
5. Optionally change sheet name
6. Click "Run workflow" button

### View Sync Logs
1. Go to Actions tab
2. Click on any workflow run
3. Download artifacts to get `sync.log` file

## Monitoring

- Check Actions tab for workflow status
- Failed syncs will show ❌ in the Actions tab
- Successful syncs will show ✅
- Logs are retained for 7 days

## Troubleshooting

### "Resource not accessible by personal access token"
- Make sure GH_TOKEN has `repo` scope
- Verify you have write access to the target repository

### "Google Sheets API error"
- Check GOOGLE_CREDENTIALS is properly formatted JSON
- Ensure service account has access to the Sheet
- Verify Sheet ID and name are correct

### Workflow not running on schedule
- GitHub Actions may delay scheduled runs during high load
- Free tier has 2000 minutes/month limit
- Check Actions tab for any disabled workflows