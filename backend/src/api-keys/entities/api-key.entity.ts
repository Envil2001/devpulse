import {
  BeforeInsert,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  OneToMany,
  PrimaryColumn,
} from 'typeorm';

import { type TypeId, typeIdGenerator } from '@devpulse/lib/ids';

import { TelemetryEvent } from '../../telemetry/entities/telemetry-event.entity';
import { User } from '../../users/entities/user.entity';

@Entity('api_keys')
export class ApiKey {
  @PrimaryColumn({ type: 'varchar', length: 40 })
  id: TypeId<'apiKeys'>;

  @BeforeInsert()
  generateId(): void {
    this.id = typeIdGenerator('apiKeys');
  }

  @Column({ length: 100 })
  name: string;

  @Index()
  @Column({ name: 'key_hash', unique: true, length: 255 })
  keyHash: string;

  @Column({ name: 'key_prefix', length: 12 })
  keyPrefix: string;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ name: 'last_used_at', nullable: true })
  lastUsedAt: Date | null;

  @Column({ name: 'device_label', length: 100, nullable: true })
  deviceLabel: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => User, (user) => user.apiKeys, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  user: User;

  @Column({ name: 'user_id', type: 'varchar', length: 40 })
  userId: TypeId<'users'>;

  @OneToMany(() => TelemetryEvent, (event) => event.apiKey, { cascade: true })
  telemetryEvents: Array<TelemetryEvent>;
}
