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
  id: TypeId<'users'>;

  @BeforeInsert()
  generateId(): void {
    this.id = typeIdGenerator('users');
  }

  @Column({ unique: true, length: 255 })
  email: string;
  @Column({ name: 'password_hash', length: 255 })
  passwordHash: string;

  @Column({ name: 'display_name', length: 100, nullable: true })
  displayName: string | null;

  @Column({ name: 'avatar_url', length: 500, nullable: true })
  avatarUrl: string | null;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(() => ApiKey, (apiKey) => apiKey.user, { cascade: true })
  apiKeys: Array<ApiKey>;

  @OneToMany(() => Project, (project) => project.user, { cascade: true })
  projects: Array<Project>;

  @OneToMany(() => WorkSession, (session) => session.user, { cascade: true })
  workSessions: Array<WorkSession>;
}
