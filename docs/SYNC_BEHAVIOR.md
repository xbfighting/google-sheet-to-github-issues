# Sync Behavior Documentation

## Default Behavior (One-Way Sync)

By default, the tool performs **one-way sync** from Google Sheets to GitHub Issues:

- **Sheet is the source of truth**
- Any changes in the Sheet will overwrite GitHub Issues
- Deleted issues will be recreated
- Manual changes in GitHub will be lost on next sync

## Handling Deleted Issues

### Scenario: Issue deleted on GitHub

**Default behavior (`SKIP_DELETED=false`):**
- The issue will be **recreated** on the next sync
- A new issue number will be assigned
- All comments and history will be lost

**With `SKIP_DELETED=true`:**
- The issue will **NOT be recreated**
- The sync will skip this row
- Useful when you want to permanently remove issues

## Handling Modified Issues

### Scenario: Issue manually edited on GitHub

**Default behavior (`RESPECT_GITHUB_CHANGES=false`):**
- Changes will be **overwritten** on next sync
- Sheet data takes priority
- Manual edits in GitHub are lost

**With `RESPECT_GITHUB_CHANGES=true`:**
- Manual changes are **preserved**
- The sync will skip updating these issues
- Sheet changes won't be applied to manually edited issues

## Configuration Examples

### 1. Standard One-Way Sync (Default)
```env
SKIP_DELETED=false
RESPECT_GITHUB_CHANGES=false
```
- Sheet → GitHub
- Overwrites all changes
- Recreates deleted issues

### 2. Preserve GitHub Changes
```env
SKIP_DELETED=true
RESPECT_GITHUB_CHANGES=true
```
- Initial sync from Sheet → GitHub
- After that, respects all GitHub changes
- Won't recreate deleted issues
- Won't overwrite manual edits

### 3. Sheet as Master, Allow Deletions
```env
SKIP_DELETED=true
RESPECT_GITHUB_CHANGES=false
```
- Sheet → GitHub updates continue
- Deleted issues stay deleted
- Manual edits get overwritten

## Best Practices

### For Project Management
Use **Standard One-Way Sync** when:
- Google Sheets is your main project management tool
- You want consistent data between Sheet and GitHub
- Team members should only edit in Sheets

### For Issue Tracking
Use **Preserve GitHub Changes** when:
- GitHub Issues is your main tracking system
- You only want initial import from Sheets
- Team members actively work in GitHub

### For Hybrid Workflow
Use **Sheet as Master, Allow Deletions** when:
- Sheets manages active items
- Completed/cancelled items can be deleted from GitHub
- You want to keep GitHub clean

## Tracking Sync State

The tool maintains an internal mapping of Sheet rows to Issue numbers:
1. First sync creates the mapping
2. Subsequent syncs use this mapping to update correct issues
3. If an issue is deleted, the mapping helps detect it

## Limitations

- **No two-way sync** yet (GitHub → Sheet not implemented)
- **No conflict resolution** - one source always wins
- **No partial updates** - all fields update together
- **No comment sync** - only issue metadata syncs

## Future Improvements

Planned features:
- Two-way sync with conflict resolution
- Selective field updates
- Comment synchronization
- Change history tracking
- Webhook-based real-time sync