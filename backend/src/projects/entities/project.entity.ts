import { Column, Entity, ManyToOne, OneToMany } from 'typeorm';

import { type TypeId } from '@devpulse/lib';

import { AppBaseEntity } from '../../common/entities/app-base.entity';
import { WorkSession } from '../../telemetry/entities/work-session.entity';
import { User } from '../../users/entities/user.entity';

@Entity('projects')
export class Project extends AppBaseEntity<'projects'> {
  @Column({ name: 'git_remote_url', unique: true, type: 'text' })
  public gitRemoteUrl!: string;

  @Column({ length: 100, type: 'varchar' })
  public name!: string;

  @OneToMany(() => WorkSession, (session) => session.project)
  public workSessions!: Array<WorkSession>;

  @ManyToOne(() => User, (user) => user.projects, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  public user!: User;

  @Column({ name: 'user_id', type: 'varchar', length: 40 })
  public userId!: TypeId<'users'>;
}
