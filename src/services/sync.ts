import { GoogleSheetsService } from './googleSheets';
import { GitHubService } from './github';
import { StorageService } from './storage';
import { SheetRow, GitHubIssue, SyncConfig } from '../types';
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.printf(({ timestamp, level, message }) => {
      return `[${timestamp}] ${level.toUpperCase()}: ${message}`;
    })
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'sync.log' })
  ]
});

export class SyncService {
  private googleSheets: GoogleSheetsService;
  private github: GitHubService;
  private storage: StorageService;
  private config: SyncConfig;

  constructor(config: SyncConfig) {
    this.config = config;
    this.googleSheets = new GoogleSheetsService();
    this.github = new GitHubService(config.githubOwner, config.githubRepo);
    this.storage = new StorageService();
  }

  private transformRow(row: SheetRow): GitHubIssue {
    const issue: GitHubIssue = {
      title: 'Untitled Issue',
      labels: []
    };

    for (const mapping of this.config.fieldMappings) {
      const value = row[mapping.sheet];
      if (value !== undefined && value !== '') {
        const transformedValue = mapping.transform ? mapping.transform(value) : value;
        
        // Special handling for labels - merge multiple label sources
        if (mapping.github === 'labels' && Array.isArray(transformedValue)) {
          issue.labels = [...(issue.labels || []), ...transformedValue];
        } else {
          (issue as any)[mapping.github] = transformedValue;
        }
      }
    }

    if (!issue.title || issue.title === 'Untitled Issue') {
      issue.title = row['Feature / Issue'] || row['Title'] || row['title'] || row['Name'] || row['name'] || 'Untitled Issue';
    }

    return issue;
  }


  async syncOnce(): Promise<void> {
    logger.info('Starting sync process...');

    try {
      const sheetData = await this.googleSheets.getSheetData(
        this.config.spreadsheetId,
        this.config.sheetName
      );

      logger.info(`Found ${sheetData.length} rows in Google Sheet`);

      let created = 0;
      let updated = 0;
      let skipped = 0;

      for (const row of sheetData) {
        try {
          const githubIssue = this.transformRow(row);
          
          if (!githubIssue.title || githubIssue.title === 'Untitled Issue') {
            logger.warn(`Skipping row ${row.id}: No valid title found`);
            skipped++;
            continue;
          }

          // Use persistent storage to get existing issue number
          const existingIssueNumber = this.storage.getIssueNumber(row.id || '');

          if (existingIssueNumber) {
            const existingIssue = await this.github.getIssue(existingIssueNumber);
            
            if (existingIssue) {
              // Check if we should respect GitHub changes
              if (this.config.respectGitHubChanges) {
                logger.info(`Respecting GitHub changes for issue #${existingIssueNumber}: ${githubIssue.title}`);
                skipped++;
              } else {
                const hasChanges = 
                  existingIssue.title !== githubIssue.title ||
                  existingIssue.body !== githubIssue.body ||
                  existingIssue.state !== githubIssue.state ||
                  JSON.stringify(existingIssue.labels?.sort()) !== JSON.stringify(githubIssue.labels?.sort()) ||
                  JSON.stringify(existingIssue.assignees?.sort()) !== JSON.stringify(githubIssue.assignees?.sort());

                if (hasChanges) {
                  await this.github.updateIssue(existingIssueNumber, githubIssue);
                  logger.info(`Updated issue #${existingIssueNumber}: ${githubIssue.title}`);
                  updated++;
                } else {
                  logger.info(`No changes for issue #${existingIssueNumber}: ${githubIssue.title}`);
                  skipped++;
                }
              }
            } else {
              // Issue was deleted on GitHub
              if (this.config.skipDeleted) {
                logger.warn(`Issue #${existingIssueNumber} was deleted on GitHub, skipping recreation`);
                skipped++;
              } else {
                logger.warn(`Issue #${existingIssueNumber} not found on GitHub, creating new issue`);
                const newIssueNumber = await this.github.createIssue(githubIssue);
                this.storage.setMapping(row.id || '', newIssueNumber, githubIssue.title);
                created++;
              }
            }
          } else {
            const existingByTitle = await this.github.findIssueByTitle(githubIssue.title);
            
            if (existingByTitle) {
              logger.info(`Found existing issue #${existingByTitle} by title: ${githubIssue.title}`);
              this.storage.setMapping(row.id || '', existingByTitle, githubIssue.title);
              await this.github.updateIssue(existingByTitle, githubIssue);
              updated++;
            } else {
              const newIssueNumber = await this.github.createIssue(githubIssue);
              this.storage.setMapping(row.id || '', newIssueNumber, githubIssue.title);
              created++;
            }
          }
        } catch (error) {
          logger.error(`Error processing row ${row.id}:`, error);
        }
      }

      logger.info(`Sync completed: Created ${created}, Updated ${updated}, Skipped ${skipped}`);
    } catch (error) {
      logger.error('Sync failed:', error);
      throw error;
    }
  }

  async syncContinuously(): Promise<void> {
    const intervalMs = (this.config.syncIntervalMinutes || 5) * 60 * 1000;
    
    logger.info(`Starting continuous sync with interval: ${this.config.syncIntervalMinutes} minutes`);
    
    await this.syncOnce();
    
    setInterval(async () => {
      try {
        await this.syncOnce();
      } catch (error) {
        logger.error('Error during scheduled sync:', error);
      }
    }, intervalMs);
  }
}