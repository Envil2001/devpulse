import {
  BeforeInsert,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  PrimaryColumn,
} from 'typeorm';

import { type TypeId, typeIdGenerator } from '@devpulse/lib/ids';

import { ApiKey } from '../../api-keys/entities/api-key.entity';
import { Project } from '../../projects/entities/project.entity';

import { WorkSession } from './work-session.entity';

export enum TelemetryEventType {
  HEARTBEAT = 'heartbeat',
  FILE_OPEN = 'file_open',
  FILE_SAVE = 'file_save',
  FILE_SWITCH = 'file_switch',
  IDLE_START = 'idle_start',
  IDLE_END = 'idle_end',
}

@Entity('telemetry_events')
@Index(['userId', 'createdAt'])
@Index(['projectId', 'gitBranch', 'createdAt'])
export class TelemetryEvent {
  @PrimaryColumn({ type: 'varchar', length: 40 })
  id: TypeId<'telemetryEvents'>;

  @BeforeInsert()
  generateId(): void {
    this.id = typeIdGenerator('telemetryEvents');
  }

  @Column({
    type: 'enum',
    enum: TelemetryEventType,
  })
  type: TelemetryEventType;

  @Column({ name: 'git_branch', length: 255, nullable: true })
  gitBranch: string | null;

  @Column({ name: 'file_path', length: 500, nullable: true })
  filePath: string | null;

  @Column({ length: 50, nullable: true })
  language: string | null;

  @Column({ name: 'duration_ms', type: 'int', nullable: true })
  durationMs: number | null;

  @Column({ name: 'client_timestamp', type: 'timestamptz', nullable: true })
  clientTimestamp: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @ManyToOne(() => ApiKey, (apiKey) => apiKey.telemetryEvents, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  apiKey: ApiKey;

  @Column({ name: 'api_key_id', type: 'varchar', length: 40 })
  apiKeyId: TypeId<'apiKeys'>;

  @Column({ name: 'user_id', type: 'varchar', length: 40 })
  @Index()
  userId: TypeId<'users'>;

  @ManyToOne(() => Project, (project) => project.telemetryEvents, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  project: Project | null;

  @Column({ name: 'project_id', type: 'varchar', length: 40, nullable: true })
  projectId: TypeId<'projects'> | null;

  @ManyToOne(() => WorkSession, (session) => session.events, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  session: WorkSession | null;

  @Column({ name: 'session_id', type: 'varchar', length: 40, nullable: true })
  sessionId: TypeId<'workSessions'> | null;
}
