import { ApiProperty } from '@nestjs/swagger';
import { IsObject, IsOptional, IsString, IsUrl } from 'class-validator';

export class UpdateUserProfileDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsUrl()
  avatar_url?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  first_name?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  last_name?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  biography?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsUrl()
  website?: string;

  @ApiProperty({ required: false, type: Object })
  @IsOptional()
  @IsObject()
  social_links?: Record<string, string>;
}
