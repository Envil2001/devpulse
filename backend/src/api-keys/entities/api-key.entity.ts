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

import { type TypeId, typeIdGenerator } from '@devpulse/lib';

import { TelemetryEvent } from '../../telemetry/entities/telemetry-event.entity';
import { User } from '../../users/entities/user.entity';

@Entity('api_keys')
export class ApiKey {
  @PrimaryColumn({ type: 'varchar', length: 40 })
  declare public id: TypeId<'apiKeys'>;

  @BeforeInsert()
  public generateId(): void {
    this.id = typeIdGenerator('apiKeys');
  }

  @Column({ length: 100 })
  declare public name: string;

  @Index()
  @Column({ name: 'key_hash', unique: true, length: 255 })
  declare public keyHash: string;

  @Column({ name: 'key_prefix', length: 12 })
  declare public keyPrefix: string;

  @Column({ name: 'is_active', default: true })
  declare public isActive: boolean;

  @Column({ name: 'last_used_at', type: 'timestamptz', nullable: true })
  declare public lastUsedAt: Date | null;

  @Column({ name: 'device_label', type: 'varchar', length: 100, nullable: true })
  declare public deviceLabel: string | null;

  @CreateDateColumn({ name: 'created_at' })
  declare public createdAt: Date;

  @ManyToOne(() => User, (user) => user.apiKeys, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  declare public user: User;

  @Column({ name: 'user_id', type: 'varchar', length: 40 })
  declare public userId: TypeId<'users'>;

  @OneToMany(() => TelemetryEvent, (event) => event.apiKey, { cascade: true })
  declare public telemetryEvents: Array<TelemetryEvent>;
}
