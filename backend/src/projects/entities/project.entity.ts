import {
  BeforeInsert,
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';

import { type TypeId, typeIdGenerator } from '@devpulse/lib/ids';

import { TelemetryEvent } from '../../telemetry/entities/telemetry-event.entity';
import { WorkSession } from '../../telemetry/entities/work-session.entity';
import { User } from '../../users/entities/user.entity';

@Entity('projects')
@Unique(['userId', 'rootPath'])
export class Project {
  @PrimaryColumn({ type: 'varchar', length: 40 })
  id: TypeId<'projects'>;

  @BeforeInsert()
  generateId(): void {
    this.id = typeIdGenerator('projects');
  }

  @Column({ length: 150 })
  name: string;

  @Column({ name: 'root_path', length: 500 })
  rootPath: string;

  @Column({ length: 50, nullable: true })
  language: string | null;

  @Column({ name: 'is_archived', default: false })
  isArchived: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => User, (user) => user.projects, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  user: User;

  @Column({ name: 'user_id', type: 'varchar', length: 40 })
  userId: TypeId<'users'>;

  @OneToMany(() => TelemetryEvent, (event) => event.project, { cascade: true })
  telemetryEvents: Array<TelemetryEvent>;

  @OneToMany(() => WorkSession, (session) => session.project, { cascade: true })
  workSessions: Array<WorkSession>;
}
