import { Column, Entity, JoinColumn, ManyToOne, Unique } from 'typeorm';

import { type TypeId } from '@devpulse/lib/ids';

import { AppBaseEntity } from '../../common/entities/app-base.entity';
import { User } from '../../users/entities/user.entity';
import type { WorklogFormat, WorklogLanguage } from '../constants/worklog.constants';

@Entity('worklog_entries')
@Unique(['userId', 'date', 'format', 'language'])
export class WorklogEntry extends AppBaseEntity<'worklogEntries'> {
  @Column({ type: 'date' })
  public date!: string;

  @Column({ type: 'varchar', length: 20 })
  public format!: WorklogFormat;

  @Column({ type: 'varchar', length: 5 })
  public language!: WorklogLanguage;

  @Column({ name: 'facts_hash', type: 'char', length: 64 })
  public factsHash!: string;

  @Column({ type: 'text' })
  public text!: string;

  @Column({ type: 'varchar', length: 120 })
  public model!: string;

  @ManyToOne(() => User, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  public user!: User;

  @Column({ name: 'user_id', type: 'varchar', length: 40 })
  public userId!: TypeId<'users'>;
}
