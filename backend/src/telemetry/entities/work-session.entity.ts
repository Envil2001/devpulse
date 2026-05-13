import {
  BeforeInsert,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  OneToMany,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';

import { type TypeId, typeIdGenerator } from '@devpulse/lib/ids';

import { Project } from '../../projects/entities/project.entity';
import { User } from '../../users/entities/user.entity';

import { TelemetryEvent } from './telemetry-event.entity';

export enum WorkSessionStatus {
  ACTIVE = 'active',
  CLOSED = 'closed',
}

@Entity('work_sessions')
@Index(['userId', 'startedAt'])
@Index(['projectId', 'gitBranch'])
export class WorkSession {
  @PrimaryColumn({ type: 'varchar', length: 40 })
  public id: TypeId<'workSessions'>;

  @BeforeInsert()
  public generateId(): void {
    this.id = typeIdGenerator('workSessions');
  }

  @Column({
    type: 'enum',
    enum: WorkSessionStatus,
    default: WorkSessionStatus.ACTIVE,
  })
  public status: WorkSessionStatus;

  @Column({ name: 'git_branch', length: 255, nullable: true })
  public gitBranch: string | null;

  @Column({ name: 'started_at', type: 'timestamptz' })
  public startedAt: Date;

  @Column({ name: 'ended_at', type: 'timestamptz', nullable: true })
  public endedAt: Date | null;

  @Column({ name: 'active_duration_ms', type: 'int', default: 0 })
  public activeDurationMs: number;

  @Column({ name: 'total_duration_ms', type: 'int', nullable: true })
  public totalDurationMs: number | null;

  @Column({ name: 'primary_language', length: 50, nullable: true })
  public primaryLanguage: string | null;

  @CreateDateColumn({ name: 'created_at' })
  public createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  public updatedAt: Date;

  @ManyToOne(() => User, (user) => user.workSessions, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  public user: User;

  @Column({ name: 'user_id', type: 'varchar', length: 40 })
  public userId: TypeId<'users'>;

  @ManyToOne(() => Project, (project) => project.workSessions, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  public project: Project | null;

  @Column({ name: 'project_id', type: 'varchar', length: 40, nullable: true })
  public projectId: TypeId<'projects'> | null;

  @OneToMany(() => TelemetryEvent, (event) => event.session)
  public events: Array<TelemetryEvent>;
}
