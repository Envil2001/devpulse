import { Column, Entity, OneToMany, OneToOne } from 'typeorm';

import { ApiKey } from '../../api-keys/entities/api-key.entity';
import { Project } from '../../projects/entities/project.entity';
import { WorkSession } from '../../telemetry/entities/work-session.entity';
import { AppBaseEntity } from '../../common/entities/app-base.entity';
import { UserEncryption } from './user-encryption.entity';

@Entity('users')
export class User extends AppBaseEntity<'users'> {
  @Column({
    unique: true,
    type: 'varchar',
    length: 255,
  })
  email!: string;

  @OneToOne(() => UserEncryption, (encryption) => encryption.user, { cascade: true })
  encryption!: UserEncryption;

  @Column({
    type: 'varchar',
    name: 'display_name',
    length: 100,
    nullable: true,
  })
  displayName!: string;

  @Column({
    name: 'is_active',
    type: 'boolean',
    default: true,
  })
  isActive!: boolean;

  @OneToMany(() => ApiKey, (apiKey) => apiKey.user, { cascade: true })
  apiKeys!: ApiKey[];

  @OneToMany(() => Project, (project) => project.user, { cascade: true })
  projects!: Project[];

  @OneToMany(() => WorkSession, (session) => session.user, { cascade: true })
  workSessions!: WorkSession[];
}
