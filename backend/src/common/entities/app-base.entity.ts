import { IdTypePrefixes, type TypeId, TYPEID_LENGTH } from '@devpulse/lib';
import { BaseEntity, PrimaryColumn } from 'typeorm';

export abstract class AppBaseEntity<Prefix extends IdTypePrefixes> extends BaseEntity {
  @PrimaryColumn({
    type: 'varchar',
    length: TYPEID_LENGTH,
  })
  id!: TypeId<Prefix>;
}
