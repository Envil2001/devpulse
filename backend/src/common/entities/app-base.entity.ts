import { BaseEntity, CreateDateColumn, PrimaryColumn, UpdateDateColumn } from 'typeorm';

import { type IdTypePrefixes, type TypeId } from '@devpulse/lib';

// eslint-disable-next-line @typescript-eslint/no-unnecessary-type-parameters
export abstract class AppBaseEntity<Prefix extends IdTypePrefixes> extends BaseEntity {
  @PrimaryColumn({
    type: 'varchar',
    length: 48,
  })
  public id!: TypeId<Prefix>;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  public createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  public updatedAt!: Date;
}
