import {
  BeforeInsert,
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';

import { type TypeId, typeIdGenerator } from '@devpulse/lib/ids';

import { ApiKey } from '../../api-keys/entities/api-key.entity';
import { Project } from '../../projects/entities/project.entity';
import { WorkSession } from '../../telemetry/entities/work-session.entity';

@Entity('users')
export class User {
  @PrimaryColumn({ type: 'varchar', length: 40 })
  public id: TypeId<'users'>;

  @BeforeInsert()
  public generateId(): void {
    this.id = typeIdGenerator('users');
  }

  @Column({ unique: true, length: 255 })
  public email: string;
  @Column({ name: 'password_hash', length: 255 })
  public passwordHash: string;

  @Column({ type: 'varchar', name: 'display_name', length: 100, nullable: true })
  public displayName: string | null;

  @Column({ type: 'varchar', name: 'avatar_url', length: 500, nullable: true })
  public avatarUrl: string | null;

  @Column({ name: 'is_active', default: true })
  public isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  public createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  public updatedAt: Date;

  @OneToMany(() => ApiKey, (apiKey) => apiKey.user, { cascade: true })
  public apiKeys: Array<ApiKey>;

  @OneToMany(() => Project, (project) => project.user, { cascade: true })
  public projects: Array<Project>;

  @OneToMany(() => WorkSession, (session) => session.user, { cascade: true })
  public workSessions: Array<WorkSession>;
}
