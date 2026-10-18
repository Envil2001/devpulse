import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { addDays, differenceInCalendarDays, format, isValid, parseISO } from 'date-fns';
import { fromZonedTime } from 'date-fns-tz';
import { Repository } from 'typeorm';

import { formatDuration } from '@devpulse/lib';

import { WorkSession } from '../../telemetry/entities/work-session.entity';
import { User } from '../../users/entities/user.entity';
import {
  AI_SUMMARY_GENERATOR,
  type AiSummaryGenerator,
} from '../interfaces/ai-summary-generator.interface';
import {
  CommandAggregate,
  CommandKindStats,
  SessionAggregate,
  UtcRange,
} from '../interfaces/worklog-internal.interfaces';

const DATE_FORMAT = 'yyyy-MM-dd';
const MAX_RANGE_DAYS = 31;

@Injectable()
export class WorklogService {
  constructor(
    @Inject(AI_SUMMARY_GENERATOR)
    private readonly aiSummaryGenerator: AiSummaryGenerator,
    @InjectRepository(WorkSession)
    private readonly workSessionRepo: Repository<WorkSession>,
  ) {}

  public async generatePeriodWorklog(
    user: User,
    startDateStr: string,
    endDateStr: string,
  ): Promise<{ date: string; summary: string }> {
    const apiKey = user.openaiKey;

    if (!apiKey) {
      throw new BadRequestException(
        'OpenAI API key is not configured. Please add it in your profile settings.',
      );
    }

    const range = this.resolveRange(startDateStr, endDateStr, user.timezone);

    const sessions = await this.workSessionRepo
      .createQueryBuilder('session')
      .leftJoinAndSelect('session.project', 'project')
      .where('session.user_id = :userId', { userId: user.id })
      .andWhere('session.started_at >= :start', { start: range.start })
      .andWhere('session.started_at < :endExclusive', { endExclusive: range.endExclusive })
      .getMany();

    const aggregate = this.aggregate(sessions);

    if (aggregate.totalActiveSeconds === 0) {
      throw new NotFoundException(
        'No coding activity found for the selected period. Please select a date range with recorded work sessions.',
      );
    }

    const period = `${range.startKey} to ${range.endKey}`;

    const summary = await this.aiSummaryGenerator.generate({
      apiKey,
      date: period,
      totalTime: formatDuration(aggregate.totalActiveSeconds),
      projects: this.formatProjects(aggregate.projects),
      branches: [...aggregate.branches].join(', ') || 'Unknown branch',
      languages: this.formatLanguages(aggregate.languages),
      focusScore: Math.round(aggregate.weightedFocus / aggregate.totalActiveSeconds),
      commands: this.formatCommands(aggregate.commands),
      commits: this.formatCommits(aggregate.commits),
    });

    return { date: period, summary };
  }

  private resolveRange(startDateStr: string, endDateStr: string, timezone: string): UtcRange {
    const startDay = parseISO(startDateStr);
    const endDay = parseISO(endDateStr);

    if (!isValid(startDay) || !isValid(endDay)) {
      throw new BadRequestException('Dates must be in YYYY-MM-DD format.');
    }

    const daysBetween = differenceInCalendarDays(endDay, startDay);

    if (daysBetween < 0) {
      throw new BadRequestException('Start date must not be after end date.');
    }

    if (daysBetween + 1 > MAX_RANGE_DAYS) {
      throw new BadRequestException(`Period must not exceed ${MAX_RANGE_DAYS.toString()} days.`);
    }

    const startKey = format(startDay, DATE_FORMAT);
    const endKey = format(endDay, DATE_FORMAT);
    const dayAfterEndKey = format(addDays(endDay, 1), DATE_FORMAT);

    return {
      startKey,
      endKey,
      start: fromZonedTime(`${startKey}T00:00:00`, timezone),
      endExclusive: fromZonedTime(`${dayAfterEndKey}T00:00:00`, timezone),
    };
  }

  private aggregate(sessions: Array<WorkSession>): SessionAggregate {
    const aggregate: SessionAggregate = {
      totalActiveSeconds: 0,
      weightedFocus: 0,
      branches: new Set<string>(),
      projects: new Map<string, number>(),
      languages: new Map<string, number>(),
      commands: {
        totalRuns: 0,
        totalFailed: 0,
        byKind: new Map<string, CommandKindStats>(),
      },
      commits: [],
    };

    for (const session of sessions) {
      const active = session.activeSeconds;

      aggregate.totalActiveSeconds += active;
      aggregate.weightedFocus += session.focusScore * active;

      if (session.gitBranch) {
        aggregate.branches.add(session.gitBranch);
      }

      if (session.project?.name) {
        this.addSeconds(aggregate.projects, session.project.name, active);
      }

      if (session.primaryLanguage) {
        this.addSeconds(aggregate.languages, session.primaryLanguage, active);
      }

      for (const commit of session.commits) {
        aggregate.commits.push({
          message: commit.message,
          insertions: commit.insertions,
          deletions: commit.deletions,
        });
      }

      this.aggregateCommands(aggregate.commands, session.terminalCommands);
    }

    return aggregate;
  }

  private addSeconds(target: Map<string, number>, key: string, seconds: number): void {
    target.set(key, (target.get(key) ?? 0) + seconds);
  }

  private sortByDuration(source: Map<string, number>): Array<[string, number]> {
    return [...source.entries()].sort(([, first], [, second]) => second - first);
  }

  private formatProjects(projects: Map<string, number>): string {
    return (
      this.sortByDuration(projects)
        .map(([name, seconds]) => `${name} (${formatDuration(seconds)})`)
        .join(', ') || 'No project'
    );
  }

  private formatLanguages(languages: Map<string, number>): string {
    const total = [...languages.values()].reduce((sum, seconds) => sum + seconds, 0);

    if (total === 0) {
      return 'Not defined';
    }

    return this.sortByDuration(languages)
      .map(
        ([language, seconds]) => `${language} ${Math.round((seconds / total) * 100).toString()}%`,
      )
      .join(', ');
  }

  private aggregateCommands(
    target: CommandAggregate,
    commands:
      | Array<{
          command: string;
          kind: string;
          exitCode: number | null;
          durationMs: number;
        }>
      | undefined
      | null,
  ): void {
    if (!commands || commands.length === 0) return;

    for (const cmd of commands) {
      const kind = cmd.kind || 'other';
      const stats = target.byKind.get(kind) ?? {
        runs: 0,
        failed: 0,
        totalDurationMs: 0,
      };

      stats.runs += 1;
      stats.totalDurationMs += cmd.durationMs;

      const failed = cmd.exitCode !== null && cmd.exitCode !== 0;
      if (failed) {
        stats.failed += 1;
        target.totalFailed += 1;
      }

      target.byKind.set(kind, stats);
      target.totalRuns += 1;
    }
  }

  private formatCommands(agg: CommandAggregate): string {
    if (agg.totalRuns === 0) {
      return 'No terminal commands recorded.';
    }

    const labels: Record<string, string> = {
      test: 'Test runs',
      build: 'Build runs',
      lint: 'Lint runs',
      task: 'Tasks',
      install: 'Installs',
      git: 'Git commands',
      other: 'Other commands',
    };

    const orderedKinds = ['test', 'build', 'lint', 'task', 'install', 'git', 'other'];

    const parts: Array<string> = [];

    for (const kind of orderedKinds) {
      const stats = agg.byKind.get(kind);
      if (!stats) continue;

      const label = labels[kind] ?? kind;
      const passed = stats.runs - stats.failed;
      const avgMs = stats.runs > 0 ? Math.round(stats.totalDurationMs / stats.runs) : 0;

      if (kind === 'test' || kind === 'build' || kind === 'lint' || kind === 'task') {
        parts.push(
          `${label}: ${String(stats.runs)} (${String(passed)} passed, ${String(stats.failed)} failed) — avg ${formatDuration(avgMs)}`,
        );
      } else {
        parts.push(`${label}: ${String(stats.runs)}`);
      }
    }

    return `${parts.join('. ')}.`;
  }

  private formatCommits(
    commits: Array<{ message: string; insertions: number; deletions: number }>,
  ): string {
    if (commits.length === 0) return 'No commits.';

    const recent = commits.slice(-10);

    return recent
      .map((c) => `"${c.message.slice(0, 80)}" (+${String(c.insertions)}/−${String(c.deletions)})`)
      .join(', ');
  }
}
