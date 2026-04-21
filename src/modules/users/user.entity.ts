import {
  BeforeInsert,
  BeforeUpdate,
  Column,
  Entity,
  ManyToOne,
  OneToOne,
} from 'typeorm';
import * as bcrypt from 'bcryptjs';

import { BaseEntity } from 'src/common/entities/base.entity';
import { Role } from 'src/modules/roles/role.entity';
import { UserProfile } from 'src/modules/user-profiles/user-profile.entity';

@Entity('users')
export class User extends BaseEntity {
  @Column({ length: 150, unique: true })
  email: string;

  @Column()
  password: string;

  @BeforeInsert()
  @BeforeUpdate()
  async hashPassword() {
    // Rehasheo solo si la contraseña aún no está hasheada.
    if (this.password && !this.password.startsWith('$2')) {
      this.password = await bcrypt.hash(this.password, 10);
    }
  }

  @ManyToOne(() => Role, (role) => role.id, {
    onDelete: 'SET NULL',
    nullable: true,
    eager: true,
  })
  role: Role | null;

  @OneToOne(() => UserProfile, (profile) => profile.user, {
    cascade: true,
    eager: true,
  })
  profile: UserProfile | null;
}
