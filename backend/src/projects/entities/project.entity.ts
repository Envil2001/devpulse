import { Column, Entity, ManyToOne, OneToMany } from 'typeorm';
import { AppBaseEntity } from '../../common/entities/app-base.entity';
import { WorkSession } from '../../telemetry/entities/work-session.entity';
import { type TypeId } from '@devpulse/lib';
import { User } from '../../users/entities/user.entity';

@Entity('projects')
export class Project extends AppBaseEntity<'projects'> {
  @Column({ name: 'git_remote_url', unique: true })
  gitRemoteUrl!: string;

  @Column({ length: 100 })
  name!: string;

  @OneToMany(() => WorkSession, (session) => session.project)
  workSessions!: WorkSession[];

  @ManyToOne(() => User, (user) => user.projects, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  user!: User;

  @Column({ name: 'user_id', type: 'varchar', length: 40 })
  userId!: TypeId<'users'>;
}
