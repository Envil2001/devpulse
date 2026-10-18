import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';

import { type TypeId } from '@devpulse/lib/ids';

import { ApiKey } from '../../api-keys/entities/api-key.entity';
import { AppBaseEntity } from '../../common/entities/app-base.entity';
import { Project } from '../../projects/entities/project.entity';
import { User } from '../../users/entities/user.entity';

import { WorkSession } from './work-session.entity';

@Entity('telemetry_events')
@Index(['userId', 'eventTimestamp'])
@Index(['projectId', 'gitBranch', 'eventTimestamp'])
export class TelemetryEvent extends AppBaseEntity<'telemetryEvents'> {
  @Column({ type: 'varchar', name: 'git_branch', length: 255, nullable: true })
  public gitBranch!: string | null;

  @Column({ name: 'event_timestamp', type: 'timestamptz' })
  public eventTimestamp!: Date;

  @Column({ name: 'active_seconds', type: 'int', default: 0 })
  public activeSeconds!: number;

  @Column({ name: 'idle_seconds', type: 'int', default: 0 })
  public idleSeconds!: number;

  @Column({ name: 'files_changed', type: 'jsonb', default: [] })
  public filesChanged!: Array<string>;

  @Column({ name: 'file_extensions', type: 'jsonb', default: [] })
  public fileExtensions!: Array<string>;

  @ManyToOne(() => User, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'user_id' })
  public user!: User;

  @Column({ name: 'user_id', type: 'varchar', length: 40 })
  public userId!: TypeId<'users'>;

  @ManyToOne(() => ApiKey, (apiKey) => apiKey.telemetryEvents, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'api_key_id' })
  public apiKey!: ApiKey | null;

  @Column({ name: 'api_key_id', type: 'varchar', length: 40, nullable: true })
  public apiKeyId!: TypeId<'apiKeys'> | null;

  @ManyToOne(() => Project, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'project_id' })
  public project!: Project | null;

  @Column({ name: 'project_id', type: 'varchar', length: 40, nullable: true })
  public projectId!: TypeId<'projects'> | null;

  @ManyToOne(() => WorkSession, (session) => session.events, {
    nullable: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'session_id' })
  public session!: WorkSession | null;

  @Column({ name: 'session_id', type: 'varchar', length: 40, nullable: true })
  public sessionId!: TypeId<'workSessions'> | null;

  @Column({ name: 'machine_id', type: 'varchar', length: 64, nullable: true })
  public machineId!: string | null;

  @Column({ name: 'vscode_session_id', type: 'varchar', length: 64, nullable: true })
  public vscodeSessionId!: string | null;

  @Column({ name: 'command', type: 'varchar', length: 500, nullable: true })
  public command!: string | null;

  @Column({ name: 'command_cwd', type: 'varchar', length: 500, nullable: true })
  public commandCwd!: string | null;

  @Column({ name: 'exit_code', type: 'int', nullable: true })
  public exitCode!: number | null;

  @Column({ name: 'task_name', type: 'varchar', length: 255, nullable: true })
  public taskName!: string | null;

  @Column({ name: 'task_source', type: 'varchar', length: 100, nullable: true })
  public taskSource!: string | null;

  @Column({ name: 'commit_hash', type: 'varchar', length: 40, nullable: true })
  public commitHash!: string | null;

  @Column({ name: 'commit_message', type: 'varchar', length: 500, nullable: true })
  public commitMessage!: string | null;

  @Column({ name: 'insertions', type: 'int', nullable: true })
  public insertions!: number | null;

  @Column({ name: 'deletions', type: 'int', nullable: true })
  public deletions!: number | null;
}
