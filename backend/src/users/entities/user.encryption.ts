import { Column, Entity, JoinColumn, OneToOne } from 'typeorm';
import { AppBaseEntity } from '../../common/entities/app-base.entity';
import { User } from './user.entity';

@Entity('user_encryption')
export class UserEncryption extends AppBaseEntity<'encryption'> {
  @OneToOne(() => User, (user) => user.encryption, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user!: User;

  @Column({ type: 'text', nullable: true })
  clientPublicKey: string | null = null;

  @Column({ type: 'text', nullable: true })
  serverPrivateKey: string | null = null;

  @Column({ type: 'text', nullable: true })
  salt: string | null = null;

  @Column({ type: 'text', nullable: true })
  verifier: string | null = null;

  @Column({ type: 'text', nullable: true })
  publicKey: string | null = null;

  @Column({ type: 'text', nullable: true })
  encryptedPrivateKey: string | null = null;

  @Column({ type: 'text', nullable: true })
  iv: string | null = null;

  @Column({ type: 'text', nullable: true })
  tag: string | null = null;

  @Column({ type: 'text', nullable: true })
  protectedKey: string | null = null;

  @Column({ type: 'text', nullable: true })
  protectedKeyIV: string | null = null;

  @Column({ type: 'text', nullable: true })
  protectedKeyTag: string | null = null;
}
