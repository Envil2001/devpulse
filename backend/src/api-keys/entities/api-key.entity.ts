import {
  BeforeInsert,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryColumn,
} from 'typeorm';

import { type TypeId, typeIdGenerator } from '@devpulse/lib';

import { TelemetryEvent } from '../../telemetry/entities/telemetry-event.entity';
import { User } from '../../users/entities/user.entity';
import { AppBaseEntity } from '../../common/entities/app-base.entity';

@Entity('api_keys')
export class ApiKey extends AppBaseEntity<'apiKeys'> {
  @Column({ length: 100, type: 'varchar' })
  name!: string;

  @Column({ name: 'key_hash', unique: true, length: 255, select: false, type: 'varchar' })
  keyHash!: string;

  @Column({ name: 'key_prefix', length: 12, type: 'varchar' })
  keyPrefix!: string;

  @Column({ name: 'last_used_at', type: 'timestamptz', nullable: true })
  lastUsedAt!: Date | null;

  @Column({ name: 'device_label', type: 'varchar', length: 100, nullable: true })
  deviceLabel!: string | null;

  @ManyToOne(() => User, (user) => user.apiKeys, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @Column({ name: 'user_id', type: 'varchar', length: 40 })
  userId!: TypeId<'users'>;

  @OneToMany(() => TelemetryEvent, (event) => event.apiKey, { cascade: true })
  telemetryEvents!: Array<TelemetryEvent>;
}
