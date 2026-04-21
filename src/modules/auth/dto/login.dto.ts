import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'superadmin@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'superadmin123' })
  @IsString()
  @MinLength(4, { message: 'Password must be at least 4 characters long' })
  password: string;
}
