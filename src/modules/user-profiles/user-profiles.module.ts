import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { UserProfile } from './user-profile.entity';
import { UserProfilesService } from './user-profiles.service';
import { UserProfilesController } from './user-profiles.controller';
import { User } from '../users/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([UserProfile, User])],
  controllers: [UserProfilesController],
  providers: [UserProfilesService],
  exports: [UserProfilesService, TypeOrmModule],
})
export class UserProfilesModule {}
