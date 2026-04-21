import { Logger } from '@nestjs/common';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';

export type SupportedDbType = 'mysql' | 'postgres' | 'sqlite' | 'mongodb';

const logger = new Logger('DatabaseConfig');

/**
 * Construye la configuración de TypeORM según la variable DB_TYPE.
 *
 * Soporta: mysql | postgres | sqlite | mongodb
 *
 * IMPORTANTE sobre MongoDB:
 *   TypeORM tiene soporte parcial para Mongo. Este starter provee la
 *   configuración pero recomienda usar `@nestjs/mongoose` para proyectos
 *   que usen Mongo como BD principal. Ver `docs/MONGO.md` para la
 *   implementación alternativa con Mongoose.
 */
export function getDatabaseConfig(): TypeOrmModuleOptions {
  const type = (process.env.DB_TYPE ?? 'mysql').toLowerCase() as SupportedDbType;
  const isDev = (process.env.NODE_ENV ?? 'development') !== 'production';

  const commonOptions = {
    entities: [__dirname + '/../**/*.entity.{ts,js}'],
    autoLoadEntities: true,
    synchronize: isDev,
    logging: isDev,
  };

  switch (type) {
    case 'mysql': {
      logger.log('Using MySQL driver');
      return {
        type: 'mysql',
        host: process.env.DB_HOST ?? 'localhost',
        port: Number(process.env.DB_PORT ?? 3306),
        username: process.env.DB_USER ?? 'root',
        password: process.env.DB_PASS ?? '',
        database: process.env.DB_NAME ?? 'nest_starter',
        ...commonOptions,
      };
    }

    case 'postgres': {
      logger.log('Using PostgreSQL driver');
      return {
        type: 'postgres',
        host: process.env.DB_HOST ?? 'localhost',
        port: Number(process.env.DB_PORT ?? 5432),
        username: process.env.DB_USER ?? 'postgres',
        password: process.env.DB_PASS ?? '',
        database: process.env.DB_NAME ?? 'nest_starter',
        ...commonOptions,
      };
    }

    case 'sqlite': {
      logger.log('Using SQLite driver (better-sqlite3)');
      return {
        type: 'better-sqlite3',
        database: process.env.SQLITE_PATH ?? './nest-starter.sqlite',
        ...commonOptions,
      };
    }

    case 'mongodb': {
      logger.log('Using MongoDB driver (TypeORM). See docs/MONGO.md.');
      return {
        type: 'mongodb',
        url: process.env.MONGO_URI ?? 'mongodb://localhost:27017/nest_starter',
        ...commonOptions,
      };
    }

    default: {
      throw new Error(
        `DB_TYPE "${type}" no soportado. Use: mysql | postgres | sqlite | mongodb`,
      );
    }
  }
}
