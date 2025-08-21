import { google, sheets_v4 } from 'googleapis';
import { SheetRow } from '../types';
import { googleCredentialsPath } from '../config';
import fs from 'fs';
import path from 'path';

export class GoogleSheetsService {
  private sheets: sheets_v4.Sheets;
  private auth: any;

  constructor() {
    this.authenticate();
    this.sheets = google.sheets({ version: 'v4', auth: this.auth });
  }

  private authenticate(): void {
    const credentialsPath = path.resolve(googleCredentialsPath);
    
    if (!fs.existsSync(credentialsPath)) {
      throw new Error(`Google credentials file not found at: ${credentialsPath}`);
    }

    const credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));
    
    this.auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly']
    });
  }

  async getSheetData(spreadsheetId: string, sheetName: string): Promise<SheetRow[]> {
    try {
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId,
        range: sheetName,
      });

      const rows = response.data.values;
      if (!rows || rows.length === 0) {
        console.log('No data found in sheet');
        return [];
      }

      const headers = rows[0];
      const dataRows = rows.slice(1);

      return dataRows.map((row, index) => {
        const sheetRow: SheetRow = { id: `row-${index + 2}` };
        
        headers.forEach((header: string, colIndex: number) => {
          const value = row[colIndex] || '';
          sheetRow[header] = value;
        });

        return sheetRow;
      });
    } catch (error) {
      console.error('Error reading sheet data:', error);
      throw error;
    }
  }

  async getSheetHeaders(spreadsheetId: string, sheetName: string): Promise<string[]> {
    try {
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId,
        range: `${sheetName}!1:1`,
      });

      const headers = response.data.values?.[0] || [];
      return headers;
    } catch (error) {
      console.error('Error reading sheet headers:', error);
      throw error;
    }
  }

  async updateCell(
    spreadsheetId: string,
    sheetName: string,
    row: number,
    column: string,
    value: string
  ): Promise<void> {
    try {
      const range = `${sheetName}!${column}${row}`;
      await this.sheets.spreadsheets.values.update({
        spreadsheetId,
        range,
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [[value]]
        }
      });
    } catch (error) {
      console.error('Error updating cell:', error);
      throw error;
    }
  }
}