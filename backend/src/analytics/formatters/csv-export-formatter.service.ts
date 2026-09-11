import { Injectable } from '@nestjs/common';

import { ExportFormatter, ExportRow } from '../interfaces/export-formatter.interface';

const CSV_HEADERS = [
  'Date',
  'Project',
  'Branch',
  'Active Time (h)',
  'Focus Score (%)',
  'Earned',
  'Language',
] as const;

function escapeCsvValue(value: string | number): string {
  const stringValue = String(value);

  if (/[",\n]/.test(stringValue)) {
    return `"${stringValue.replaceAll('"', '""')}"`;
  }

  return stringValue;
}

@Injectable()
export class CsvExportFormatterService implements ExportFormatter {
  public readonly format = 'csv';
  public readonly contentType = 'text/csv; charset=utf-8';
  public readonly fileExtension = 'csv';

  public serialize(rows: Array<ExportRow>): string {
    const headerLine = CSV_HEADERS.join(',');
    const dataLines = rows.map((row) =>
      [
        row.date,
        row.projectName,
        row.gitBranch,
        (row.activeSeconds / 3600).toFixed(2),
        row.focusScore.toFixed(0),
        row.earnedMoney.toFixed(2),
        row.language,
      ]
        .map((value) => escapeCsvValue(value))
        .join(','),
    );
    return [headerLine, ...dataLines].join('\n');
  }
}
