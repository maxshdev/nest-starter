import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString } from 'class-validator';

export class GoogleOAuthDto {
  @ApiProperty({ example: 'user@gmail.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'John Doe', required: false })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({
    example: 'https://lh3.googleusercontent.com/a/...',
    required: false,
  })
  @IsOptional()
  @IsString()
  image?: string;
}
