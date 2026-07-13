import { IdTypePrefixes, type TypeId } from '@devpulse/lib';
import { BaseEntity, CreateDateColumn, PrimaryColumn, UpdateDateColumn } from 'typeorm';

export abstract class AppBaseEntity<Prefix extends IdTypePrefixes> extends BaseEntity {
  @PrimaryColumn({
    type: 'varchar',
    length: 48,
  })
  id!: TypeId<Prefix>;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
