import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';

import { User } from '../users/user.entity';
import { Role } from '../roles/role.entity';
import { UserProfile } from '../user-profiles/user-profile.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Role, UserProfile]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      useFactory: () => ({
        secret: process.env.JWT_SECRET ?? 'dev-secret-change-me',
        signOptions: {
          expiresIn: (process.env.JWT_EXPIRATION ?? '7d') as any,
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService, JwtStrategy, PassportModule, JwtModule],
})
export class AuthModule {}
