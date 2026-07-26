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
}
