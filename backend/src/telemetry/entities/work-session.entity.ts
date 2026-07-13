import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { type TypeId } from '@devpulse/lib/ids';
import { AppBaseEntity } from '../../common/entities/app-base.entity';

import { Project } from '../../projects/entities/project.entity';
import { User } from '../../users/entities/user.entity';
import { TelemetryEvent } from './telemetry-event.entity';

export enum WorkSessionStatus {
  ACTIVE = 'active',
  CLOSED = 'closed',
}

@Entity('work_sessions')
@Index(['userId', 'gitBranch', 'status'])
@Index(['projectId', 'gitBranch'])
export class WorkSession extends AppBaseEntity<'workSessions'> {
  @Column({
    type: 'enum',
    enum: WorkSessionStatus,
    default: WorkSessionStatus.ACTIVE,
  })
  public status!: WorkSessionStatus;

  @Column({ type: 'varchar', name: 'git_branch', length: 255, nullable: true })
  public gitBranch!: string | null;

  @Column({ name: 'started_at', type: 'timestamptz' })
  public startedAt!: Date;

  @Column({ name: 'ended_at', type: 'timestamptz', nullable: true })
  public endedAt!: Date | null;

  @Column({ name: 'active_seconds', type: 'int', default: 0 })
  public activeSeconds!: number;

  @Column({ name: 'idle_seconds', type: 'int', default: 0 })
  public idleSeconds!: number;

  @Column({ name: 'focus_score', type: 'decimal', precision: 5, scale: 2, default: 0 })
  public focusScore!: number;

  @Column({ name: 'earned_money', type: 'decimal', precision: 10, scale: 2, default: 0 })
  public earnedMoney!: number;

  @Column({ type: 'varchar', name: 'primary_language', length: 50, nullable: true })
  public primaryLanguage!: string | null;

  @ManyToOne(() => User, (user) => user.workSessions, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'user_id' })
  public user!: User;

  @Column({ name: 'user_id', type: 'varchar', length: 40 })
  public userId!: TypeId<'users'>;

  @ManyToOne(() => Project, (project) => project.workSessions, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'project_id' })
  public project!: Project | null;

  @Column({ name: 'project_id', type: 'varchar', length: 40, nullable: true })
  public projectId!: TypeId<'projects'> | null;

  @OneToMany(() => TelemetryEvent, (event) => event.session)
  public events!: Array<TelemetryEvent>;
}
