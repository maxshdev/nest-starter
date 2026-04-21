import { Entity, Column, OneToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from 'src/common/entities/base.entity';
import { User } from '../users/user.entity';

@Entity('user_profiles')
export class UserProfile extends BaseEntity {
  @Column({ type: 'text', nullable: true })
  avatar_url?: string;

  @Column({ type: 'text', nullable: true })
  first_name?: string;

  @Column({ type: 'text', nullable: true })
  last_name?: string;

  @Column({ type: 'text', nullable: true })
  title?: string;

  @Column({ type: 'text', nullable: true })
  biography?: string;

  @Column({ type: 'text', nullable: true })
  website?: string;

  @Column({ type: 'simple-json', nullable: true })
  social_links?: {
    facebook?: string;
    instagram?: string;
    linkedin?: string;
    tiktok?: string;
    x?: string;
    youtube?: string;
    [key: string]: string | undefined;
  };

  @OneToOne(() => User, (user) => user.profile, { onDelete: 'CASCADE' })
  @JoinColumn()
  user: User;
}
