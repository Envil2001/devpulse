import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';

import { type TypeId } from '@devpulse/lib';

import { AppBaseEntity } from '../../common/entities/app-base.entity';
import { TelemetryEvent } from '../../telemetry/entities/telemetry-event.entity';
import { User } from '../../users/entities/user.entity';

@Entity('api_keys')
export class ApiKey extends AppBaseEntity<'apiKeys'> {
  @Column({ length: 100, type: 'varchar' })
  public name!: string;

  @Column({ name: 'key_hash', unique: true, length: 255, select: false, type: 'varchar' })
  public keyHash!: string;

  @Column({ name: 'key_prefix', length: 12, type: 'varchar' })
  public keyPrefix!: string;

  @Column({ name: 'last_used_at', type: 'timestamptz', nullable: true })
  public lastUsedAt!: Date | null;

  @Column({ name: 'device_label', type: 'varchar', length: 100, nullable: true })
  public deviceLabel!: string | null;

  @ManyToOne(() => User, (user) => user.apiKeys, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'user_id' })
  public user!: User;

  @Column({ name: 'user_id', type: 'varchar', length: 40 })
  public userId!: TypeId<'users'>;

  @OneToMany(() => TelemetryEvent, (event) => event.apiKey, { cascade: true })
  public telemetryEvents!: Array<TelemetryEvent>;
}
