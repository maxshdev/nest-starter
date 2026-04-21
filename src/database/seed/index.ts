import { DataSource } from 'typeorm';
import { Logger } from '@nestjs/common';
import { seedRoles } from './roles.seed';
import { seedUsers } from './users.seed';

const logger = new Logger('Seed');

export async function runSeeds(dataSource: DataSource): Promise<void> {
  logger.log('Running initial seeds...');
  await seedRoles(dataSource);
  await seedUsers(dataSource);
  logger.log('Seeds completed.');
}
