import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { TypeId } from '@devpulse/lib';

import { WorkSession } from '../../telemetry/entities/work-session.entity';
import { GetAnalyticsRangeRequestDto } from '../dto/request/get-analytics-range-request.dto';
import { CsvExportFormatterService } from '../formatters/csv-export-formatter.service';
import { ExportRow } from '../interfaces/export-formatter.interface';

interface ExportedFile {
  content: string;
  contentType: string;
  filename: string;
}

interface SessionExportRaw {
  date: Date | string;
  projectName: string | null;
  gitBranch: string | null;
  activeSeconds: string | null;
  focusScore: string | null;
  earnedMoney: string | null;
  primaryLanguage: string | null;
}

@Injectable()
export class AnalyticsExportService {
  private readonly logger = new Logger(AnalyticsExportService.name);

  constructor(
    @InjectRepository(WorkSession)
    private readonly sessionRepo: Repository<WorkSession>,
    private readonly csvFormatter: CsvExportFormatterService,
  ) {}

  public async exportSessions(
    userId: TypeId<'users'>,
    query: GetAnalyticsRangeRequestDto,
  ): Promise<ExportedFile> {
    this.logger.log(`Exporting sessions for user: ${userId}`);

    const rows = await this.fetchRows(userId, query);
    const content = this.csvFormatter.serialize(rows);

    return {
      content,
      contentType: this.csvFormatter.contentType,
      filename: this.buildFilename(query),
    };
  }

  private async fetchRows(
    userId: TypeId<'users'>,
    query: GetAnalyticsRangeRequestDto,
  ): Promise<Array<ExportRow>> {
    const qb = this.sessionRepo
      .createQueryBuilder('session')
      .leftJoin('session.project', 'project')
      .select('session.started_at', 'date')
      .addSelect('project.name', 'projectName')
      .addSelect('session.git_branch', 'gitBranch')
      .addSelect('session.active_seconds', 'activeSeconds')
      .addSelect('session.focus_score', 'focusScore')
      .addSelect('session.earned_money', 'earnedMoney')
      .addSelect('session.primary_language', 'primaryLanguage')
      .where('session.user_id = :userId', { userId })
      .orderBy('session.started_at', 'ASC');

    if (query.projectId) {
      qb.andWhere('session.project_id = :projectId', { projectId: query.projectId });
    }
    if (query.startDate) {
      qb.andWhere('session.started_at >= :startDate', { startDate: query.startDate });
    }
    if (query.endDate) {
      qb.andWhere('session.started_at <= :endDate', { endDate: query.endDate });
    }

    const rawRows = await qb.getRawMany<SessionExportRaw>();

    return rawRows.map((row) => ({
      date: this.formatDate(row.date),
      projectName: row.projectName ?? 'Unknown',
      gitBranch: row.gitBranch ?? 'unknown',
      activeSeconds: Number(row.activeSeconds ?? 0),
      focusScore: Number(row.focusScore ?? 0),
      earnedMoney: Number(row.earnedMoney ?? 0),
      language: row.primaryLanguage ?? 'n/a',
    }));
  }

  private formatDate(value: Date | string): string {
    const date = value instanceof Date ? value : new Date(value);
    return date.toISOString().split('T')[0] ?? '';
  }

  private buildFilename(query: GetAnalyticsRangeRequestDto): string {
    const start = query.startDate?.split('T')[0] ?? 'all';
    const end = query.endDate?.split('T')[0] ?? 'now';
    return `devpulse-sessions_${start}_${end}.${this.csvFormatter.fileExtension}`;
  }
}
