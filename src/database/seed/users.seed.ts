import { DataSource } from 'typeorm';
import { User } from 'src/modules/users/user.entity';
import { Role } from 'src/modules/roles/role.entity';
import { UserProfile } from 'src/modules/user-profiles/user-profile.entity';
import { SystemRole } from './roles.seed';

interface SeedUser {
  email: string;
  password: string;
  role: SystemRole;
  first_name: string;
  last_name: string;
}

const SEED_USERS: SeedUser[] = [
  {
    email: 'superadmin@example.com',
    password: 'superadmin123',
    role: SystemRole.SuperAdmin,
    first_name: 'Super',
    last_name: 'Admin',
  },
  {
    email: 'admin@example.com',
    password: 'admin123',
    role: SystemRole.Admin,
    first_name: 'Admin',
    last_name: 'User',
  },
  {
    email: 'user@example.com',
    password: 'user123',
    role: SystemRole.User,
    first_name: 'Regular',
    last_name: 'User',
  },
  {
    email: 'guest@example.com',
    password: 'guest123',
    role: SystemRole.Guest,
    first_name: 'Guest',
    last_name: 'User',
  },
];

export async function seedUsers(dataSource: DataSource): Promise<void> {
  const userRepo = dataSource.getRepository(User);
  const roleRepo = dataSource.getRepository(Role);
  const profileRepo = dataSource.getRepository(UserProfile);

  for (const data of SEED_USERS) {
    const exists = await userRepo.findOne({
      where: { email: data.email },
      withDeleted: true,
    });
    if (exists) continue;

    const role = await roleRepo.findOne({ where: { name: data.role } });
    if (!role) {
      // eslint-disable-next-line no-console
      console.warn(`⚠️ Role not found: ${data.role}`);
      continue;
    }

    const profile = profileRepo.create({
      first_name: data.first_name,
      last_name: data.last_name,
    });

    const user = userRepo.create({
      email: data.email,
      password: data.password,
      role,
      profile,
    });

    await userRepo.save(user);
    // eslint-disable-next-line no-console
    console.log(`✅ User created: ${data.email} (${data.role})`);
  }
}
