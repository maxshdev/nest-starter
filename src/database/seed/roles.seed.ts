import { DataSource } from 'typeorm';
import { Role } from 'src/modules/roles/role.entity';

export enum SystemRole {
  SuperAdmin = 'superadmin',
  Admin = 'admin',
  User = 'user',
  Guest = 'guest',
}

export async function seedRoles(dataSource: DataSource): Promise<void> {
  const repo = dataSource.getRepository(Role);

  for (const name of Object.values(SystemRole)) {
    const exists = await repo.findOne({ where: { name } });
    if (!exists) {
      await repo.save(repo.create({ name }));
      // eslint-disable-next-line no-console
      console.log(`✅ Role created: ${name}`);
    }
  }
}
