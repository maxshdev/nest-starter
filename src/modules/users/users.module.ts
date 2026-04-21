import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { User } from './user.entity';
import { Role } from '../roles/role.entity';
import { UserProfile } from '../user-profiles/user-profile.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, Role, UserProfile])],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService, TypeOrmModule],
})
export class UsersModule {}
