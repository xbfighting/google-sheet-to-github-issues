import fs from 'fs';
import path from 'path';

export interface IssueMappingData {
  rowId: string;
  issueNumber: number;
  title: string;
  createdAt: string;
  updatedAt: string;
}

export class StorageService {
  private mappingFile: string;
  private mappings: Map<string, IssueMappingData> = new Map();

  constructor(mappingFile: string = '.issue-mappings.json') {
    this.mappingFile = path.resolve(mappingFile);
    this.loadMappings();
  }

  private loadMappings(): void {
    try {
      if (fs.existsSync(this.mappingFile)) {
        const data = JSON.parse(fs.readFileSync(this.mappingFile, 'utf8'));
        if (Array.isArray(data)) {
          data.forEach(item => {
            this.mappings.set(item.rowId, item);
          });
        }
        console.log(`Loaded ${this.mappings.size} issue mappings from ${this.mappingFile}`);
      }
    } catch (error) {
      console.error('Error loading mappings:', error);
    }
  }

  private saveMappings(): void {
    try {
      const data = Array.from(this.mappings.values());
      fs.writeFileSync(this.mappingFile, JSON.stringify(data, null, 2));
    } catch (error) {
      console.error('Error saving mappings:', error);
    }
  }

  setMapping(rowId: string, issueNumber: number, title: string): void {
    const existing = this.mappings.get(rowId);
    const now = new Date().toISOString();
    
    this.mappings.set(rowId, {
      rowId,
      issueNumber,
      title,
      createdAt: existing?.createdAt || now,
      updatedAt: now
    });
    
    this.saveMappings();
  }

  getMapping(rowId: string): IssueMappingData | undefined {
    return this.mappings.get(rowId);
  }

  getIssueNumber(rowId: string): number | undefined {
    return this.mappings.get(rowId)?.issueNumber;
  }

  getAllMappings(): Map<string, IssueMappingData> {
    return new Map(this.mappings);
  }

  deleteMapping(rowId: string): void {
    this.mappings.delete(rowId);
    this.saveMappings();
  }

  clear(): void {
    this.mappings.clear();
    this.saveMappings();
  }
}