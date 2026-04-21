import {
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
} from 'typeorm';

/**
 * Entidad base compartida por todas las entidades del dominio.
 *
 * Usa UUID como id — compatible con MySQL, PostgreSQL y SQLite.
 *
 * Para MongoDB, ver `docs/MONGO.md`: necesita `@ObjectIdColumn` en su
 * lugar (alternativa basada en Mongoose recomendada).
 */
export abstract class BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updated_at: Date;

  @DeleteDateColumn({ name: 'deleted_at', nullable: true })
  deleted_at: Date | null;
}
