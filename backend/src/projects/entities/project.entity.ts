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
  public id: TypeId<'projects'>;

  @BeforeInsert()
  public generateId(): void {
    this.id = typeIdGenerator('projects');
  }

  @Column({ length: 150 })
  public name: string;

  @Column({ name: 'root_path', length: 500 })
  public rootPath: string;

  @Column({ length: 50, nullable: true })
  public language: string | null;

  @Column({ name: 'is_archived', default: false })
  public isArchived: boolean;

  @CreateDateColumn({ name: 'created_at' })
  public createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  public updatedAt: Date;

  @ManyToOne(() => User, (user) => user.projects, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  public user: User;

  @Column({ name: 'user_id', type: 'varchar', length: 40 })
  public userId: TypeId<'users'>;

  @OneToMany(() => TelemetryEvent, (event) => event.project, { cascade: true })
  public telemetryEvents: Array<TelemetryEvent>;

  @OneToMany(() => WorkSession, (session) => session.project, { cascade: true })
  public workSessions: Array<WorkSession>;
}
