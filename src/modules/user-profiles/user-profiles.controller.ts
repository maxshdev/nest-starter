import { Body, Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';

import { UserProfilesService } from './user-profiles.service';
import { UpdateUserProfileDto } from './dto/update-user-profile.dto';

@ApiTags('user-profiles')
@ApiBearerAuth('jwt')
@UseGuards(JwtAuthGuard)
@Controller('users-profiles')
export class UserProfilesController {
  constructor(private readonly userProfilesService: UserProfilesService) {}

  @Get(':userId')
  findOne(@Param('userId') userId: string) {
    return this.userProfilesService.findByUserId(userId);
  }

  @Patch(':userId')
  update(
    @Param('userId') userId: string,
    @Body() dto: UpdateUserProfileDto,
  ) {
    return this.userProfilesService.update(userId, dto);
  }
}
