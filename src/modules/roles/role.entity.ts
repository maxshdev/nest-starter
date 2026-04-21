import { Entity, Column } from 'typeorm';
import { BaseEntity } from 'src/common/entities/base.entity';

@Entity('roles')
export class Role extends BaseEntity {
  @Column({
    type: 'varchar',
    length: 100,
    unique: true,
    transformer: {
      to: (value: string) => value?.toLowerCase(),
      from: (value: string) => value,
    },
  })
  name: string;
}
