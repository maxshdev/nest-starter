import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { UserProfile } from './user-profile.entity';
import { User } from '../users/user.entity';
import { UpdateUserProfileDto } from './dto/update-user-profile.dto';

@Injectable()
export class UserProfilesService {
  constructor(
    @InjectRepository(UserProfile)
    private readonly profilesRepo: Repository<UserProfile>,

    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
  ) {}

  async findByUserId(userId: string): Promise<UserProfile> {
    const user = await this.usersRepo.findOne({
      where: { id: userId },
      relations: ['profile'],
    });
    if (!user) throw new NotFoundException(`User ${userId} not found`);

    if (!user.profile) {
      const profile = this.profilesRepo.create({
        first_name: user.email.split('@')[0],
        user,
      });
      user.profile = await this.profilesRepo.save(profile);
    }

    return user.profile;
  }

  async update(
    userId: string,
    dto: UpdateUserProfileDto,
  ): Promise<UserProfile> {
    const profile = await this.findByUserId(userId);
    Object.assign(profile, dto);
    return this.profilesRepo.save(profile);
  }
}
